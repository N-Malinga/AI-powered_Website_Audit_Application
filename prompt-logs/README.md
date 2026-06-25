# Prompt logs

Every audit writes one timestamped JSON record per AI attempt here (the original call plus any
grounding retry), produced by `PromptLogger` (`backend/Audit.Infrastructure/PromptLogger.cs`).

Each record captures, verbatim:
- `timestamp` — UTC ISO-8601 of the exchange.
- `systemPrompt` — the verbatim system prompt sent to Gemini.
- `userPrompt` — the fully constructed user prompt (metrics + severity flags + trimmed content).
- `structuredInput` — the structured JSON input (PageMetrics + objective severity flags).
- `rawOutput` — the raw model output **before** deserialization.

The configured `GEMINI_API_KEY` is redacted to `[REDACTED]` as a safety net (the key is sent in
the request URL, not in these fields, so it does not normally appear here).

## What's committed
Runtime records are git-ignored (see `.gitignore`). Only the curated `example-*.json` files are
committed as reference runs:

| File | Page audited |
| ---- | ------------ |
| `example-1-python-org.json` | https://www.python.org |
| `example-2-example-com.json` | https://example.com |
| `example-3-djangoproject-com.json` | https://www.djangoproject.com |

Override the output location with the `PromptLogs:Directory` config key (or
`PromptLogs__Directory` env var). The default is this `prompt-logs/` folder at the repo root.
