# SkillNav Skill MVP
Status: done
Progress: 2/2
Date: 2026-03-26

> Upstream: content-strategy-v3.md SS6, tool-intelligence-pipeline.md

## Problem

SkillNav 的内容（Daily Brief、3,947 MCP、168 Skills）只能通过网站访问。开发者在 Claude Code 里工作时，需要切换到浏览器查资讯、找工具。Skill 把内容送进工作流，零切换成本。

**核心价值主张**：MCP 推荐 + install command 直达，是和 WebSearch / ChatGPT 的本质差异。editor_comment_zh（编辑点评）是护城河，必须作为一级展示元素。

## Scope

### MVP (this plan)

| Feature | User Input | Output |
|---------|-----------|--------|
| Daily Brief | `/skillnav brief` or default | Today's brief (headline + highlights) |
| MCP Recommend | `/skillnav mcp database` | Top 3-5 matches with install command |
| Trending | `/skillnav trending` | This week's trending tools (stars delta) |

### Not MVP

- User preferences / subscription config
- Multi-language switch
- Write operations (bookmark, rate)
- Onboarding flow
- Skills recommendation (MCP first, higher data quality)
- Contextual recommendation ("I'm building RAG, what tools?") — future

## Technical Design

### Architecture

```
User: /skillnav mcp database
  |
  v
SKILL.md (sub-command routing: brief | mcp <kw> | trending)
  |
  v
WebFetch -> skillnav.dev/api/skill/query?type=mcp&q=database
  |
  v
Next.js API Route -> createPublicClient(anon key) -> Supabase -> JSON
  |
  v
Claude formats and presents to user (editor_comment prominent)
```

**Why API endpoints over static JSON**:
- Data already in Supabase, no extra build step
- Real-time (daily brief updates daily, stars update daily)
- Query parameters enable flexible filtering (category, keyword)
- Cost: zero (Cloudflare Workers, same infra)

### API Design

Single endpoint with `type` parameter (simpler routing, one URL for SKILL.md):

#### GET /api/skill/query?type={brief|mcp|trending}&q={keyword}&category={cat}&limit={n}

**Common rules**:
- Client: `createPublicClient()` with anon key (no cookies, no auth overhead)
- Input validation: `q.length <= 100`, `limit = Math.min(limit, 20)`, `type` required
- Error schema: `{ "error": "code", "message": "human-readable", "fallback": {...} | null }`
- Cache: `revalidate = 300` (5 min, sufficient for daily-updating data)

#### type=brief

Returns today's daily brief. Since `daily_briefs.content_md` is raw Markdown without structured fields, the API parses it into headline + highlights at response time.

```json
{
  "type": "brief",
  "date": "2026-03-23",
  "headline": { "title": "...", "summary": "...", "why_important": "..." },
  "highlights": [
    { "title": "...", "summary": "...", "comment": "..." }
  ],
  "url": "https://skillnav.dev/daily/2026-03-23",
  "is_fallback": false
}
```

Query: `daily_briefs` table, `status=published`, latest by date.
Fallback: if no brief today, return yesterday's with `is_fallback: true`.
Parsing: split content_md by `##` headings, extract first section as headline, rest as highlights.

#### type=mcp

Returns MCP recommendations matching query.

```json
{
  "type": "mcp",
  "query": "database",
  "total_matches": 15,
  "returned": 5,
  "search_method": "pgroonga",
  "results": [
    {
      "name": "PostgreSQL MCP Server",
      "name_zh": "PostgreSQL MCP Server",
      "description_zh": "...",
      "category": "database",
      "editor_comment_zh": "Official, Postgres users' first choice for MCP",
      "stars": 1200,
      "install_command": "npx -y @modelcontextprotocol/server-postgres",
      "github_url": "...",
      "url": "https://skillnav.dev/mcp/postgres"
    }
  ]
}
```

Query: `mcp_servers` table, `status=published`.
Search: PGroonga full-text on name/description/tags. **Fallback**: if PGroonga returns 0 results, retry with `ILIKE '%keyword%'` on name/description/tags.
Sort: quality_score DESC, stars DESC. Default limit: 5.

#### type=trending

Returns trending tools by stars delta.

```json
{
  "type": "trending",
  "period": "7d",
  "last_updated": "2026-03-23T02:30:00Z",
  "tools": [
    {
      "tool_type": "mcp",
      "name": "...",
      "name_zh": "...",
      "editor_comment_zh": "...",
      "stars": 5000,
      "weekly_stars_delta": 320,
      "freshness": "fresh",
      "url": "https://skillnav.dev/mcp/..."
    }
  ]
}
```

Query: Two parallel queries (skills + mcp_servers) merged in app layer via `getTrendingTools()`.
No DB VIEW — keeps logic in code for easier debugging and schema iteration.
Filter: `weekly_stars_delta >= 5` (not > 0, avoids returning near-zero noise).
Sort: app-layer merge + sort by weekly_stars_delta DESC.
Default: both types, limit 10.

### DB Changes

None. Trending uses existing tables with app-layer merge:

```ts
// src/lib/get-trending-tools.ts
async function getTrendingTools(supabase, limit = 10) {
  const [{ data: skills }, { data: mcps }] = await Promise.all([
    supabase.from('skills').select('slug, name, name_zh, editor_comment_zh, stars, weekly_stars_delta, freshness')
      .gte('weekly_stars_delta', 5).eq('status', 'published'),
    supabase.from('mcp_servers').select('slug, name, name_zh, editor_comment_zh, stars, weekly_stars_delta, freshness')
      .gte('weekly_stars_delta', 5).eq('status', 'published'),
  ]);
  const merged = [
    ...(skills ?? []).map(s => ({ ...s, tool_type: 'skill' })),
    ...(mcps ?? []).map(m => ({ ...m, tool_type: 'mcp' })),
  ].sort((a, b) => b.weekly_stars_delta - a.weekly_stars_delta);
  return merged.slice(0, limit);
}
```

