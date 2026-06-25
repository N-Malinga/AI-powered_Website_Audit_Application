export default function LoadingState({ coldStart }: { coldStart: boolean }) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-4 rounded-2xl border border-line bg-white p-10 text-center shadow-sm">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-line"
        style={{ borderTopColor: "#7c3aed" }}
        role="status"
        aria-label="Loading"
      />
      {coldStart ? (
        <div>
          <p className="font-sans text-sm font-medium text-ink">
            Warming up the backend, this can take up to a minute…
          </p>
          <p className="mt-1 font-mono text-xs text-faint">
            The server sleeps when idle and is spinning back up.
          </p>
        </div>
      ) : (
        <p className="font-sans text-sm font-medium text-ink">
          Extracting metrics and grounding the AI analysis…
        </p>
      )}
    </div>
  );
}
