import AuditForm from "./AuditForm";
import LoadingState from "./LoadingState";
import ErrorBanner from "./ErrorBanner";
import Logo from "./Logo";

type Status = "idle" | "pending" | "error";

export default function EntryScreen({
  onSubmit,
  status,
  errorMessage,
  coldStart,
}: {
  onSubmit: (url: string) => void;
  status: Status;
  errorMessage: string;
  coldStart: boolean;
}) {
  const pending = status === "pending";

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-panel shadow-[0_1px_3px_rgba(20,18,40,0.06)]">
      {/* top bar */}
      <div className="flex items-center justify-between border-b border-line bg-white px-6 py-4">
        <Logo />
      </div>

      {/* hero */}
      <div className="px-6 pb-8 pt-14 text-center sm:px-14">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(124,58,237,0.16)] bg-[rgba(124,58,237,0.08)] px-3 py-1.5 font-mono text-xs font-medium tracking-wide text-grape">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan" />
          AI-NATIVE PAGE AUDIT
        </div>

        <h1 className="mx-auto mb-3.5 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-[42px]">
          Audit any page
          <br />
          in seconds.
        </h1>
        <p className="mx-auto mb-8 max-w-md font-sans text-base leading-relaxed text-muted">
          Paste a URL. PageLens extracts the factual metrics, then grounds every AI insight and
          recommendation in that data.
        </p>

        <AuditForm onSubmit={onSubmit} pending={pending} />

        <div className="mt-8">
          {pending ? <LoadingState coldStart={coldStart} /> : null}
          {status === "error" ? <ErrorBanner message={errorMessage} /> : null}
        </div>
      </div>
    </div>
  );
}
