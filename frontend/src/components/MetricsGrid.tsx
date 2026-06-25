import type { PageMetrics } from "../types";
import StatCard from "./StatCard";

function MetaRow({ label, value }: { label: string; value: string | null }) {
  const present = value != null && value.trim().length > 0;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className={`mt-1 text-sm ${present ? "text-slate-900" : "text-slate-400 italic"}`}>
        {present ? value : "Missing"}
      </dd>
    </div>
  );
}

export default function MetricsGrid({ metrics }: { metrics: PageMetrics }) {
  return (
    <section aria-labelledby="metrics-heading">
      <div className="mb-3 flex items-baseline gap-2">
        <h2 id="metrics-heading" className="text-lg font-semibold text-slate-900">
          Factual Metrics
        </h2>
        <span className="text-sm text-slate-400">extracted deterministically</span>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Word Count" value={metrics.wordCount} />
        <StatCard label="H1 Tags" value={metrics.h1Count} />
        <StatCard label="H2 Tags" value={metrics.h2Count} />
        <StatCard label="H3 Tags" value={metrics.h3Count} />
        <StatCard label="CTAs" value={metrics.ctaCount} />
        <StatCard label="Internal Links" value={metrics.internalLinks} />
        <StatCard label="External Links" value={metrics.externalLinks} />
        <StatCard label="Images" value={metrics.imageCount} />
        <StatCard label="Images Missing Alt" value={metrics.imagesMissingAltCount} />
        <StatCard
          label="% Missing Alt"
          value={`${metrics.imagesMissingAltPercent}%`}
        />
      </dl>

      <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MetaRow label="Meta Title" value={metrics.metaTitle} />
        <MetaRow label="Meta Description" value={metrics.metaDescription} />
      </dl>
    </section>
  );
}
