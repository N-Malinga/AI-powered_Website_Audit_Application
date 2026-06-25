import { useState } from "react";
import type { FormEvent } from "react";

const CAPABILITY_CHIPS = [
  "SEO structure",
  "CTA usage",
  "Alt text",
  "Content depth",
  "Links",
];

export default function AuditForm({
  onSubmit,
  pending,
}: {
  onSubmit: (url: string) => void;
  pending: boolean;
}) {
  const [url, setUrl] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (trimmed.length === 0 || pending) return;
    // The protocol is shown as a prefix; add it back if the user didn't type one.
    const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    onSubmit(normalized);
  }

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="mx-auto flex max-w-xl items-center gap-2 rounded-2xl border border-[#dfe2ee] bg-white py-2 pl-4 pr-2 shadow-[0_8px_24px_-12px_rgba(37,99,235,0.2)] focus-within:border-azure"
      >
        <span className="font-mono text-sm font-medium text-faint">https://</span>
        <input
          type="text"
          inputMode="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="example.com/page"
          aria-label="Page URL to audit"
          disabled={pending}
          className="min-w-0 flex-1 bg-transparent font-sans text-[15px] font-medium text-ink outline-none placeholder:text-faint disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={pending || url.trim().length === 0}
          className="brand-gradient inline-flex shrink-0 items-center gap-2 rounded-xl px-5 py-3 font-display text-sm font-semibold text-white transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Analyzing…" : "Analyze →"}
        </button>
      </form>

      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {CAPABILITY_CHIPS.map((chip) => (
          <span
            key={chip}
            className="rounded-md border border-line bg-white px-2.5 py-1 font-mono text-[11px] font-medium text-muted"
          >
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}
