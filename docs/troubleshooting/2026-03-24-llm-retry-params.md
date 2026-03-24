# LLM Retry Params Causing sync-articles to Hang

Date: 2026-03-24
Status: resolved

## Symptom

`sync-articles.mjs` ran for 1+ hour with CPU at 0.0%, appeared hung.

## Root Cause

LLM retry parameters in `scripts/lib/llm.mjs` were too aggressive:
- `RETRY_COUNT = 10` (10 retries per call)
- `RETRY_BASE_DELAY_MS = 30_000` (30s, exponential to 480s)
- `RETRY_MAX_DELAY_MS = 480_000` (8 min cap)

When DeepSeek returned 502/timeout, single article worst case: ~56 minutes of retry waits.

Combined with outer `withRetry` wrapper in sync-articles.mjs (3 retries, 1s base), total could exceed 1 hour per article.

## Fix

Changed `scripts/lib/llm.mjs`:
- `RETRY_COUNT`: 10 → 3
- `RETRY_BASE_DELAY_MS`: 30s → 5s
- `RETRY_MAX_DELAY_MS`: 480s → 30s

New worst case per article: ~35 seconds. Outer `withRetry` kept (lightweight 1s/2s/4s).

## Lesson

- Retry backoff should be proportional to acceptable wait time, not provider recovery time
- Double retry layers (outer + inner) multiply worst-case exponentially — audit both
- DeepSeek 502 is routine (high-load periods), not actionable on our side
