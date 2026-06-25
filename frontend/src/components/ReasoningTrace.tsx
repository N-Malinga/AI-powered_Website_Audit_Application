import { useState } from "react";
import type { GroundingResult, PromptLog } from "../types";

type TabKey = "system" | "user" | "structured_input" | "raw_output";

const TABS: { key: TabKey; label: string; field: keyof PromptLog }[] = [
  { key: "system", label: "system", field: "systemPrompt" },
  { key: "user", label: "user", field: "userPrompt" },
  { key: "structured_input", label: "structured_input", field: "structuredInput" },
  { key: "raw_output", label: "raw_output", field: "rawOutput" },
];

export default function ReasoningTrace({
  promptLog,
  grounding,
  url,
}: {
  promptLog: PromptLog | null;
  grounding: GroundingResult;
  url: string;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<TabKey>("system");

  const active = TABS.find((t) => t.key === tab)!;

  return (
    <div className="overflow-hidden rounded-2xl border border-trace-line bg-trace shadow-[0_8px_30px_-14px_rgba(20,18,40,0.4)]">
      {/* window bar / toggle */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 border-b border-trace-line px-5 py-3.5 text-left"
      >
        <div className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-3 font-mono text-xs text-[#8e8aa8]">trace · {url}</span>
        </div>
        <span className="font-mono text-[11px] text-muted">
          {open ? "hide ▴" : "prompt logs ▾"}
        </span>
      </button>

      {open ? (
        promptLog ? (
          <>
            {/* tabs */}
            <div className="flex gap-1 border-b border-trace-line px-4 pt-3">
              {TABS.map((t) => {
                const isActive = t.key === tab;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTab(t.key)}
                    className={`rounded-t-lg px-3 py-2 font-mono text-xs ${
                      isActive
                        ? "border border-b-0 border-trace-line bg-trace-panel text-white"
                        : "text-[#8e8aa8] hover:text-white"
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* body */}
            <div className="px-5 py-5">
              <div className="mb-2.5 font-mono text-[10px] font-semibold tracking-[0.1em] text-cyan">
                // {active.label.toUpperCase().replace(/_/g, " ")}
              </div>
              <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-xl border border-trace-line bg-trace-panel px-4 py-3.5 font-mono text-[12.5px] leading-relaxed text-[#c9c6de]">
                {promptLog[active.field]}
              </pre>

              {/* grounding summary — real GroundingResult, in place of mock token counts */}
              <div className="mt-4 flex flex-wrap gap-4 font-mono text-[11px] text-muted">
                <span>
                  metrics_referenced{" "}
                  <span className="text-[#a78bfa]">
                    {grounding.distinctMetricsReferenced}/{grounding.required}
                  </span>
                </span>
                <span>
                  retried{" "}
                  <span className="text-[#a78bfa]">{grounding.retried ? "yes" : "no"}</span>
                </span>
                <span>
                  grounding{" "}
                  <span className={grounding.passed ? "text-[#28c840]" : "text-warn"}>
                    {grounding.passed ? "✓ passed" : "partial"}
                  </span>
                </span>
              </div>
            </div>
          </>
        ) : (
          <p className="px-5 py-5 font-mono text-xs text-[#8e8aa8]">
            No prompt log was captured for this audit.
          </p>
        )
      ) : null}
    </div>
  );
}
