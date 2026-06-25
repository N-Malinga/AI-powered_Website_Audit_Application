namespace Audit.Core.Models;

/// <summary>
/// An actionable, agency-framed recommendation derived from the metrics and insights.
/// <see cref="RelatedMetrics"/> ties it back to the ground-truth numbers it addresses.
/// </summary>
public sealed record Recommendation(
    Priority Priority,
    string Title,
    string Action,
    string Reasoning,
    IReadOnlyList<string> RelatedMetrics);
