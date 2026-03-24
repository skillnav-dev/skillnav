# ADR-006: CI Schedule Redesign — Distribute Weekly Tasks

Date: 2026-03-24
Status: accepted

## Context

All weekly tasks (Skills sync, MCP sync, metadata snapshot, governance, backfill) were stacked on Monday. Additionally, metadata refresh and backfill ran daily despite slow-changing data.

Problems:
- Monday had 6+ concurrent jobs competing for resources
- backfill-data ran daily (60min/run) despite minimal incremental data → 1800min/mo wasted
- metadata refresh ran daily despite stars changing slowly → 450min/mo wasted
- Total CI: ~3,700min/mo, exceeding GitHub Actions free tier (2,000min)

## Decision

Distribute weekly tasks by category across weekdays:

| Day | Tasks | Rationale |
|-----|-------|-----------|
| Mon | Skills sync + curated + metadata snapshot + weekly newsletter | Skills day — all skill-related ops |
| Tue | metadata refresh | Mid-week freshness check |
| Wed | backfill-data (weekly, was daily) | Data quality day — backfill Mon's new data |
| Thu | MCP sync | MCP day — separated from Skills |
| Fri | MCP governance + metadata refresh | Governance after sync, end-week refresh |

Daily heartbeat (unchanged): article sync 2x + daily brief (workflow_run) + health-check.

## Consequences

- CI budget: ~3,700 → ~1,800 min/mo (within free tier)
- Monday load: 6 jobs → 3 jobs
- Each day has at most 1 heavy weekly task
- Weekend: heartbeat only, zero human involvement
- Failure isolation: one day's failure doesn't cascade to others

## Alternatives Considered

- Serial dependency chain (Mon: curated → skills → govern → mcp → backfill) — rejected: no real data conflicts between jobs, serial would take 4+ hours and cascade failures
- Keep daily backfill/refresh — rejected: data doesn't change fast enough to justify cost
