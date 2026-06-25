namespace Audit.Core.Models;

/// <summary>
/// The AI layer's output: grounded insights and recommendations interpreting the metrics,
/// plus the <see cref="PromptLog"/> for the exchange that produced them.
/// </summary>
public sealed record AiAnalysis(
    IReadOnlyList<Insight> Insights,
    IReadOnlyList<Recommendation> Recommendations,
    PromptLog? PromptLog);
