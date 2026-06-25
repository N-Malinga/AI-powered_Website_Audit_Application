using Audit.Core.Interfaces;
using Microsoft.Extensions.Logging;

namespace Audit.Infrastructure;

/// <summary>
/// Captures each AI prompt/response exchange via the logging pipeline so both the original
/// attempt and any grounding retry are recorded verbatim.
/// </summary>
public sealed class PromptLogger : IPromptLogger
{
    private readonly ILogger<PromptLogger> _logger;

    public PromptLogger(ILogger<PromptLogger> logger)
    {
        _logger = logger;
    }

    public Task LogAsync(
        string systemPrompt,
        string userPrompt,
        string structuredInput,
        string rawOutput,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "AI prompt exchange\n--- SYSTEM PROMPT ---\n{SystemPrompt}\n--- USER PROMPT ---\n{UserPrompt}\n--- STRUCTURED INPUT ---\n{StructuredInput}\n--- RAW OUTPUT ---\n{RawOutput}",
            systemPrompt,
            userPrompt,
            structuredInput,
            rawOutput);

        return Task.CompletedTask;
    }
}
