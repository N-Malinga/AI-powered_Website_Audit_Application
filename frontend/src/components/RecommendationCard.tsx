import type { Recommendation } from "../types";
import PriorityBadge from "./PriorityBadge";

export default function RecommendationCard({
  recommendation,
}: {
  recommendation: Recommendation;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <header className="mb-2 flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-900">{recommendation.title}</h3>
        <PriorityBadge priority={recommendation.priority} />
      </header>

      <p className="text-sm leading-relaxed text-slate-800">{recommendation.action}</p>

      <div className="mt-3 rounded-lg bg-slate-50 p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Why</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">{recommendation.reasoning}</p>
      </div>

      {recommendation.relatedMetrics.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {recommendation.relatedMetrics.map((metric, i) => (
            <li
              key={i}
              className="rounded-md bg-brand-50 px-2 py-0.5 font-mono text-xs text-brand-700"
            >
              {metric}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
