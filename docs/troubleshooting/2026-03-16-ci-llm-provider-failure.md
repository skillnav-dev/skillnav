# CI Sync-Articles LLM Provider Failure

- **Date**: 2026-03-16
- **Severity**: High (content pipeline blocked 3 days)
- **Tags**: ci, llm, deepseek, cloudflare, sync-articles

## Symptom

`sync-articles.yml` CI job failed 5 consecutive runs (2026-03-13 ~ 2026-03-15). All LLM translation calls timed out or returned Cloudflare 524 errors. RSS fetching worked fine — only the GPT proxy (`gmn.chuangzuoli.com`) calls failed.

## Root Cause

The GPT proxy is behind Cloudflare, which blocks or rate-limits GitHub Actions IP ranges (~5,879 CIDR blocks). Cloudflare returns 524 (origin timeout) or drops connections entirely. The proxy works fine from local (China) networks.

## Fix Applied

1. **Switched CI LLM provider to DeepSeek** (`LLM_PROVIDER=deepseek`) — direct API, no Cloudflare proxy
2. **Added LLM fallback mechanism** (`LLM_FALLBACK_PROVIDER=gemini`) — after 3 consecutive failures, auto-switch to fallback provider for the rest of the run
3. **Fixed DeepSeek max_tokens cap** — DeepSeek API limit is 8192, not 16384. Added per-provider `maxOutputTokens` config
4. **Increased LLM timeout** — 60s → 120s (DeepSeek needs more time for long articles)
5. **Increased workflow timeout** — 45min → 120min (14 sources with full translation backlog)

## Files Changed

- `scripts/lib/llm.mjs` — fallback state tracking, `maxOutputTokens` per provider, timeout increase
- `.github/workflows/sync-articles.yml` — provider switch, env vars, timeout

## Key Learnings

- GPT proxy works locally but not from GitHub Actions — always verify CI network path separately
- `/v1/models` responding does NOT mean `/v1/responses` will work (inference is much slower)
- DeepSeek `max_tokens` hard limit is 8192 — must cap per provider
- 45min workflow timeout insufficient for 14-source full sync with DeepSeek latency (~60s/article)

## Verification

After fix: 18 articles inserted from Anthropic source alone (0 failed except 1 very long article). Full 14-source sync running with 120min timeout.
