namespace Audit.Core.Interfaces;

/// <summary>
/// Captures the system prompt, user prompt, structured input, and raw model output
/// for each AI call, for observability and debugging.
/// </summary>
public interface IPromptLogger
{
    /// <summary>Record a single prompt/response exchange.</summary>
    Task LogAsync(string systemPrompt, string userPrompt, string structuredInput, string rawOutput, CancellationToken cancellationToken = default);
}
