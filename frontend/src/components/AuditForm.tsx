import { useState } from "react";
import type { FormEvent } from "react";

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
    if (trimmed.length > 0 && !pending) {
      onSubmit(trimmed);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
      <input
        type="text"
        inputMode="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://example.com"
        aria-label="Page URL to audit"
        disabled={pending}
        className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-50"
      />
      <button
        type="submit"
        disabled={pending || url.trim().length === 0}
        className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Auditing…" : "Audit"}
      </button>
    </form>
  );
}
