using System.Text;
using AngleSharp.Dom;
using AngleSharp.Html.Parser;
using Audit.Core.Interfaces;
using Audit.Core.Models;

namespace Audit.Infrastructure;

/// <summary>
/// Deterministically extracts <see cref="PageMetrics"/> from raw HTML using AngleSharp.
/// Pure and side-effect free: parses the supplied HTML and computes metrics from the DOM,
/// with no network access. These numbers are the ground truth the AI layer interprets.
/// </summary>
public sealed class AngleSharpMetricsExtractor : IMetricsExtractor
{
    private static readonly HtmlParser Parser = new();

    // Class tokens that, when present on an <a>, signal it is styled as a primary action.
    private static readonly string[] CtaClassKeywords =
        { "btn", "button", "cta", "call-to-action" };

    // Anchor text (normalized, lower-cased) that signals a primary action.
    private static readonly string[] CtaTextPhrases =
    {
        "sign up", "signup", "get started", "buy now", "subscribe", "contact us",
        "learn more", "download", "try free", "try for free", "start free",
        "register", "book now", "request a demo", "request a quote", "get a quote",
        "add to cart", "shop now", "donate", "order now", "join now",
    };

    public PageMetrics Extract(string html)
    {
        var document = Parser.ParseDocument(html ?? string.Empty);

        var (internalLinks, externalLinks) = CountLinks(document);

        var images = document.QuerySelectorAll("img");
        var imageCount = images.Length;
        var imagesMissingAlt = images.Count(i => string.IsNullOrWhiteSpace(i.GetAttribute("alt")));
        var imagesMissingAltPercent = imageCount == 0
            ? 0d
            : Math.Round(imagesMissingAlt * 100d / imageCount, 2, MidpointRounding.AwayFromZero);

        return new PageMetrics(
            WordCount: CountVisibleWords(document),
            H1Count: document.QuerySelectorAll("h1").Length,
            H2Count: document.QuerySelectorAll("h2").Length,
            H3Count: document.QuerySelectorAll("h3").Length,
            CtaCount: CountCallsToAction(document),
            InternalLinks: internalLinks,
            ExternalLinks: externalLinks,
            ImageCount: imageCount,
            ImagesMissingAltCount: imagesMissingAlt,
            ImagesMissingAltPercent: imagesMissingAltPercent,
            MetaTitle: Nullify(document.Title),
            MetaDescription: Nullify(document.QuerySelector("meta[name=description]")?.GetAttribute("content")));
    }

    /// <summary>
    /// Counts visible words in the body, excluding the text content of script/style/noscript
    /// elements. Words are whitespace-delimited tokens.
    /// </summary>
    private static int CountVisibleWords(IDocument document)
    {
        var body = document.Body;
        if (body is null)
        {
            return 0;
        }

        var builder = new StringBuilder();
        foreach (var text in body.Descendants<IText>())
        {
            if (IsInExcludedElement(text))
            {
                continue;
            }

            builder.Append(text.Data);
            builder.Append(' ');
        }

        return builder.ToString().Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries).Length;
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

    /// <summary>
    /// CTA heuristic, centralized here. A call-to-action is counted as:
    ///   * every &lt;button&gt; element, plus
    ///   * every &lt;a&gt; that looks like a primary action because it has role="button",
    ///     a class containing a button/cta token, or anchor text matching a known action phrase.
    /// This is intentionally a heuristic and may over- or under-count on unusual markup.
    /// </summary>
    private static int CountCallsToAction(IDocument document)
    {
        var buttons = document.QuerySelectorAll("button").Length;
        var actionAnchors = document.QuerySelectorAll("a").Count(IsActionAnchor);
        return buttons + actionAnchors;
    }

    private static bool IsActionAnchor(IElement anchor)
    {
        if (string.Equals(anchor.GetAttribute("role"), "button", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        var className = anchor.GetAttribute("class");
        if (!string.IsNullOrEmpty(className))
        {
            var lowered = className.ToLowerInvariant();
            if (CtaClassKeywords.Any(keyword => lowered.Contains(keyword, StringComparison.Ordinal)))
            {
                return true;
            }
        }

        var text = NormalizeWhitespace(anchor.TextContent).ToLowerInvariant();
        return text.Length > 0 && CtaTextPhrases.Any(phrase => text.Contains(phrase, StringComparison.Ordinal));
    }

    /// <summary>
    /// Classifies each anchor as internal or external. The page's own host is inferred from
    /// &lt;base href&gt;, &lt;link rel="canonical"&gt;, or og:url (no network lookup). Relative and
    /// same-host links are internal; links to a different host are external. Non-navigational
    /// links (mailto:, tel:, javascript:, empty) are ignored. If the page host cannot be
    /// determined, absolute http(s) links are treated as external.
    /// </summary>
    private static (int Internal, int External) CountLinks(IDocument document)
    {
        var pageHost = TryGetPageHost(document);
        var internalCount = 0;
        var externalCount = 0;

        foreach (var anchor in document.QuerySelectorAll("a"))
        {
            var href = anchor.GetAttribute("href")?.Trim();
            if (string.IsNullOrEmpty(href))
            {
                continue;
            }

            if (href.StartsWith('#'))
            {
                internalCount++;
                continue;
            }

            // Protocol-relative URLs (//host/path) have a host but no scheme.
            var candidate = href.StartsWith("//", StringComparison.Ordinal) ? "http:" + href : href;

            if (Uri.TryCreate(candidate, UriKind.Absolute, out var uri))
            {
                if (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps)
                {
                    continue; // mailto:, tel:, javascript:, etc. are not page links.
                }

                if (pageHost is not null && HostEquals(uri.Host, pageHost))
                {
                    internalCount++;
                }
                else
                {
                    externalCount++;
                }
            }
            else
            {
                // A relative URL resolves against the page itself.
                internalCount++;
            }
        }

        return (internalCount, externalCount);
    }

    private static string? TryGetPageHost(IDocument document)
    {
        var candidates = new[]
        {
            document.QuerySelector("base[href]")?.GetAttribute("href"),
            document.QuerySelector("link[rel=canonical]")?.GetAttribute("href"),
            document.QuerySelector("meta[property='og:url']")?.GetAttribute("content"),
        };

        foreach (var candidate in candidates)
        {
            if (!string.IsNullOrWhiteSpace(candidate)
                && Uri.TryCreate(candidate, UriKind.Absolute, out var uri)
                && !string.IsNullOrEmpty(uri.Host))
            {
                return uri.Host;
            }
        }

        return null;
    }

    private static bool HostEquals(string a, string b)
    {
        static string StripWww(string host) =>
            host.StartsWith("www.", StringComparison.OrdinalIgnoreCase) ? host[4..] : host;

        return string.Equals(StripWww(a), StripWww(b), StringComparison.OrdinalIgnoreCase);
    }

    private static string NormalizeWhitespace(string value) =>
        string.Join(' ', value.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));

    private static string? Nullify(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
