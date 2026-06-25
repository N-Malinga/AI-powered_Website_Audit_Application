using Audit.Core.Interfaces;
using Audit.Core.Models;
using MediatR;

namespace Audit.Core.Application;

/// <summary>
/// Orchestrates a single audit: fetch raw HTML, deterministically extract metrics, then
/// hand the metrics (plus trimmed content) to the AI layer for grounded interpretation.
/// The metrics are ground truth; the AI never recomputes them.
/// </summary>
public sealed class AuditWebsiteCommandHandler : IRequestHandler<AuditWebsiteCommand, AuditResult>
{
    private readonly IPageFetcher _pageFetcher;
    private readonly IMetricsExtractor _metricsExtractor;
    private readonly IAiAnalyzer _aiAnalyzer;

    public AuditWebsiteCommandHandler(
        IPageFetcher pageFetcher,
        IMetricsExtractor metricsExtractor,
        IAiAnalyzer aiAnalyzer)
    {
        _pageFetcher = pageFetcher;
        _metricsExtractor = metricsExtractor;
        _aiAnalyzer = aiAnalyzer;
    }

    public async Task<AuditResult> Handle(AuditWebsiteCommand request, CancellationToken cancellationToken)
    {
        var html = await _pageFetcher.FetchAsync(request.Url, cancellationToken);
        var metrics = _metricsExtractor.Extract(html);

        // The analyzer trims the raw HTML (headings + first 600 words) when building its prompt.
        var analysis = await _aiAnalyzer.AnalyzeAsync(metrics, html, cancellationToken);

        return new AuditResult(
            metrics,
            analysis.Insights,
            analysis.Recommendations,
            analysis.PromptLog,
            analysis.Grounding);
    }
}
