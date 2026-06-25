import type { Recommendation } from "../types";
import { PRIORITY_RANK } from "../lib/format";
import RecommendationCard from "./RecommendationCard";

export default function RecommendationsSection({
  recommendations,
}: {
  recommendations: Recommendation[];
}) {
  const sorted = [...recommendations].sort(
    (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority],
  );

  return (
    <section aria-labelledby="recommendations-heading">
      <div className="mb-3 flex items-baseline gap-2">
        <h2 id="recommendations-heading" className="text-lg font-semibold text-slate-900">
          Recommendations
        </h2>
        <span className="text-sm text-slate-400">prioritized high to low</span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {sorted.map((rec, i) => (
          <RecommendationCard key={i} recommendation={rec} />
        ))}
      </div>
    </section>
  );
}
