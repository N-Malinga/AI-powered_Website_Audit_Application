# Website Audit Tool

AI-powered single-page website auditor. Accepts a URL, extracts factual metrics
deterministically, then uses Gemini to generate grounded insights and recommendations.

## Core principle
Metrics are computed in code and treated as ground truth. The LLM NEVER computes or
estimates metrics — it only interprets the numbers we give it. Keep scraping and AI
analysis in separate layers with separate interfaces.

## Solution layout
- `backend/Audit.slnx` — solution (new XML format; build with `dotnet build backend/Audit.slnx`).
- Target framework: **net10.0** (matches installed SDK 10).
- Projects: `Audit.Core`, `Audit.Infrastructure`, `Audit.Api`, `Audit.Tests`.
  References: Api → Infrastructure → Core; Tests → all three.
- `frontend/` — React + Vite + TypeScript single-page UI (see Frontend section).
- `README.md` (repo root) — public-facing overview (what it does, setup, architecture, AI design
  decisions, trade-offs). `render.yaml` — Render free-tier Docker deploy (API; CORS via
  `CORS_ALLOWED_ORIGINS`). Frontend deploys to Vercel.

## Backend architecture (ASP.NET Core)
- **Core**: domain models, interfaces, MediatR command + handler, FluentValidation,
  `ValidationBehavior` pipeline. `AddApplication()` registers MediatR + validators + behavior.
- **Infrastructure**: `HttpPageFetcher`, `AngleSharpMetricsExtractor`, `GeminiAiAnalyzer`,
  `PromptLogger`. `AddInfrastructure()` registers them (fetcher & analyzer as typed HttpClients).
- **Api**: `POST /api/audit`, `GET /health`, `GlobalExceptionHandler`, CORS (`dev` policy).

## Domain models (C# records, in Audit.Core/Models)
- `PageMetrics`: WordCount, H1/H2/H3Count, CtaCount, Internal/ExternalLinks, ImageCount,
  ImagesMissingAltCount, ImagesMissingAltPercent, MetaTitle?, MetaDescription?.
- `Insight`: Category, Observation, Severity, Evidence[].
- `Recommendation`: Priority, Title, Action, Reasoning, RelatedMetrics[].
- `AiAnalysis`: Insights[], Recommendations[], PromptLog?, Grounding.
- `AuditResult`: Metrics, Insights[], Recommendations[], PromptLog?, Grounding.
- `PromptLog`: SystemPrompt, UserPrompt, StructuredInput, RawOutput.
- `GroundingResult`: Passed, DistinctMetricsReferenced, Required, Retried.
- Enums: `Severity` (Ok, Minor, Warning, Critical), `Priority` (Low, Medium, High).
  Serialized as strings in API responses (JsonStringEnumConverter in Program.cs).

## Interfaces
- IPageFetcher: URL -> raw HTML
- IMetricsExtractor: HTML -> PageMetrics (deterministic, unit-tested)
- IAiAnalyzer: (PageMetrics + trimmed content) -> AiAnalysis (insights + recommendations)
- IPromptLogger: captures system prompt, user prompt, structured input, raw output

## Metrics extraction (AngleSharpMetricsExtractor)
- Pure/deterministic, no network. Word count excludes script/style/noscript text.
- CTA heuristic centralized in `IsActionAnchor` (button + role/class/text signals).
- Internal vs external: page host inferred from `<base>`/canonical/og:url; relative & same-host
  are internal, other hosts external, mailto/tel/javascript ignored.
- Alt-missing percent rounded to 2 dp, away-from-zero.

## AI layer (GeminiAiAnalyzer)
- Model `gemini-2.5-flash` generateContent, responseMimeType `application/json` + responseSchema
  matching the Insight/Recommendation shape (insights object keyed by the 5 categories
  seoStructure, messagingClarity, ctaUsage, contentDepth, uxStructural; recommendations 3–5).
- User prompt = serialized PageMetrics + objective severity flags + trimmed content
  (all headings in order, then first 600 visible body words).
