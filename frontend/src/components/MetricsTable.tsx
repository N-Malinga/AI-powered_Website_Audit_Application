import type { PageMetrics } from "../types";

function SectionHeading({ title, note }: { title: string; note?: string }) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <span className="font-mono text-[12px] font-semibold tracking-[0.1em] text-ink">{title}</span>
      {note ? <span className="font-mono text-[11px] text-faint">· {note}</span> : null}
      <span
        className="h-px flex-1"
        style={{ backgroundImage: "linear-gradient(90deg,#E7E9F2,transparent)" }}
      />
    </div>
  );
}

function MetaCard({ label, value }: { label: string; value: string | null }) {
  const present = value != null && value.trim().length > 0;
  return (
    <div className="flex-1 rounded-2xl border border-[#e9eaf2] bg-white p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-wide text-faint">{label}</span>
        <span
          className="font-mono text-[10px] font-semibold"
          style={{ color: present ? "#0F9D6B" : "#D14343" }}
        >
          {present ? `${value!.trim().length} chars ✓` : "missing"}
        </span>
      </div>
      <div
        className={`font-sans text-[13px] leading-snug ${present ? "text-ink" : "italic text-faint"}`}
      >
        {present ? value : "Not present on the page"}
      </div>
    </div>
  );
}

export default function MetricsTable({ metrics }: { metrics: PageMetrics }) {
  const m = metrics;
  const totalLinks = m.internalLinks + m.externalLinks;
  const internalPct = totalLinks > 0 ? Math.round((m.internalLinks / totalLinks) * 100) : 0;
  const altPct = Math.min(100, Math.max(0, m.imagesMissingAltPercent));
  const readMin = Math.max(1, Math.round(m.wordCount / 250));

  return (
    <div className="px-6 pb-2 pt-8 sm:px-9">
      <SectionHeading title="FACTUAL METRICS" note="extracted, not generated" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* word count */}
        <div
          className="rounded-2xl border p-4"
          style={{
            borderColor: "rgba(124,58,237,.16)",
            backgroundImage: "linear-gradient(160deg,rgba(124,58,237,.1),rgba(124,58,237,.02))",
          }}
        >
          <div className="font-mono text-[10px] uppercase tracking-wide" style={{ color: "#7C3AED" }}>
            Word count
          </div>
          <div className="mt-2.5 font-display text-3xl font-semibold text-ink">
            {m.wordCount.toLocaleString()}
          </div>
          <div className="mt-1.5 font-sans text-xs text-muted">~{readMin} min read</div>
        </div>

        {/* headings */}
        <div
          className="rounded-2xl border p-4"
          style={{
            borderColor: "rgba(37,99,235,.16)",
            backgroundImage: "linear-gradient(160deg,rgba(37,99,235,.1),rgba(37,99,235,.02))",
          }}
        >
          <div className="font-mono text-[10px] uppercase tracking-wide" style={{ color: "#2563EB" }}>
            Headings
          </div>
          <div className="mt-2.5 flex items-baseline gap-4">
            {([["H1", m.h1Count], ["H2", m.h2Count], ["H3", m.h3Count]] as const).map(([k, v]) => (
              <div key={k}>
                <span className="font-display text-2xl font-semibold text-ink">{v}</span>
                <span className="ml-1 font-mono text-[10px] text-faint">{k}</span>
              </div>
            ))}
          </div>
          <div className="mt-1.5 font-sans text-xs text-muted">H1 / H2 / H3</div>
        </div>

        {/* ctas */}
        <div
          className="rounded-2xl border p-4"
          style={{
            borderColor: "rgba(6,182,212,.16)",
            backgroundImage: "linear-gradient(160deg,rgba(6,182,212,.1),rgba(6,182,212,.02))",
          }}
        >
          <div className="font-mono text-[10px] uppercase tracking-wide" style={{ color: "#0891B2" }}>
            CTAs
          </div>
          <div className="mt-2.5 font-display text-3xl font-semibold text-ink">{m.ctaCount}</div>
          <div className="mt-1.5 font-sans text-xs text-muted">calls to action</div>
        </div>

        {/* missing alt donut */}
        <div className="flex items-center gap-4 rounded-2xl border border-[#e9eaf2] bg-white p-4">
          <div
            className="relative h-[58px] w-[58px] flex-shrink-0 rounded-full"
            style={{ background: `conic-gradient(#D14343 0% ${altPct}%,#ECEDF4 ${altPct}%)` }}
          >
            <div
              className="absolute inset-[9px] flex items-center justify-center rounded-full bg-white font-display text-[13px] font-semibold"
              style={{ color: "#D14343" }}
            >
              {Math.round(altPct)}%
            </div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wide text-faint">Missing alt</div>
            <div className="mt-1.5 font-display text-base font-semibold text-ink">
              {m.imagesMissingAltCount} / {m.imageCount}
            </div>
            <div className="mt-1 font-sans text-[11px] text-muted">images</div>
          </div>
        </div>

        {/* links bar */}
        <div className="rounded-2xl border border-[#e9eaf2] bg-white p-4 sm:col-span-2">
          <div className="mb-3 flex items-baseline justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wide text-faint">
              Links · internal vs external
            </span>
            <span className="font-display text-sm font-semibold text-ink">{totalLinks} total</span>
          </div>
          <div className="flex h-3 overflow-hidden rounded-full" style={{ background: "#ECEDF4" }}>
            <div style={{ width: `${internalPct}%`, background: "#2563EB" }} />
            <div style={{ width: `${100 - internalPct}%`, background: "#06B6D4" }} />
          </div>
          <div className="mt-2.5 flex justify-between font-sans text-xs">
            <span style={{ color: "#2563EB" }}>● {m.internalLinks} internal</span>
            <span style={{ color: "#0891B2" }}>● {m.externalLinks} external</span>
          </div>
        </div>
      </div>

      {/* meta */}
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <MetaCard label="Meta title" value={m.metaTitle} />
        <MetaCard label="Meta description" value={m.metaDescription} />
      </div>
    </div>
  );
}
