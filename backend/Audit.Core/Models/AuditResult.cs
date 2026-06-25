namespace Audit.Core.Models;

/// <summary>
/// The full audit response: the deterministic metrics plus the AI-generated insights and
/// recommendations, the prompt log for the AI exchange, and the grounding-guard result.
/// </summary>
public sealed record AuditResult(
    PageMetrics Metrics,
    IReadOnlyList<Insight> Insights,
    IReadOnlyList<Recommendation> Recommendations,
    PromptLog? PromptLog,
    GroundingResult Grounding);
