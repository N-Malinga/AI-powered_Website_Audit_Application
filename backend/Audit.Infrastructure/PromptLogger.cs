using System.Text.Json;
using System.Text.Json.Nodes;
using Audit.Core.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Audit.Infrastructure;

/// <summary>
/// Captures each AI prompt/response exchange: emits it to the logging pipeline and appends a
/// timestamped JSON record to the repo's <c>prompt-logs/</c> folder. Both the original attempt
/// and any grounding retry are recorded verbatim. The configured API key is redacted as a
/// safety net, and logging never throws — a logging failure must not fail an audit.
/// </summary>
public sealed class PromptLogger : IPromptLogger
{
    private static readonly JsonSerializerOptions WriteOptions = new() { WriteIndented = true };

    private readonly ILogger<PromptLogger> _logger;
    private readonly string _directory;
    private readonly string? _apiKey;

    public PromptLogger(IConfiguration configuration, ILogger<PromptLogger> logger)
    {
        _logger = logger;
        _apiKey = configuration["GEMINI_API_KEY"];
        _directory = configuration["PromptLogs:Directory"] ?? ResolveDefaultDirectory();
    }

    public async Task LogAsync(
        string systemPrompt,
        string userPrompt,
        string structuredInput,
        string rawOutput,
        CancellationToken cancellationToken = default)
    {
        systemPrompt = Redact(systemPrompt);
        userPrompt = Redact(userPrompt);
        structuredInput = Redact(structuredInput);
        rawOutput = Redact(rawOutput);

        _logger.LogInformation(
            "AI prompt exchange\n--- SYSTEM PROMPT ---\n{SystemPrompt}\n--- USER PROMPT ---\n{UserPrompt}\n--- STRUCTURED INPUT ---\n{StructuredInput}\n--- RAW OUTPUT ---\n{RawOutput}",
            systemPrompt,
            userPrompt,
            structuredInput,
            rawOutput);

        try
        {
            Directory.CreateDirectory(_directory);

            // structuredInput and rawOutput are themselves JSON — embed them as parsed JSON so
            // the committed records are readable rather than escaped strings.
            var record = new JsonObject
            {
                ["timestamp"] = DateTime.UtcNow.ToString("o"),
                ["systemPrompt"] = systemPrompt,
                ["userPrompt"] = userPrompt,
                ["structuredInput"] = AsJsonOrString(structuredInput),
                ["rawOutput"] = AsJsonOrString(rawOutput),
            };

            var stamp = DateTime.UtcNow.ToString("yyyyMMdd'T'HHmmssfff'Z'");
            var suffix = Guid.NewGuid().ToString("N")[..6];
            var path = Path.Combine(_directory, $"{stamp}-{suffix}.json");
            await File.WriteAllTextAsync(path, record.ToJsonString(WriteOptions), cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to write prompt log to {Directory}.", _directory);
        }
    }

    private string Redact(string value)
    {
        if (string.IsNullOrEmpty(_apiKey) || string.IsNullOrEmpty(value))
        {
            return value;
        }

        return value.Replace(_apiKey, "[REDACTED]", StringComparison.Ordinal);
    }

    private static JsonNode? AsJsonOrString(string value)
    {
        try
        {
            return JsonNode.Parse(value);
        }
        catch (JsonException)
        {
            return JsonValue.Create(value);
        }
    }

    /// <summary>
    /// Resolves <c>prompt-logs/</c> at the repository root (nearest ancestor containing a
    /// <c>.git</c> folder), falling back to the app base directory when no repo is found.
    /// Override with the <c>PromptLogs:Directory</c> config key.
    /// </summary>
    private static string ResolveDefaultDirectory()
    {
        for (var dir = new DirectoryInfo(AppContext.BaseDirectory); dir is not null; dir = dir.Parent)
        {
            if (Directory.Exists(Path.Combine(dir.FullName, ".git")))
            {
                return Path.Combine(dir.FullName, "prompt-logs");
            }
        }

        return Path.Combine(AppContext.BaseDirectory, "prompt-logs");
    }
}
