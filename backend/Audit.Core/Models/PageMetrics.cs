namespace Audit.Core.Models;

/// <summary>
/// Factual, deterministically-extracted metrics for a single page.
/// Computed in code and treated as ground truth — the AI layer only interprets these.
/// Fields are added in the metrics-extraction phase.
/// </summary>
public record PageMetrics;
