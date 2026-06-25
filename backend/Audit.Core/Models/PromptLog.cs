namespace Audit.Core.Models;

/// <summary>
/// Captures a single AI exchange for observability: the system prompt, the user prompt,
/// the structured metric input we supplied, and the raw model output.
/// </summary>
public sealed record PromptLog(
    string SystemPrompt,
    string UserPrompt,
    string StructuredInput,
    string RawOutput);
