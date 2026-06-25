import type { Priority, Recommendation } from "../types";
import { PRIORITY_RANK, PRIORITY_STYLE } from "../lib/format";

// Per-priority presentation for the gradient strip rows.
const PRIORITY_SOLID: Record<Priority, string> = {
  High: "#D14343",
  Medium: "#C77A12",
  Low: "#2563EB",
};

const PRIORITY_ROW_TINT: Record<Priority, string> = {
  High: "rgba(209,67,67,.06)",
  Medium: "rgba(199,122,18,.06)",
  Low: "rgba(37,99,235,.06)",
};

const PRIORITY_BORDER: Record<Priority, string> = {
  High: "#eee0e0",
  Medium: "#efe7d6",
  Low: "#dfe6f4",
};

export default function RecommendationsList({
  recommendations,
}: {
  recommendations: Recommendation[];
}) {
  const sorted = [...recommendations].sort(
    (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority],
  );

  return (
    <div className="px-6 pb-8 pt-7 sm:px-9">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="font-mono text-[12px] font-semibold tracking-[0.1em] text-ink">
          RECOMMENDATIONS
        </span>
        <span className="font-mono text-[11px] text-faint">
          · prioritized, {sorted.length} item{sorted.length === 1 ? "" : "s"}
        </span>
        <span
          className="h-px flex-1"
          style={{ backgroundImage: "linear-gradient(90deg,#E7E9F2,transparent)" }}
        />
      </div>

      <div className="flex flex-col gap-2.5">
        {sorted.map((rec, i) => {
          const p = rec.priority;
          const tag = PRIORITY_STYLE[p]?.tag ?? String(p).toUpperCase();
          return (
            <div
              key={i}
              className="rounded-2xl border p-4 sm:px-5"
              style={{
                borderColor: PRIORITY_BORDER[p],
                backgroundImage: `linear-gradient(100deg, ${PRIORITY_ROW_TINT[p]}, #fff 60%)`,
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="font-mono text-[13px] font-semibold"
                  style={{ color: PRIORITY_SOLID[p] }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 font-display text-[15px] font-semibold leading-snug text-ink">
                  {rec.title}
                </span>
                <span
                  className="shrink-0 rounded-md px-2.5 py-1 font-mono text-[9px] font-semibold tracking-wide text-white"
                  style={{ background: PRIORITY_SOLID[p] }}
                >
                  {tag}
                </span>
              </div>

              <p className="mt-2 pl-7 font-sans text-[13px] leading-relaxed text-muted">
                {rec.action}
              </p>
              {rec.reasoning ? (
                <p className="mt-1 pl-7 font-sans text-xs leading-relaxed text-faint">
                  {rec.reasoning}
                </p>
              ) : null}
              {rec.relatedMetrics.length > 0 ? (
                <ul className="mt-2 flex flex-wrap gap-1.5 pl-7">
                  {rec.relatedMetrics.map((metric, j) => (
                    <li
                      key={j}
                      className="rounded-md border border-line bg-white px-2 py-0.5 font-mono text-[11px] text-muted"
                    >
                      {metric}
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
