import type { GroundingResult, PromptLog } from "../types";

function TraceBlock({ label, content }: { label: string; content: string }) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-900 p-3 font-mono text-xs leading-relaxed text-slate-100">
        {content}
      </pre>
    </div>
  );
}

export default function ReasoningTrace({
  promptLog,
  grounding,
}: {
  promptLog: PromptLog | null;
  grounding: GroundingResult;
}) {
  return (
    <details className="group rounded-xl border border-slate-200 bg-white shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm font-medium text-slate-700">
        <span>View reasoning trace</span>
        <span className="text-slate-400 transition-transform group-open:rotate-180">▾</span>
      </summary>

      <div className="space-y-4 border-t border-slate-100 p-4">
        <div
          className={`rounded-lg p-3 text-sm ${
            grounding.passed
              ? "bg-emerald-50 text-emerald-800"
              : "bg-amber-50 text-amber-800"
          }`}
        >
          <span className="font-semibold">
            Grounding {grounding.passed ? "passed" : "fell short"}
          </span>{" "}
          — cited {grounding.distinctMetricsReferenced} of {grounding.required} required distinct
          metric values{grounding.retried ? "; retried once with a grounding nudge" : ""}.
        </div>

        {promptLog ? (
          <>
            <TraceBlock label="System Prompt" content={promptLog.systemPrompt} />
            <TraceBlock label="User Prompt" content={promptLog.userPrompt} />
            <TraceBlock label="Structured Input" content={promptLog.structuredInput} />
            <TraceBlock label="Raw Model Output" content={promptLog.rawOutput} />
          </>
        ) : (
          <p className="text-sm text-slate-500">No prompt log was captured for this audit.</p>
        )}
      </div>
    </details>
  );
}
