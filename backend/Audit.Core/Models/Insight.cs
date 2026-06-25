namespace Audit.Core.Models;

/// <summary>
/// A grounded observation produced by the AI layer. Every insight must cite specific
/// metric values in <see cref="Evidence"/>.
/// </summary>
public sealed record Insight(
    string Category,
    string Observation,
    Severity Severity,
    IReadOnlyList<string> Evidence);
