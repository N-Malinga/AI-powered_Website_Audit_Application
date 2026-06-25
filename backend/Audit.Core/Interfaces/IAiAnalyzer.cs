using Audit.Core.Models;

namespace Audit.Core.Interfaces;

/// <summary>
/// Interprets the deterministic metrics (plus trimmed page content) into grounded
/// insights and recommendations. Never computes or estimates metrics itself.
/// </summary>
public interface IAiAnalyzer
{
    /// <summary>Produce an <see cref="AiAnalysis"/> grounded in the given metrics and content.</summary>
    Task<AiAnalysis> AnalyzeAsync(PageMetrics metrics, string trimmedContent, CancellationToken cancellationToken = default);
}
