import type { Insight } from "../types";
import { INSIGHT_CATEGORY_ORDER } from "../lib/format";
import InsightCard from "./InsightCard";

export default function InsightsSection({ insights }: { insights: Insight[] }) {
  // Render in canonical category order; append any unexpected categories at the end.
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
    <section aria-labelledby="insights-heading">
      <div className="mb-3 flex items-baseline gap-2">
        <h2 id="insights-heading" className="text-lg font-semibold text-slate-900">
          AI Insights
        </h2>
        <span className="text-sm text-slate-400">grounded in the metrics above</span>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {ordered.map((insight) => (
          <InsightCard key={insight.category} insight={insight} />
        ))}
      </div>
    </section>
  );
}
