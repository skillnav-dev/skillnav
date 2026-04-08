# Trending Tools Section Shows Empty Despite DB Having Data

**Date:** 2026-04-08
**Severity:** High (tools track completely empty on live site)
**Status:** Partially resolved — Skills showing, MCP still failing

## Symptoms

- `/trending` page shows "今日暂无显著热点" in tools section
- Local development shows 10 tools correctly
- API endpoint `/api/skill/query?type=trending` returns only skills, 0 MCP

## Root Cause (three issues)

### Issue 1: Monorepo tools dominating results

`anthropics/skills` monorepo (111,758 stars, +5192 delta) had ~30 entries all sharing the same inflated star count. `modelcontextprotocol/servers` similarly inflated MCP entries. Together they filled the top 20 query results.

**Fix:** Exclude monorepo URLs at DB query level with `.not("github_url", "like", "%anthropics/skills%")`.

### Issue 2: dedupeMonorepo checking wrong URL field

`dedupeMonorepo()` filtered on `t.url` (which was `skillnav.dev/skills/xxx`), not `t.github_url`. Monorepo filter never matched.

**Fix:** Changed to check `t.github_url` instead.

### Issue 3: MCP query silently returns empty on CF Workers (UNRESOLVED)

`from("mcp_servers" as "skills")` TypeScript type hack was used because Database types don't include `mcp_servers`. This works locally but returns 0 rows on CF Workers edge runtime. Attempted fixes:
- `as any` cast — still 0 MCP on production
- Direct REST API fetch — still 0 MCP on production
- Increased query limit — no effect

The exact cause is unknown. Possible factors:
- OpenNext CF adapter edge runtime behavior
- Supabase client initialization differences in edge vs node
- RLS policy evaluation differences

**Next step:** Debug by adding error logging to the MCP query on production, or try a completely separate Supabase client instance for the MCP query.

## Prevention

- Avoid `as "tableName"` type hacks for Supabase queries — add proper types to Database instead
- Test trending data on a staging CF Worker before shipping
