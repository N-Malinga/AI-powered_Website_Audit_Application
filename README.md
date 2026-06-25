# Website Audit Tool

An AI-powered, single-page website auditor. Paste in a URL and it fetches the page,
extracts factual metrics **deterministically in code**, then uses Gemini to interpret
those numbers into grounded insights and prioritized recommendations — framed for a
marketing-agency audience.

The defining constraint: **metrics are computed in code and treated as ground truth.
The LLM never computes or estimates a number — it only explains the ones we give it.**

**Live demo:** _<add deployed URL here>_ (frontend on Vercel, API on Render — free tier,
so the first request after idle may take ~1 min to wake; see [cold start](#trade-offs)).

## Local setup

Prerequisites: **.NET 10 SDK**, **Node 20+**, and a **Gemini API key**.

```bash
# 1. Backend (listens on :5171; health at /health)
export GEMINI_API_KEY=your_key_here        # PowerShell: $env:GEMINI_API_KEY="..."
dotnet run --project backend/Audit.Api

# 2. Frontend (in a second terminal; opens http://localhost:5173)
cd frontend
npm install
npm run dev
```

The frontend reads `VITE_API_URL` from `frontend/.env` (falls back to `http://localhost:5171`).

```bash
dotnet build backend/Audit.slnx     # build
dotnet test  backend/Audit.slnx     # backend tests
cd frontend && npm run build        # type-check + production build
```

## Architecture overview

ASP.NET Core (net10.0) backend + React/Vite/TypeScript frontend, structured as clean
architecture: **Api → Infrastructure → Core**, with `Audit.Tests` covering all three.

**Request flow:**

```
URL ─▶ POST /api/audit
        │
        ▼
   AuditWebsiteCommand ──▶ FluentValidation (ValidationBehavior pipeline)
        │
        ▼
   IPageFetcher       HttpPageFetcher: typed HttpClient, 10s timeout,
   (URL → raw HTML)   realistic User-Agent, automatic decompression
        │
        ▼
   IMetricsExtractor  AngleSharpMetricsExtractor: pure, deterministic,
   (HTML → PageMetrics) no network — word/heading/CTA/link/image/meta counts
        │
        ▼
   IAiAnalyzer        GeminiAiAnalyzer: metrics + trimmed content → insights
   (metrics → AiAnalysis)  + recommendations (the only LLM call)
        │
        ▼
   AuditResult (Metrics, Insights, Recommendations, PromptLog, Grounding) ─▶ JSON
```

**Scraping / AI separation.** Fetching, metric extraction, and AI analysis are three
distinct layers behind three interfaces (`IPageFetcher`, `IMetricsExtractor`,
`IAiAnalyzer`). The extractor is pure and unit-tested; the analyzer receives finished
numbers and never sees raw HTML to "recount." This keeps the factual layer verifiable
and the interpretive layer swappable — either side can be replaced without touching the
other.

## AI design decisions

- **Deterministic metrics as ground truth.** Every number (word count, H1/H2/H3, CTAs,
  internal/external links, images missing alt, meta presence) is computed in
  `AngleSharpMetricsExtractor` and unit-tested. The model receives these as fixed input.
  This eliminates the most common LLM failure mode for audits — confidently wrong
  statistics — and makes the factual section auditable independent of the AI.
- **JSON-mode structured output.** Gemini is called with `responseMimeType:
  application/json` and a `responseSchema` matching the Insight/Recommendation shape
  (insights keyed by the five categories; 3–5 recommendations). No brittle prose parsing;
  responses deserialize straight into typed records.
- **Grounding guard.** After generation, we verify the model cited **≥3 distinct real
  metric values** (word-boundary matched across evidence, reasoning, and relatedMetrics).
  If it falls short, we retry once with a nudge to reference the actual numbers. Both
  attempts are logged and the outcome is surfaced to the UI as a `GroundingResult` —
  so "is this grounded in the data?" is a visible, checkable property, not a hope.
- **Hybrid severity.** Objective severity flags are computed in code from fixed thresholds
  (`h1Count != 1`, alt-missing `> 30%`, missing meta description → Warning; `wordCount <
  300` → Minor) and passed to the model as ground truth. The model explains and prioritizes
  them rather than re-deciding severity, so the same page always yields the same flags.
- **Agency-framed prompt.** A verbatim, version-controlled system prompt casts the model as
  a website auditor advising a marketing agency — concrete, client-ready observations over
  generic SEO platitudes. The prompt is captured by the logger so what produced an output
  is always recoverable.
- **Why Gemini 2.5 Flash.** Native JSON-mode + response-schema support, strong
  instruction-following, fast and inexpensive enough for an interactive single-call audit,
  and a free tier suitable for a demo. The interpretive workload (explain pre-computed
  numbers) doesn't need a frontier model, so Flash is the right cost/latency point.

## Trade-offs

- **Static fetch vs. headless rendering.** We fetch raw HTML over HTTP — fast, cheap, no
  browser. The cost: client-rendered SPAs (and heavily JS-driven pages) can return a near-
  empty document, so metrics undercount. A deliberate trade for the 24h scope; see below.
- **Heuristic CTA detection.** "Calls to action" are inferred from button/role/class/text
  signals (`IsActionAnchor`). It's transparent and deterministic, but it will miss unusual
  patterns and occasionally over-count — a reasonable proxy, not a ground truth of intent.
- **Single LLM call.** One generation produces all insights and recommendations. Simple and
  cheap, but no agentic refinement or tool use — the grounding retry is the only second pass.
- **Clean-architecture depth.** The layered split (Core/Infrastructure/Api + MediatR +
  validation pipeline) is more structure than a 24h tool strictly needs. It was dialed to
  demonstrate the separation-of-concerns the brief is really about, while staying shippable.
- **Free-tier cold start.** The API runs on Render's free tier and sleeps when idle, so the
  first request can take ~1 min. The frontend mitigates this by warming the backend on load
  and escalating the loading copy to "Warming up the backend…" after 4s.

## What I'd improve with more time

- **Playwright rendering** for an accurate snapshot of SPA / JS-heavy pages, fixing the
  static-fetch blind spot.
- **URL-keyed caching** of fetches and analyses to cut latency and API spend on repeat audits.
- **Lighthouse / Core Web Vitals** integration to add real performance and accessibility
  signals alongside the content metrics.
- **Streaming responses** so insights and recommendations render progressively instead of
  after one blocking call.
- **Multi-page crawl** to audit a whole site (or key templates) rather than a single page.

## Prompt logs

Every audit attempt is captured — verbatim system prompt, constructed user prompt,
structured input (metrics + severity flags), and raw model output (the API key is redacted).
It's shown in the UI's collapsible reasoning-trace panel and appended as a timestamped JSON
record to [`prompt-logs/`](./prompt-logs/). Runtime records are git-ignored; curated
`example-*.json` runs are committed there as references.
