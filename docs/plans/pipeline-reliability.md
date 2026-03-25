# Pipeline Reliability Redesign
Status: done
Date: 2026-03-25
Upstream: content-strategy-v3.md, content-operations-spec.md

> 6-agent research + Codex review → v3 final

## Problem

SkillNav is a one-person content operation. The pipeline must take care of itself.
GitHub Actions billing stopped for 2 days (2026-03-23~25), zero articles collected,
zero alerts triggered. Root causes are structural, not operational.

## Three Design Decisions

### Decision 1: Data layer hardening — make duplicate insertion impossible

`articles.source_url` has no UNIQUE constraint. Dedup relies on application code.
URL variants (trailing slash, http/https, tracking params) bypass any naive check.

Implementation:
- Add `source_url_normalized` generated column using `normalize_url()` function
- UNIQUE constraint on the normalized column (CONCURRENTLY to avoid locks)
- Clean existing duplicates before adding constraint
- Scripts don't need to change — DB guarantees idempotency

```sql
-- Normalization function
CREATE OR REPLACE FUNCTION normalize_url(url TEXT) RETURNS TEXT AS $$
  SELECT regexp_replace(
    regexp_replace(
      regexp_replace(lower(trim(url)), '^http://', 'https://'),
      '[?#].*$', ''),
    '/$', '')
$$ LANGUAGE sql IMMUTABLE;

-- Cleanup → generated column → UNIQUE index
-- (full migration in supabase/migrations/)
```

Rollback: `DROP CONSTRAINT` + `DROP COLUMN source_url_normalized`

### Decision 2: Source isolation + idempotent execution — no cascading failures

Problems: Sanity API failure kills entire script. Two runners can race.

Implementation:
- Every source in independent try/catch (Sanity no longer special)
- `pipeline_runs` table as distributed lock: `duration_s = null` means running,
  new run checks for unfinished same-pipeline records within 30min → skip
- LLM circuit breaker: 3 failures → open (switch to fallback) → 10min cooldown
  → half-open (try primary once) → success closes circuit

Rollback: `git revert`

### Decision 3: External probe — detect outage within 2 hours

Problem: Monitoring runs on the same platform as the monitored system.

Implementation:
- `/api/health` endpoint: query `pipeline_runs` for latest `started_at`,
  return `"stale"` if >36h. Signal is pipeline freshness, not article age
  (avoids false alerts on slow news days)
- Better Stack (free): ping `/api/health` every 5min, keyword monitor
  detects `"stale"` → Slack alert
- `scripts/failover-check.mjs` + macOS launchd: hourly check `pipeline_runs`
  table (not GitHub API), >36h no record → run collection locally.
  Reuses concurrency lock from Decision 2 — won't double-run with CI.

Rollback: unload launchd plist + delete `/api/health`

## What we're NOT doing

| Excluded | Why |
|----------|-----|
| RSSHub / dual-path fetch | Verify IP vs UA blocking first, don't blindly add dependencies |
| RSS retry | 15s timeout + continue is sufficient. Retry caused the 1h stall incident |
| BROWSER_HEADERS swap | Same — verify before changing |
| Admin health banner | Passive monitoring has no value when external push exists |
| CI RSS cache | Ephemeral runners make this pointless |
| CF Workers rewrite | 10h+ rewrite cost, uncertain benefit |
| Phased rollout D0-D3 | Three decisions are one coherent unit |

## Success Criteria

| Metric | Before | After |
|--------|--------|-------|
| Outage detection time | >48h | <2h |
| Auto-recovery time | none | <1h (launchd takeover) |
| Data duplicates | no protection | DB-level impossible |
| Single-source failure blast radius | entire script | that source only |
| Concurrent double-run | no protection | DB lock, auto-skip |

## Effort

~2.5 hours total (DB cleanup 30min + source isolation 10min + concurrency lock 20min +
circuit breaker 30min + /api/health 15min + failover script 30min + deploy 15min)

## Review History

- v1: 4-phase D0-D3 plan (17 tasks) — rejected as too scattered
- v2: Codex review incorporated, cut to 11 tasks — still too engineering-focused
- v3 (this): 3 design decisions, one deployment — approved pending execution
- Codex review: 7 critical + 11 major findings, all addressed in v3
- **Implemented**: 2026-03-25, all 3 decisions deployed + tested + Better Stack + launchd configured
