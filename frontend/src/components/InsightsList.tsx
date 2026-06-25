import type { Insight, Severity } from "../types";
import { INSIGHT_CATEGORY_ORDER, SEVERITY_STYLE, categoryLabel } from "../lib/format";

// Severity → pill background tint (text colour comes from SEVERITY_STYLE).
const SEVERITY_PILL_BG: Record<Severity, string> = {
  Ok: "rgba(15,157,107,.1)",
  Minor: "rgba(37,99,235,.1)",
  Warning: "rgba(199,122,18,.1)",
  Critical: "rgba(209,67,67,.1)",
};

const SEVERITY_TEXT: Record<Severity, string> = {
  Ok: "#0F9D6B",
  Minor: "#2563EB",
  Warning: "#C77A12",
  Critical: "#D14343",
};

export default function InsightsList({ insights }: { insights: Insight[] }) {
  // Canonical category order; any unexpected categories trail at the end.
  const byCategory = new Map(insights.map((i) => [i.category, i]));
  const ordered: Insight[] = [];
  for (const { key } of INSIGHT_CATEGORY_ORDER) {
    const found = byCategory.get(key);
    if (found) {
      ordered.push(found);
      byCategory.delete(key);
    }
  }
  ordered.push(...byCategory.values());

  return (
    <div className="px-6 pb-2 pt-7 sm:px-9">
      <div className="mb-4 flex items-center gap-2.5">
        <span
          className="h-[7px] w-[7px] rounded-full"
          style={{ backgroundImage: "linear-gradient(135deg,#7C3AED,#06B6D4)" }}
        />
        <span className="font-mono text-[12px] font-semibold tracking-[0.1em] text-ink">
          AI INSIGHTS
        </span>
        <span className="font-mono text-[11px] text-faint">· grounded in the metrics above</span>
        <span
          className="h-px flex-1"
          style={{ backgroundImage: "linear-gradient(90deg,#E7E9F2,transparent)" }}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {ordered.map((insight) => {
          const sev = insight.severity;
          const label = SEVERITY_STYLE[sev]?.label ?? String(sev).toUpperCase();
          return (
            <div
              key={insight.category}
              className="flex flex-col rounded-2xl border border-[#e9eaf2] bg-white p-4 sm:p-5"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="font-display text-[15px] font-semibold text-ink">
                  {categoryLabel(insight.category)}
                </span>
                <span
                  className="shrink-0 rounded-full px-2.5 py-1 font-mono text-[9px] font-semibold tracking-wide"
                  style={{ background: SEVERITY_PILL_BG[sev], color: SEVERITY_TEXT[sev] }}
                >
                  {label}
                </span>
              </div>

              <p className="font-sans text-[13px] leading-relaxed text-ink-soft">
                {insight.observation}
              </p>

              {insight.evidence.length > 0 ? (
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {insight.evidence.map((item, i) => (
                    <li
                      key={i}
                      className="rounded-md border border-line bg-panel px-2 py-0.5 font-mono text-[11px] text-muted"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
