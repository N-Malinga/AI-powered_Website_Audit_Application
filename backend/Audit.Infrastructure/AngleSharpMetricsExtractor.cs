using Audit.Core.Interfaces;
using Audit.Core.Models;

namespace Audit.Infrastructure;

/// <summary>
/// Deterministic metrics extraction using AngleSharp. Stub — implemented in the logic phase.
/// </summary>
public sealed class AngleSharpMetricsExtractor : IMetricsExtractor
{
    public PageMetrics Extract(string html)
        => throw new NotImplementedException();
}
