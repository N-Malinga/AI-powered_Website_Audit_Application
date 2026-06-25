import type { AuditResult } from "../types";
import MetricsTable from "./MetricsTable";
import InsightsList from "./InsightsList";
import RecommendationsList from "./RecommendationsList";
import ReasoningTrace from "./ReasoningTrace";

export default function ReportView({
  result,
  url,
  onReset,
}: {
  result: AuditResult;
  url: string;
  onReset: () => void;
}) {
  const { grounding, metrics } = result;
  const groundPct =
    grounding.required > 0
      ? Math.min(100, Math.round((grounding.distinctMetricsReferenced / grounding.required) * 100))
      : 0;

  let host = url;
  try {
    host = new URL(url).hostname;
  } catch {
    /* keep raw url */
  }
  const headline = metrics.metaTitle?.trim() || host;

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-hidden rounded-2xl border border-[#e7e9f2] bg-panel shadow-[0_1px_3px_rgba(20,18,40,0.06)]">
        {/* gradient hero */}
        <div
          className="relative overflow-hidden px-6 pb-20 pt-6 sm:px-9"
          style={{ backgroundImage: "linear-gradient(125deg,#5B21B6,#2563EB 52%,#06B6D4)" }}
        >
          <div
            className="pointer-events-none absolute -right-10 -top-16 h-72 w-72 rounded-full"
            style={{ background: "radial-gradient(circle,rgba(255,255,255,.18),transparent 70%)" }}
          />
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-6 w-6 rounded-lg bg-white/90" />
              <div className="font-display text-lg font-semibold tracking-tight text-white">
                PageLens AI
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-lg border border-white/30 bg-white/10 px-3.5 py-2 font-sans text-[13px] font-medium text-white transition-colors hover:bg-white/20"
              >
                Export
              </button>
              <button
                type="button"
                onClick={onReset}
                className="rounded-lg bg-white px-3.5 py-2 font-sans text-[13px] font-semibold text-azure transition-opacity hover:opacity-90"
              >
                New audit
              </button>
            </div>
          </div>

          <div className="relative mt-7">
            <div className="flex items-center gap-2.5 font-mono text-[13px] text-white/80">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: "#7CFCE0" }} />
              <span className="truncate">{url}</span>
            </div>
            <h2 className="mt-3.5 max-w-3xl font-display text-2xl font-semibold leading-tight tracking-tight text-white sm:text-[28px]">
              {headline}
            </h2>
          </div>
        </div>

        {/* floating grounding card (replaces the design's mock 0–100 score) */}
        <div className="relative mx-4 -mt-14 flex flex-col gap-5 rounded-2xl border border-[#eaebf3] bg-white p-5 shadow-[0_18px_40px_-22px_rgba(37,99,235,0.35)] sm:mx-9 sm:flex-row sm:items-center sm:p-6">
          <div
            className="relative h-[108px] w-[108px] flex-shrink-0 rounded-full"
            style={{
              background: `conic-gradient(from 0deg,#7C3AED,#2563EB 40%,#06B6D4 ${groundPct}%,#ECEDF4 ${groundPct}%)`,
            }}
          >
            <div className="absolute inset-[12px] flex flex-col items-center justify-center rounded-full bg-white">
              <div className="font-display text-2xl font-semibold leading-none text-ink">
                {grounding.distinctMetricsReferenced}
                <span className="text-faint">/{grounding.required}</span>
              </div>
              <div className="mt-1 font-mono text-[9px] tracking-[0.12em] text-faint">GROUNDING</div>
            </div>
          </div>
          <div className="flex-1">
            <div
              className="mb-2 font-mono text-[11px] tracking-[0.1em]"
              style={{ color: grounding.passed ? "#0F9D6B" : "#C77A12" }}
            >
              {grounding.passed ? "GROUNDED ✓" : "PARTIAL GROUNDING"}
              {grounding.retried ? " · RETRIED" : ""}
            </div>
            <p className="font-sans text-sm leading-relaxed text-ink-soft">
              {result.insights.length} insights and {result.recommendations.length} recommendations,
              grounded in this {metrics.wordCount.toLocaleString()}-word page and its extracted
              metrics — the AI interprets the numbers, it never invents them.
            </p>
          </div>
        </div>

        <MetricsTable metrics={result.metrics} />
        <InsightsList insights={result.insights} />
        <RecommendationsList recommendations={result.recommendations} />

        {/* footer */}
        <div className="border-t border-[#e7e9f2] px-6 py-4 text-center font-mono text-[11px] text-faint sm:px-9">
          Generated by PageLens AI · grounded in {grounding.distinctMetricsReferenced}/
          {grounding.required} extracted metrics
        </div>
      </div>

      <ReasoningTrace promptLog={result.promptLog} grounding={grounding} url={url} />
    </div>
  );
}
