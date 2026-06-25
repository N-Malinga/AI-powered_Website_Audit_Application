using Audit.Core.Interfaces;
using Audit.Core.Models;

namespace Audit.Infrastructure;

/// <summary>
/// AI analysis via Gemini 2.5 Flash. Stub — implemented in the logic phase.
/// </summary>
public sealed class GeminiAiAnalyzer : IAiAnalyzer
{
    public Task<AiAnalysis> AnalyzeAsync(PageMetrics metrics, string trimmedContent, CancellationToken cancellationToken = default)
        => throw new NotImplementedException();
}
