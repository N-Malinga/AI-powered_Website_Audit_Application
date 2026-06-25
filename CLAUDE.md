# Website Audit Tool

AI-powered single-page website auditor. Accepts a URL, extracts factual metrics
deterministically, then uses Gemini to generate grounded insights and recommendations.

## Core principle
Metrics are computed in code and treated as ground truth. The LLM NEVER computes or
estimates metrics — it only interprets the numbers we give it. Keep scraping and AI
analysis in separate layers with separate interfaces.

## Backend architecture (ASP.NET Core)
- Core: domain models (PageMetrics, AuditResult, Insight, Recommendation), interfaces,
  MediatR command + handler, FluentValidation.
- Infrastructure: HttpPageFetcher, AngleSharpMetricsExtractor, GeminiAiAnalyzer, PromptLogger.
- Api: single POST /api/audit endpoint, GET /health, GlobalExceptionHandler, CORS.

## Interfaces
- IPageFetcher: URL -> raw HTML
- IMetricsExtractor: HTML -> PageMetrics (deterministic, unit-tested)
- IAiAnalyzer: (PageMetrics + trimmed content) -> AiAnalysis (insights + recommendations)
- IPromptLogger: captures system prompt, user prompt, structured input, raw output

## AI layer
- Gemini 2.5 Flash, responseMimeType application/json + responseSchema.
- System prompt enforces: cite specific metric values, no generic advice, agency framing.
- A grounding guard verifies insights reference real metrics; retry once if not.

## Conventions
- C# records for DTOs. Nullable enabled. async everywhere.
- No secrets in code. GEMINI_API_KEY from env.
- Frontend (React) keeps Metrics, Insights, and Recommendations visually separate.