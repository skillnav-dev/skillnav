# Worker 1102 — Cloudflare Worker Exceeded Resource Limits

Date: 2026-04-02

## Symptoms

- Intermittent "Error 1102 Worker exceeded resource limits" on skillnav.dev
- Affects dynamic SSR pages (articles, skills, homepage)
- More frequent on cold starts

## Root Cause

Cloudflare Workers have CPU time limits (30s default, configurable to 300s on paid plan) and 128MB memory. Our app had multiple compounding issues:

1. **No ISR caching** — articles/[slug], skills/[slug], homepage all fully dynamic SSR on every request
2. **KaTeX bundled globally** — 4.4MB KaTeX loaded for ALL article pages, even those without math (99%+)
3. **Every request = DB query + render** — no caching layer between Worker and Supabase

## Fix (commit f0d2d01)

### D1: KaTeX lazy loading
- `article-content.tsx` detects `$` in content, only loads `article-content-math.tsx` via `lazy()` when needed
- Non-math articles: 0 KaTeX overhead

### D2: ISR caching
- `/` homepage: `revalidate = 3600` (1h)
- `/articles/[slug]`: `revalidate = 3600` (1h)
- `/skills/[slug]`: `revalidate = 86400` (24h, same as MCP)
- `/mcp/[slug]`: already had `revalidate = 86400`
- `/daily/[date]`: already had `revalidate = 300`

### Effect
- 99%+ requests hit ISR cache, Worker doesn't execute rendering
- Remaining cold starts are lighter (no KaTeX)

## Prevention

- New pages with DB queries MUST set `revalidate`
- Heavy client-only libraries (KaTeX, chart libs) must use `lazy()` / dynamic import
- Monitor via Cloudflare dashboard: Workers → CPU Time percentile
