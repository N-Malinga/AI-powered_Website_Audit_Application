namespace Audit.Core.Models;

/// <summary>
/// The AI layer's output: grounded insights and recommendations interpreting the metrics,
/// the <see cref="PromptLog"/> for the exchange that produced them, and the grounding-guard result.
/// </summary>
public sealed record AiAnalysis(
    IReadOnlyList<Insight> Insights,
    IReadOnlyList<Recommendation> Recommendations,
    PromptLog? PromptLog,
    GroundingResult Grounding);