### SKILL.md

```yaml
---
name: skillnav
description: "Search 3,900+ MCP servers with install commands, get daily AI brief, and discover trending tools — in Chinese. Data from skillnav.dev editorial team."
argument-hint: "brief | mcp <keyword> | trending"
allowed-tools: WebFetch
---
```

**Sub-command routing** (table format for higher Claude compliance):

```
Route based on $ARGUMENTS[0]:

| Command   | Action                                                       |
|-----------|--------------------------------------------------------------|
| brief     | WebFetch https://skillnav.dev/api/skill/query?type=brief     |
| mcp       | WebFetch https://skillnav.dev/api/skill/query?type=mcp&q=$ARGUMENTS[1] |
| trending  | WebFetch https://skillnav.dev/api/skill/query?type=trending  |
| (other)   | Show usage message — do NOT fetch any URL                    |
```

Unknown input returns usage help instead of silently falling back to brief — prevents silent misroutes and keeps usage metrics clean.

**Format rules**:

Brief:
- TL;DR line first (one sentence, bold)
- Headline with `> why_important` in blockquote
- Bulleted highlights, each with editor comment in parentheses
- Link to full page at bottom

MCP recommend:
- Numbered list, one blank line between items
- Name (bold) + category tag + stars count
- One-line description_zh
- `> editor_comment_zh` in blockquote (MUST show — this is our differentiator)
- Install command in code block (ready to copy-paste)

Trending:
- Ranked list with delta indicator (e.g. "stars 5,000 (+320 this week)")
- Group by tool_type (MCP / Skill sections)
- editor_comment_zh in parentheses where available

**Error handling**:
- If WebFetch fails: "SkillNav API is temporarily unavailable. Visit skillnav.dev directly."
- If results empty: "No matches found. Try a broader keyword." (no fake keyword suggestions)
- If brief is fallback: note the date explicitly

### Distribution

| Channel | Method | Priority |
|---------|--------|----------|
| GitHub repo | `github.com/skillnav-dev/skillnav-skill` | P0 (M1) |
| Personal install | `~/.claude/skills/skillnav/SKILL.md` | P0 (M1) |
| Website install section | /about page or banner | P0 (M1) |
| Daily Brief CTA | Each brief ends with Skill install link | P0 (M1) |
| ClawHub | Submit after validation | P1 (M2) |
| Community posts | Juejin, V2EX, HelloGitHub | P1 (M2) |

**Cold start plan** (first 10 installs):
1. Our own install (day 1)
2. Daily Brief readers — every brief (RSS/WeChat/X) ends with "In Claude Code: /skillnav brief"
3. X @skillnav_dev announcement post
4. Juejin article: "How to get MCP recommendations in Claude Code"
5. Submit to ClawHub + awesome-claude-skills

## Milestones

### M1: API + Skill + Install Entry (1 session)

| Task | Files | Notes |
|------|-------|-------|
| Public Supabase client | `src/lib/supabase-public.ts` | Anon key, no cookies |
| Unified query endpoint | `src/app/api/skill/query/route.ts` | type param routing, input validation, error schema |
| Brief parser | `src/lib/parse-brief.ts` | content_md -> headline + highlights JSON |
| getTrendingTools | `src/lib/get-trending-tools.ts` | Two queries + app-layer merge, no DB VIEW |
| PGroonga + ILIKE fallback | query route | search_method in response |
| SKILL.md | `skills/skillnav/SKILL.md` | Sub-command routing + format rules |
| Website install CTA | `/about` or homepage | Copy-paste install command |
| Local test | - | Install locally, test all 3 features + error cases |

### M2: Distribution + Polish (1 session)

| Task | Files | Notes |
|------|-------|-------|
| GitHub repo | `skillnav-dev/skillnav-skill` | README with examples + install |
| Rate limit | Cloudflare Rules (free tier) | 60 req/min, not middleware.ts |
| Brief CTA integration | `scripts/lib/publishers/` | Append Skill install link to all channels |
| Community launch | - | Juejin + X + ClawHub submission |

## Success Metrics

| Metric | M1 | 1 month | 3 months |
|--------|-----|---------|----------|
| API response time | < 500ms | < 300ms | < 200ms |
| GitHub repo stars | - | 20+ | 100+ |
| Daily API calls | test only | 50+ | 500+ |
| User installs | 1 (us) | 10+ | 50+ |
| **7-day retention** | - | > 30% | > 25% |
| **MCP install clicks** | - | track via API logs | growth trend |

Core health: API uptime > 99.5%, brief always available by 09:00 CST.

Proxy metrics (from API logs):
- Endpoint distribution: mcp > brief > trending = users find tool search most valuable
- Zero-result rate < 20% = search quality acceptable
- Repeat callers / unique IPs = retention signal

## Risks

| Risk | Probability | Mitigation |
|------|------------|------------|
| WebFetch blocked by Cloudflare | Low | Our own domain, no WAF issue |
| PGroonga short query miss | Medium | ILIKE fallback, search_method in response |
| No daily brief (pipeline failure) | Low | Fallback to latest with is_fallback flag |
| Low install rate (discoverability) | High | Brief CTA + community posts + ClawHub |
| editor_comment_zh coverage gaps | Medium | Graceful degradation: show description_zh if null |
| Abuse on public API | Medium | Cloudflare Rules rate limit from M1 (not M2) |

## Dependencies

- Daily Brief pipeline running daily (active)
- `mcp_servers` table populated with published entries (M1 done)
- `refresh-tool-metadata.mjs` running weekly for trending data (M3 done)
