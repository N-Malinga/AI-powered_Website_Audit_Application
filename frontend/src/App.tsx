import { useEffect, useRef, useState } from "react";
import { auditWebsite, pingHealth } from "./api/client";
import type { AuditResult } from "./types";
import AuditForm from "./components/AuditForm";
import LoadingState from "./components/LoadingState";
import ErrorBanner from "./components/ErrorBanner";
import MetricsGrid from "./components/MetricsGrid";
import InsightsSection from "./components/InsightsSection";
import RecommendationsSection from "./components/RecommendationsSection";
import ReasoningTrace from "./components/ReasoningTrace";

type Status = "idle" | "pending" | "success" | "error";

const COLD_START_MS = 4000;

export default function App() {
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<AuditResult | null>(null);
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

  const pending = status === "pending";

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Website Audit</h1>
        <p className="mt-1 text-sm text-slate-500">
          Enter a page URL to get factual metrics plus grounded, agency-grade insights and
          recommendations.
        </p>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <AuditForm onSubmit={runAudit} pending={pending} />
      </div>

      <main className="mt-6 flex flex-col gap-8">
        {pending ? <LoadingState coldStart={coldStart} /> : null}

        {status === "error" ? <ErrorBanner message={errorMessage} /> : null}

        {status === "success" && result ? (
          <>
            <MetricsGrid metrics={result.metrics} />
            <InsightsSection insights={result.insights} />
            <RecommendationsSection recommendations={result.recommendations} />
            <ReasoningTrace promptLog={result.promptLog} grounding={result.grounding} />
          </>
        ) : null}

        {status === "idle" ? (
          <p className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
            Results will appear here after you run an audit.
          </p>
        ) : null}
      </main>
    </div>
  );
}
