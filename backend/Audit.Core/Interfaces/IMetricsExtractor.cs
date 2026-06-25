using Audit.Core.Models;

namespace Audit.Core.Interfaces;

/// <summary>
/// Deterministically extracts <see cref="PageMetrics"/> from raw HTML.
/// This is the ground-truth layer — unit-tested, no AI involvement.
/// </summary>
public interface IMetricsExtractor
{
    /// <summary>Extract metrics from the given raw <paramref name="html"/>.</summary>
    PageMetrics Extract(string html);
}
