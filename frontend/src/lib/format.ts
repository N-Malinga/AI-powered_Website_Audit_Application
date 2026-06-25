import type { Priority, Severity } from "../types";

/** The five insight categories, in the order we render them, with display labels. */
export const INSIGHT_CATEGORY_ORDER: { key: string; label: string }[] = [
  { key: "seoStructure", label: "SEO Structure" },
  { key: "messagingClarity", label: "Messaging Clarity" },
  { key: "ctaUsage", label: "CTA Usage" },
  { key: "contentDepth", label: "Content Depth" },
  { key: "uxStructural", label: "UX & Structure" },
];

/** Fallback label for any unexpected category key (camelCase -> "Title Case"). */
export function categoryLabel(key: string): string {
  const known = INSIGHT_CATEGORY_ORDER.find((c) => c.key === key);
  if (known) return known.label;
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

/** Sort order for recommendations: High first. */
export const PRIORITY_RANK: Record<Priority, number> = {
  High: 0,
  Medium: 1,
  Low: 2,
};

/** Tailwind classes for severity badges. */
export const SEVERITY_BADGE: Record<Severity, string> = {
  Critical: "bg-red-100 text-red-700 ring-red-600/20",
  Warning: "bg-amber-100 text-amber-800 ring-amber-600/20",
  Minor: "bg-slate-100 text-slate-700 ring-slate-500/20",
  Ok: "bg-emerald-100 text-emerald-700 ring-emerald-600/20",
};

/** Tailwind classes for priority badges. */
export const PRIORITY_BADGE: Record<Priority, string> = {
  High: "bg-red-100 text-red-700 ring-red-600/20",
  Medium: "bg-amber-100 text-amber-800 ring-amber-600/20",
  Low: "bg-slate-100 text-slate-700 ring-slate-500/20",
};
