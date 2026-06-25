import { useEffect, useRef, useState } from "react";
import { auditWebsite, pingHealth } from "./api/client";
import type { AuditResult } from "./types";
import EntryScreen from "./components/EntryScreen";
import ReportView from "./components/ReportView";

type Status = "idle" | "pending" | "success" | "error";

const COLD_START_MS = 4000;

export default function App() {
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<AuditResult | null>(null);
  const [auditedUrl, setAuditedUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [coldStart, setColdStart] = useState(false);
  const coldStartTimer = useRef<number | undefined>(undefined);

  // Start waking the (possibly sleeping) backend as soon as the app loads.
  useEffect(() => {
    void pingHealth();
    return () => window.clearTimeout(coldStartTimer.current);
  }, []);

  async function runAudit(url: string) {
    setStatus("pending");
    setErrorMessage("");
    setColdStart(false);
    setAuditedUrl(url);
    coldStartTimer.current = window.setTimeout(() => setColdStart(true), COLD_START_MS);

    try {
      const data = await auditWebsite(url);
      setResult(data);
      setStatus("success");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    } finally {
      window.clearTimeout(coldStartTimer.current);
    }
  }

  function reset() {
    setStatus("idle");
    setResult(null);
    setErrorMessage("");
  }

  const showReport = status === "success" && result;

  return (
    <div className="min-h-screen w-full py-6 sm:py-8">
      {showReport ? (
        // Report uses the same centered, max-w-4xl card width as the entry screen.
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
          <ReportView result={result} url={auditedUrl} onReset={reset} />
        </div>
      ) : (
        // Entry screen stays centered and narrow; soft brand gradients fill the
        // empty side gutters on wider screens so the page doesn't feel bare.
        <div className="relative">
          <div
            aria-hidden
            className="pointer-events-none fixed inset-y-0 left-0 hidden w-[30vw] lg:block"
            style={{
              background:
                "radial-gradient(38rem 38rem at 0% 50%, rgba(124,58,237,0.10), transparent 70%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none fixed inset-y-0 right-0 hidden w-[30vw] lg:block"
            style={{
              background:
                "radial-gradient(38rem 38rem at 100% 50%, rgba(6,182,212,0.10), transparent 70%)",
            }}
          />
          <div className="relative mx-auto w-full max-w-4xl px-4 sm:px-6">
            <EntryScreen
              onSubmit={runAudit}
              status={status === "success" ? "idle" : status}
              errorMessage={errorMessage}
              coldStart={coldStart}
            />
          </div>
        </div>
      )}
    </div>
  );
}
