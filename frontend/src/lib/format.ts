import type { Priority, Severity } from "../types";

/**
 * The five insight categories, in render order. `label` is the human title;
 * `slug` is the snake_case form used by the data-forward / terminal report.
 */
export const INSIGHT_CATEGORY_ORDER: { key: string; label: string; slug: string }[] = [
  { key: "seoStructure", label: "SEO Structure", slug: "seo_structure" },
  { key: "messagingClarity", label: "Messaging Clarity", slug: "messaging_clarity" },
  { key: "ctaUsage", label: "CTA Usage", slug: "cta_usage" },
  { key: "contentDepth", label: "Content Depth", slug: "content_depth" },
  { key: "uxStructural", label: "UX & Structure", slug: "ux_structural" },
];

/** camelCase -> snake_case fallback for any unexpected category key. */
export function categorySlug(key: string): string {
  const known = INSIGHT_CATEGORY_ORDER.find((c) => c.key === key);
  if (known) return known.slug;
  return key.replace(/([A-Z])/g, "_$1").toLowerCase();
}

/** Human title for a category key (camelCase -> "Title Case" fallback). */
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

/**
 * Severity → terminal-style bracket label + text colour class.
 * The real backend severity is preserved; only its presentation changes.
 */
export const SEVERITY_STYLE: Record<Severity, { label: string; color: string }> = {
  Ok: { label: "OK", color: "text-good" },
  Minor: { label: "MINOR", color: "text-azure" },
  Warning: { label: "WARNING", color: "text-warn" },
  Critical: { label: "CRITICAL", color: "text-bad" },
};

/** Priority → terminal marker glyph, short tag and colour class. */
export const PRIORITY_STYLE: Record<Priority, { marker: string; tag: string; color: string }> = {
  High: { marker: "[!]", tag: "HIGH", color: "text-bad" },
  Medium: { marker: "[~]", tag: "MED", color: "text-warn" },
  Low: { marker: "[-]", tag: "LOW", color: "text-azure" },
};
