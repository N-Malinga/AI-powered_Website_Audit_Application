import type { AuditResult } from "../types";

const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:5171").replace(/\/$/, "");

/** RFC7807 problem-details shape the backend returns on errors. */
interface ProblemDetails {
  title?: string;
  detail?: string;
  status?: number;
  errors?: Record<string, string[]>;
}

/**
 * Fire-and-forget ping to wake a cold (Render) backend. Errors are intentionally ignored.
 */
export async function pingHealth(): Promise<void> {
  try {
    await fetch(`${API_URL}/health`, { method: "GET" });
  } catch {
    // The backend may still be waking; the audit call will surface any real error.
  }
}

/**
 * Run an audit for the given URL. Resolves with the AuditResult, or throws an Error whose
 * message is safe to display to the user.
 */
export async function auditWebsite(url: string, signal?: AbortSignal): Promise<AuditResult> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
      signal,
    });
  } catch {
    throw new Error(
      "Couldn't reach the backend. It may still be starting up — please try again in a moment.",
    );
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as AuditResult;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const problem = (await response.json()) as ProblemDetails;

    // Validation errors (400) carry a per-field map.
    if (problem.errors) {
      const messages = Object.values(problem.errors).flat();
      if (messages.length > 0) {
        return messages.join(" ");
      }
    }

    if (problem.detail) return problem.detail;
    if (problem.title) return problem.title;
  } catch {
    // Fall through to a status-based message.
  }

  if (response.status === 503) {
    return "The AI service is busy right now. Please try again in a moment.";
  }
  return `The audit failed (HTTP ${response.status}). Please try again.`;
}
