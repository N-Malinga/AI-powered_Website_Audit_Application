/** PageLens AI wordmark with the conic gradient mark, matching the design exploration. */
export default function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="h-6 w-6 rounded-lg"
        style={{
          background: "conic-gradient(from 140deg, #7C3AED, #2563EB, #06B6D4, #7C3AED)",
        }}
      />
      <span className="font-display text-lg font-semibold tracking-tight text-ink">
        PageLens<span className="brand-text"> AI</span>
      </span>
    </div>
  );
}
