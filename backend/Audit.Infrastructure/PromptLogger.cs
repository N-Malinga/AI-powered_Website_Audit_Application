using Audit.Core.Interfaces;

namespace Audit.Infrastructure;

/// <summary>
/// Captures prompt/response exchanges for observability. Stub — implemented in the logic phase.
/// </summary>
public sealed class PromptLogger : IPromptLogger
{
    public Task LogAsync(string systemPrompt, string userPrompt, string structuredInput, string rawOutput, CancellationToken cancellationToken = default)
        => throw new NotImplementedException();
}
