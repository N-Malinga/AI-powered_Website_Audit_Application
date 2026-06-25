using System.Globalization;
using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using AngleSharp.Dom;
using AngleSharp.Html.Parser;
using Audit.Core.Interfaces;
using Audit.Core.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Audit.Infrastructure;

/// <summary>
/// AI analysis via the Gemini 2.5 Flash generateContent endpoint. Sends the factual metrics
/// (plus objective severity flags decided in code) and a trimmed content slice, constrains the
/// model to a JSON schema matching our records, and interprets — never recomputes — the metrics.
/// Includes a 429 backoff retry and a grounding guard that retries once if the model fails to
/// cite enough real metric values.
/// </summary>
public sealed class GeminiAiAnalyzer : IAiAnalyzer
{
    /// <summary>
    /// Verbatim system prompt. Kept as a const so the prompt logger captures exactly what is sent.
    /// </summary>
    public const string SystemPrompt =
        """
        You are a senior website auditor at a digital marketing agency that builds
        high-performing, SEO-focused marketing websites. You audit ONE web page.

        Rules:
        - You are given FACTUAL METRICS already extracted from the page. Treat them as
          ground truth. Never estimate, recompute, or invent a metric.
        - Every insight and every recommendation MUST cite specific metric values by name
          and number (e.g. "with 2 H1 tags" or "47% of images missing alt text").
        - Be specific to THIS page. Never give advice that would apply to any website.
        - Frame everything in agency terms: SEO, conversion, content clarity, UX.
        - If a metric shows no problem, say so briefly — do not manufacture an issue.
        - Output ONLY valid JSON matching the provided schema. No prose, no markdown.
        """;

    private const string ModelPath = "v1beta/models/gemini-2.5-flash:generateContent";
    private const string GroundingRetryNudge =
        "Your previous answer was too generic. Reference the actual metric numbers.";

    /// <summary>Distinct real metric values the model must cite for the grounding guard to pass.</summary>
    private const int MinimumGroundingReferences = 3;

    private const int BodyWordLimit = 600;

    private static readonly string[] InsightCategories =
        { "seoStructure", "messagingClarity", "ctaUsage", "contentDepth", "uxStructural" };

    private static readonly HtmlParser HtmlParser = new();

    // Naming preserved exactly (no camelCase policy) so Gemini receives the keys it expects.
    private static readonly JsonSerializerOptions RequestOptions = new();

