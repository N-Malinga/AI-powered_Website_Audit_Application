namespace Audit.Core.Models;

/// <summary>
/// Factual, deterministically-extracted metrics for a single page.
/// Computed in code and treated as ground truth — the AI layer only interprets these,
/// it never computes or estimates them.
/// </summary>
public sealed record PageMetrics(
    int WordCount,
    int H1Count,
    int H2Count,
    int H3Count,
    int CtaCount,
    int InternalLinks,
    int ExternalLinks,
    int ImageCount,
    int ImagesMissingAltCount,
    double ImagesMissingAltPercent,
    string? MetaTitle,
    string? MetaDescription);
