namespace Audit.Core.Models;

/// <summary>
/// Outcome of the grounding guard: whether the AI output cited enough real metric values,
/// how many distinct values it referenced, the threshold required, and whether a grounding
/// retry was needed. Surfaced on the audit response for transparency.
/// </summary>
public sealed record GroundingResult(
    bool Passed,
    int DistinctMetricsReferenced,
    int Required,
    bool Retried);
