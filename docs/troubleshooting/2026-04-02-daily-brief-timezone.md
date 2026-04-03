# Daily Brief Timezone Bug — Lookback Window Off by 8h

Date: 2026-04-02

## Symptoms

- `generate-daily.mjs` logs "No published articles found in the last 24h" and skips brief generation
- CI runs at UTC 23:09, articles exist at UTC 20:40, but query returns 0 results
- `pipeline_runs` shows `status: skipped` repeatedly

## Root Cause

In `generate-daily.mjs`, the lookback window used `setHours(23, 59, 59)` which sets **UTC** hours (since the Date object is UTC-based). But `briefDate` is computed via `todayCST()` which returns a CST date string parsed as UTC midnight.

```js
// Bug: sets UTC 23:59, but should be CST 23:59 (= UTC 15:59)
until.setHours(23, 59, 59, 999);
```

Result: `until` = `2026-04-03T23:59:59 UTC` (= CST 4/4 07:59), `since` = `2026-04-02T23:59:59 UTC` (= CST 4/3 07:59). Articles published before UTC 23:59 on 4/2 fall outside the window.

## Fix

```js
// CST 23:59:59 = UTC 15:59:59
until.setUTCHours(15, 59, 59, 999);
const since = new Date(until.getTime() - lookbackHours * 3600 * 1000);
```

## Prevention

- Always use `setUTCHours` when the Date was constructed from a timezone-adjusted string
- The pattern `todayCST()` returns a "CST date as UTC midnight" — any time manipulation must account for the 8h offset