- **Hybrid severity**: flags computed in code from thresholds (h1Count != 1, alt% > 30,
  metaDescription null → Warning; wordCount < 300 → Minor) and passed as ground truth; the
  model explains/prioritizes them rather than re-deciding.
- System prompt is a verbatim `const string SystemPrompt` (captured by the logger).
- **Grounding guard**: requires ≥3 distinct real metric values cited (word-boundary matched
  across evidence/reasoning/relatedMetrics); retries once with a nudge if short. Both attempts
  logged; result surfaced as `GroundingResult`.
- Transient retry: one exponential-backoff retry on 429 (rate limited) and 503 (overloaded).

## Frontend (frontend/ — React 19 + Vite 8 + TypeScript)
- Styling: **Tailwind v4** via `@tailwindcss/vite` (no PostCSS config); theme tokens + base in
  `src/index.css`. "PageLens AI" branding; clean, professional, agency-oriented look.
- `src/App.tsx` is a thin shell: state machine + which view to show. Both views render in the
  same centered card width (`mx-auto w-full max-w-4xl px-4 sm:px-6`); the entry view adds soft
  side-gutter brand gradients on wide screens.
- Two views:
  - **EntryScreen** (`components/EntryScreen.tsx`, wraps `AuditForm` + `LoadingState` +
    `ErrorBanner` + `Logo`): URL input + Audit button, escalating loading copy, error banner.
  - **ReportView** (`components/ReportView.tsx`): gradient hero (target URL + page-title headline
    + Export(`window.print()`)/New-audit buttons), a floating **grounding** card with a
    conic-gradient donut showing `distinctMetricsReferenced/required` (not a mock 0–100 score),
    then the three separated sections — `MetricsTable`, `InsightsList` (5 categories, severity
    badges), `RecommendationsList` (sorted High→Low, priority badges + reasoning) — and a
    collapsible `ReasoningTrace` panel rendering the prompt log + grounding summary.
- State machine `idle | pending | success | error`. **Warms the backend on load** via
  `pingHealth()`; loading message escalates to "Warming up the backend…" after 4s (Render cold start).
- `src/types.ts` mirrors the `AuditResult` JSON. `src/api/client.ts` (`auditWebsite`, `pingHealth`)
  reads `VITE_API_URL` (`.env`; fallback `http://localhost:5171`) and normalizes RFC7807 errors.
- `src/lib/format.ts`: category labels/order, priority sort rank, severity/priority badge colors.

## Prompt logging (PromptLogger)
- Each audit attempt is captured to `AuditResult.promptLog` (shown in the frontend trace panel)
  AND appended as a timestamped JSON record to `prompt-logs/` at the repo root: `timestamp`,
  verbatim `systemPrompt`, constructed `userPrompt`, `structuredInput` (PageMetrics + severity
  flags), and `rawOutput` (raw model output before deserialization).
- `GEMINI_API_KEY` is redacted as a safety net; logging never throws. Output dir overridable via
  `PromptLogs:Directory`. Runtime records are git-ignored; only curated `example-*.json` are committed.

## Conventions
- C# records for DTOs. Nullable enabled. async everywhere.
- No secrets in code. `GEMINI_API_KEY` from config/env (read via IConfiguration).
- Frontend keeps Metrics, Insights, and Recommendations visually separate.

## Key packages
MediatR 12.4.1, FluentValidation 11.11.0 (+ DI extensions), AngleSharp 1.1.2,
Microsoft.Extensions.Http / Configuration.Abstractions.

## Commands
- Build: `dotnet build backend/Audit.slnx`
- Test: `dotnet test backend/Audit.slnx`
- Run backend: set `GEMINI_API_KEY`, then `dotnet run --project backend/Audit.Api`
  (health at `/health`, audit via `POST /api/audit` `{"url":"https://..."}`; listens :5171).
- Run frontend: `cd frontend && npm install && npm run dev` (:5173).
  Build/type-check: `npm run build`.
