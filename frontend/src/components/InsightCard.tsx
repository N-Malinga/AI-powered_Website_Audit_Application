import type { Insight } from "../types";
import { categoryLabel } from "../lib/format";
import SeverityBadge from "./SeverityBadge";

export default function InsightCard({ insight }: { insight: Insight }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <header className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-900">
          {categoryLabel(insight.category)}
        </h3>
        <SeverityBadge severity={insight.severity} />
      </header>

      <p className="text-sm leading-relaxed text-slate-700">{insight.observation}</p>

      {insight.evidence.length > 0 ? (
        <div className="mt-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Evidence</p>
          <ul className="mt-1 flex flex-wrap gap-1.5">
            {insight.evidence.map((item, i) => (
              <li
                key={i}
                className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}
