# Dry Pipeline: CI Running But 0 Articles Inserted

Date: 2026-03-30

## Symptoms

- Daily brief skipped for 3 consecutive days (2026-03-28 ~ 2026-03-30)
- `sync-articles` status = `success` but `summary.inserted = 0`
- `generate-daily` status = `skipped` with `reason: no_articles`
- Local failover did NOT trigger (pipeline_runs existed, just empty yield)

## Root Cause

Two factors combined:

1. **GitHub Actions IP blocked by RSS sources** — Cloudflare Blog, Lobsters, and other sources block GitHub Actions IP ranges via WAF. The same script locally fetches 183 articles but CI gets 0 new ones.
2. **Weekend low volume** — Remaining unblocked sources had no new content over the weekend, resulting in 0 inserts across all CI runs.

The existing failover (`failover-check.mjs`) only checked "has a pipeline_run happened in the last 36h?" — CI was running successfully (status=success), just producing nothing. So failover never triggered.

## Fix

Updated `scripts/failover-check.mjs` to add a second trigger:

- **Check 1 (existing)**: Stale — no pipeline_runs for >36h
- **Check 2 (new)**: Dry — last 24h has ≥3 `sync-articles` runs with `summary.inserted` totaling 0

When either trigger fires, local collection runs automatically via launchd.

Key constants:
- `DRY_HOURS = 24` — lookback window
- `DRY_MIN_RUNS = 3` — minimum runs to avoid false positives

## Prevention

- Failover now detects both "not running" and "running but empty"
- Medium-term: consider RSS proxy via Cloudflare Workers for blocked sources
- Weekend gaps may still occur if sources genuinely publish nothing — use `--hours 72` for manual catch-up briefs