    // For deserializing the model's JSON output into our records.
    private static readonly JsonSerializerOptions ResponseOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() }
    };

    // For the human-readable structured input we put in the prompt and the logger.
    private static readonly JsonSerializerOptions PromptJsonOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        Converters = { new JsonStringEnumConverter() }
    };

    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly IPromptLogger _promptLogger;
    private readonly ILogger<GeminiAiAnalyzer> _logger;

    public GeminiAiAnalyzer(
        HttpClient httpClient,
        IConfiguration configuration,
        IPromptLogger promptLogger,
        ILogger<GeminiAiAnalyzer> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _promptLogger = promptLogger;
        _logger = logger;
    }

    public async Task<AiAnalysis> AnalyzeAsync(
        PageMetrics metrics,
        string trimmedContent,
        CancellationToken cancellationToken = default)
    {
        var apiKey = _configuration["GEMINI_API_KEY"]
            ?? throw new InvalidOperationException("GEMINI_API_KEY is not configured.");

        var severityFlags = ComputeSeverityFlags(metrics);
        var structuredInput = JsonSerializer.Serialize(
            new { metrics, severityFlags }, PromptJsonOptions);
        var content = BuildTrimmedContent(trimmedContent);
        var basePrompt = BuildUserPrompt(structuredInput, content);

        // Attempt 1.
        var raw = await CallGeminiAsync(apiKey, basePrompt, cancellationToken);
        await _promptLogger.LogAsync(SystemPrompt, basePrompt, structuredInput, raw, cancellationToken);
        var (insights, recommendations) = ParseAnalysis(raw);
        var referenced = CountReferencedMetricValues(metrics, insights, recommendations);

        if (referenced >= MinimumGroundingReferences)
        {
            return Build(insights, recommendations, basePrompt, structuredInput, raw, referenced, retried: false);
        }

        // Grounding guard failed — retry once with an explicit nudge.
        _logger.LogWarning(
            "Grounding guard: only {Referenced} of {Required} distinct metric values cited; retrying.",
            referenced, MinimumGroundingReferences);

        var retryPrompt = basePrompt + "\n\n" + GroundingRetryNudge;
        raw = await CallGeminiAsync(apiKey, retryPrompt, cancellationToken);
        await _promptLogger.LogAsync(SystemPrompt, retryPrompt, structuredInput, raw, cancellationToken);
        (insights, recommendations) = ParseAnalysis(raw);
        referenced = CountReferencedMetricValues(metrics, insights, recommendations);

        return Build(insights, recommendations, retryPrompt, structuredInput, raw, referenced, retried: true);
    }

    private static AiAnalysis Build(
        IReadOnlyList<Insight> insights,
        IReadOnlyList<Recommendation> recommendations,
        string userPrompt,
        string structuredInput,
        string rawOutput,
        int referenced,
        bool retried)
    {
        var grounding = new GroundingResult(
            Passed: referenced >= MinimumGroundingReferences,
            DistinctMetricsReferenced: referenced,
            Required: MinimumGroundingReferences,
            Retried: retried);

        var promptLog = new PromptLog(SystemPrompt, userPrompt, structuredInput, rawOutput);
        return new AiAnalysis(insights, recommendations, promptLog, grounding);
    }

    // ---- Gemini call ------------------------------------------------------------------

    private async Task<string> CallGeminiAsync(string apiKey, string userPrompt, CancellationToken cancellationToken)
    {
        var body = JsonSerializer.Serialize(BuildRequestBody(userPrompt), RequestOptions);
        var requestUri = $"{ModelPath}?key={Uri.EscapeDataString(apiKey)}";

        const int maxAttempts = 2; // initial call + one retry on 429
        for (var attempt = 1; ; attempt++)
        {
            using var requestContent = new StringContent(body, Encoding.UTF8, "application/json");
            using var response = await _httpClient.PostAsync(requestUri, requestContent, cancellationToken);

            // 429 (rate limited) and 503 (model overloaded) are transient — retry once with backoff.
            if (IsTransient(response.StatusCode) && attempt < maxAttempts)
            {
                var delay = response.Headers.RetryAfter?.Delta
                    ?? TimeSpan.FromSeconds(Math.Pow(2, attempt)); // exponential backoff
                _logger.LogWarning(
                    "Gemini returned {StatusCode}; backing off {Delay} before retry.",
                    (int)response.StatusCode, delay);
                await Task.Delay(delay, cancellationToken);
                continue;
            }

            response.EnsureSuccessStatusCode();
            var payload = await response.Content.ReadAsStringAsync(cancellationToken);
            return ExtractModelText(payload);
        }
    }

    private static bool IsTransient(HttpStatusCode statusCode) =>
        statusCode is HttpStatusCode.TooManyRequests or HttpStatusCode.ServiceUnavailable;

    private static object BuildRequestBody(string userPrompt) => new
    {
        systemInstruction = new { parts = new[] { new { text = SystemPrompt } } },
        contents = new[] { new { role = "user", parts = new[] { new { text = userPrompt } } } },
        generationConfig = new
        {
            responseMimeType = "application/json",
            responseSchema = BuildResponseSchema()
        }
    };

    private static object BuildResponseSchema()
    {
        static object StringType() => new { type = "string" };
        static object StringArray() => new { type = "array", items = new { type = "string" } };

        static object InsightSchema() => new
        {
            type = "object",
            properties = new
            {
                observation = StringType(),
                severity = new { type = "string", @enum = new[] { "Ok", "Minor", "Warning", "Critical" } },
                evidence = StringArray()
            },
            required = new[] { "observation", "severity", "evidence" }
        };

        var recommendationSchema = new
        {
            type = "object",
            properties = new
            {
                priority = new { type = "string", @enum = new[] { "Low", "Medium", "High" } },
                title = StringType(),
                action = StringType(),
                reasoning = StringType(),
                relatedMetrics = StringArray()
            },
            required = new[] { "priority", "title", "action", "reasoning", "relatedMetrics" }
        };

        return new
        {
            type = "object",
            properties = new
            {
                insights = new
                {
                    type = "object",
                    properties = new
                    {
                        seoStructure = InsightSchema(),
                        messagingClarity = InsightSchema(),
                        ctaUsage = InsightSchema(),
                        contentDepth = InsightSchema(),
                        uxStructural = InsightSchema()
                    },
                    required = InsightCategories
                },
                recommendations = new
                {
                    type = "array",
                    items = recommendationSchema,
                    minItems = 3,
                    maxItems = 5
                }
            },
            required = new[] { "insights", "recommendations" }
        };
    }

    private static string ExtractModelText(string payload)
    {
        using var document = JsonDocument.Parse(payload);
        var root = document.RootElement;

        if (!root.TryGetProperty("candidates", out var candidates)
            || candidates.ValueKind != JsonValueKind.Array
            || candidates.GetArrayLength() == 0)
        {
            throw new InvalidOperationException("Gemini response contained no candidates.");
        }

        var text = candidates[0]
            .GetProperty("content")
            .GetProperty("parts")[0]
            .GetProperty("text")
            .GetString();

        return text ?? throw new InvalidOperationException("Gemini response contained no text.");
    }

    // ---- Parsing ----------------------------------------------------------------------

    private static (IReadOnlyList<Insight> Insights, IReadOnlyList<Recommendation> Recommendations)
        ParseAnalysis(string modelJson)
    {
        var dto = JsonSerializer.Deserialize<AnalysisDto>(modelJson, ResponseOptions)
            ?? throw new InvalidOperationException("Could not deserialize Gemini analysis.");

        var insights = new List<Insight>();

        // Emit in canonical category order for deterministic output.
        foreach (var category in InsightCategories)
        {
            if (dto.Insights is not null && dto.Insights.TryGetValue(category, out var body) && body is not null)
            {
                insights.Add(new Insight(category, body.Observation, body.Severity, body.Evidence ?? Array.Empty<string>()));
            }
        }

        return (insights, dto.Recommendations ?? new List<Recommendation>());
    }

    private sealed record AnalysisDto(
        Dictionary<string, InsightBodyDto>? Insights,
        List<Recommendation>? Recommendations);

    private sealed record InsightBodyDto(
        string Observation,
        Severity Severity,
        IReadOnlyList<string>? Evidence);

    // ---- Grounding guard --------------------------------------------------------------

    /// <summary>
    /// Counts how many distinct real metric values from <paramref name="metrics"/> actually
    /// appear (as whole numbers, word-boundary matched) in the model's evidence, reasoning,
    /// and relatedMetrics text.
    /// </summary>
    private static int CountReferencedMetricValues(
        PageMetrics metrics,
        IReadOnlyList<Insight> insights,
        IReadOnlyList<Recommendation> recommendations)
    {
        var haystack = new StringBuilder();
        foreach (var insight in insights)
        {
            foreach (var evidence in insight.Evidence)
            {
                haystack.AppendLine(evidence);
            }
        }

        foreach (var recommendation in recommendations)
        {
            haystack.AppendLine(recommendation.Reasoning);
            foreach (var related in recommendation.RelatedMetrics)
            {
                haystack.AppendLine(related);
            }
        }

        var text = haystack.ToString();

        return MetricValueTokens(metrics)
            .Count(token => Regex.IsMatch(text, $@"\b{Regex.Escape(token)}\b"));
    }

    private static IEnumerable<string> MetricValueTokens(PageMetrics m)
    {
        var tokens = new HashSet<string>(StringComparer.Ordinal);

        void Add(string token)
        {
            if (!string.IsNullOrWhiteSpace(token))
            {
                tokens.Add(token);
            }
        }

        Add(m.WordCount.ToString(CultureInfo.InvariantCulture));
        Add(m.H1Count.ToString(CultureInfo.InvariantCulture));
        Add(m.H2Count.ToString(CultureInfo.InvariantCulture));
        Add(m.H3Count.ToString(CultureInfo.InvariantCulture));
        Add(m.CtaCount.ToString(CultureInfo.InvariantCulture));
        Add(m.InternalLinks.ToString(CultureInfo.InvariantCulture));
        Add(m.ExternalLinks.ToString(CultureInfo.InvariantCulture));
        Add(m.ImageCount.ToString(CultureInfo.InvariantCulture));
        Add(m.ImagesMissingAltCount.ToString(CultureInfo.InvariantCulture));
        // Percentage in both exact (33.33) and rounded (33) forms the model might use.
        Add(m.ImagesMissingAltPercent.ToString(CultureInfo.InvariantCulture));
        Add(Math.Round(m.ImagesMissingAltPercent).ToString(CultureInfo.InvariantCulture));

        return tokens;
    }

    // ---- Severity flags (hybrid) ------------------------------------------------------

    /// <summary>
    /// Objective severity decided in code from fixed thresholds. Passed to the model as ground
    /// truth so it explains and prioritizes them rather than re-deciding severity itself.
    /// </summary>
    private static IReadOnlyList<SeverityFlag> ComputeSeverityFlags(PageMetrics m)
    {
        return new List<SeverityFlag>
        {
            new("h1Count", m.H1Count,
                m.H1Count != 1 ? Severity.Warning : Severity.Ok,
                m.H1Count != 1
                    ? "A page should have exactly one H1 for clear SEO structure."
                    : "Exactly one H1 — good SEO structure."),

            new("imagesMissingAltPercent", m.ImagesMissingAltPercent,
                m.ImagesMissingAltPercent > 30 ? Severity.Warning : Severity.Ok,
                m.ImagesMissingAltPercent > 30
                    ? "Over 30% of images lack alt text, hurting accessibility and image SEO."
                    : "Most images have alt text."),

            new("metaDescription", m.MetaDescription is null ? "absent" : "present",
                m.MetaDescription is null ? Severity.Warning : Severity.Ok,
                m.MetaDescription is null
                    ? "No meta description; search engines lack a controlled snippet."
                    : "Meta description present."),

            new("wordCount", m.WordCount,
                m.WordCount < 300 ? Severity.Minor : Severity.Ok,
                m.WordCount < 300
                    ? "Thin content (under 300 words) may limit ranking potential."
                    : "Sufficient content depth."),
        };
    }

    private sealed record SeverityFlag(string Metric, object Value, Severity Severity, string Rationale);

    // ---- Prompt + content -------------------------------------------------------------

    private static string BuildUserPrompt(string structuredInput, string trimmedContent) =>
        $"""
        Audit this single web page.

        FACTUAL METRICS AND OBJECTIVE SEVERITY FLAGS (ground truth — the severity flags were
        decided in code from fixed thresholds; explain and prioritize them, do not re-decide
        severity):

        {structuredInput}

        TRIMMED PAGE CONTENT (headings in document order, then the first {BodyWordLimit} words
        of body text):

        {trimmedContent}

        Return ONLY JSON matching the schema: an "insights" object with one entry per category
        (seoStructure, messagingClarity, ctaUsage, contentDepth, uxStructural) and a
        "recommendations" array of 3 to 5 items.
        """;

    /// <summary>
    /// Produces the trimmed content slice from the fetched HTML: all headings in document order,
    /// followed by the first <see cref="BodyWordLimit"/> visible body words (script/style/noscript
    /// excluded). Pure — no network access.
    /// </summary>
    private static string BuildTrimmedContent(string html)
    {
        var document = HtmlParser.ParseDocument(html ?? string.Empty);

        var headings = document
            .QuerySelectorAll("h1, h2, h3, h4, h5, h6")
            .Select(h => $"{h.NodeName}: {NormalizeWhitespace(h.TextContent)}")
            .Where(line => line.Length > 0);

        var bodyWords = string.Join(' ', VisibleWords(document).Take(BodyWordLimit));

        var builder = new StringBuilder();
        builder.AppendLine("HEADINGS:");
        builder.AppendLine(string.Join('\n', headings));
        builder.AppendLine();
        builder.AppendLine($"BODY (first {BodyWordLimit} words):");
        builder.Append(bodyWords);
        return builder.ToString();
    }

    private static IEnumerable<string> VisibleWords(IDocument document)
    {
        var body = document.Body;
        if (body is null)
        {
            yield break;
        }

        foreach (var text in body.Descendants<IText>())
        {
            if (IsInExcludedElement(text))
            {
                continue;
            }

            foreach (var word in text.Data.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries))
            {
                yield return word;
            }
        }
    }

    private static bool IsInExcludedElement(INode node)
    {
        for (var parent = node.ParentElement; parent is not null; parent = parent.ParentElement)
        {
            if (parent.NodeName is "SCRIPT" or "STYLE" or "NOSCRIPT")
            {
                return true;
            }
        }

        return false;
    }

    private static string NormalizeWhitespace(string value) =>
        string.Join(' ', value.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));
}
