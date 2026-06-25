export default function LoadingState({ coldStart }: { coldStart: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-brand-600"
        role="status"
        aria-label="Loading"
      />
      {coldStart ? (
        <div>
          <p className="text-sm font-medium text-slate-700">
            Warming up the backend, this can take up to a minute…
          </p>
          <p className="mt-1 text-xs text-slate-400">
            The server sleeps when idle and is spinning back up.
          </p>
        </div>
      ) : (
        <p className="text-sm font-medium text-slate-700">
          Auditing the page and generating insights…
        </p>
      )}
    </div>
  );
}
