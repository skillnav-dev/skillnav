# SkillNav Skill MVP
Status: draft
Progress: 0/2
Date: 2026-03-23

> Upstream: content-strategy-v3.md SS6, tool-intelligence-pipeline.md

## Problem

SkillNav 的内容（Daily Brief、3,947 MCP、168 Skills）只能通过网站访问。开发者在 Claude Code 里工作时，需要切换到浏览器查资讯、找工具。Skill 把内容送进工作流，零切换成本。

## Scope

### MVP (this plan)

| Feature | User Input | Output |
|---------|-----------|--------|
| Daily Brief | "today" / "brief" / default | Today's brief (headline + highlights) |
| MCP Recommend | "mcp database" / "mcp monitoring" | Top 3-5 matches with install command |
| Trending | "trending" / "hot" | This week's trending tools (stars delta) |

### Not MVP

- User preferences / subscription config
- Multi-language switch
- Write operations (bookmark, rate)
- Onboarding flow
- Skills recommendation (MCP first, higher data quality)

## Technical Design

### Architecture

```
User: /skillnav "mcp database"
  |
  v
SKILL.md (prompt routing)
  |
  v
WebFetch -> skillnav.dev/api/skill/{endpoint}
  |
  v
Next.js API Route -> Supabase query -> JSON response
  |
  v
Claude formats and presents to user
```

**Why API endpoints over static JSON**:
- Data already in Supabase, no extra build step
- Real-time (daily brief updates daily, stars update daily)
- Query parameters enable flexible filtering (category, keyword)
- Cost: zero (Cloudflare Workers, same infra)

### API Endpoints (3 routes)

#### GET /api/skill/brief

Returns today's daily brief.

```json
{
  "date": "2026-03-23",
  "headline": { "title": "...", "summary": "...", "why_important": "..." },
  "highlights": [
    { "title": "...", "summary": "...", "comment": "..." }
  ],
  "url": "https://skillnav.dev/daily/2026-03-23"
}
```

Query: `daily_briefs` table, `status=published`, latest by date.
Fallback: if no brief today, return yesterday's with note.

#### GET /api/skill/mcp?q={keyword}&category={cat}&limit={n}

Returns MCP recommendations matching query.

```json
{
  "query": "database",
  "results": [
    {
      "name": "PostgreSQL MCP Server",
      "name_zh": "PostgreSQL MCP Server",
      "description_zh": "...",
      "editor_comment_zh": "official and reliable",
      "stars": 1200,
      "install_command": "npx -y @modelcontextprotocol/server-postgres",
      "github_url": "...",
      "url": "https://skillnav.dev/mcp/postgres"
    }
  ],
  "total": 15
}
```

Query: `mcp_servers` table, `status=published`, PGroonga full-text on name/description/tags.
Sort: quality_score DESC, stars DESC.
Default limit: 5.

#### GET /api/skill/trending?type={skill|mcp}&days={7}

Returns trending tools by stars delta.

```json
{
  "period": "7d",
  "tools": [
    {
      "type": "mcp",
      "name": "...",
      "name_zh": "...",
      "stars": 5000,
      "weekly_stars_delta": 320,
      "freshness": "fresh",
      "url": "https://skillnav.dev/mcp/..."
    }
  ]
}
```

Query: `skills` + `mcp_servers` tables, `is_trending=true` OR `weekly_stars_delta > 0`, sorted by delta DESC.
Default: both types, 7 days, limit 10.

### SKILL.md

```yaml
---
name: skillnav
description: AI developer news and tool recommendations from skillnav.dev. Use when the user asks about AI news, MCP server recommendations, trending AI tools, or daily brief.
allowed-tools: WebFetch
---
```

Prompt body handles routing:
- Input contains "mcp" + keyword -> `/api/skill/mcp?q={keyword}`
- Input contains "trending"/"hot" -> `/api/skill/trending`
- Default (no keyword, "today", "brief", "news") -> `/api/skill/brief`

Format rules in prompt:
- Brief: headline first, then bulleted highlights, link to full page
- MCP: numbered list with name, one-line description, install command (code block), stars
- Trending: ranked list with delta indicator

### Distribution

| Channel | Method | Priority |
|---------|--------|----------|
| GitHub repo | `github.com/skillnav-dev/skillnav-skill` | P0 |
| Personal install | `~/.claude/skills/skillnav/SKILL.md` | P0 |
| Project install | `.claude/skills/skillnav/SKILL.md` | P0 |
| ClawHub | Submit after validation | P1 |
| SkillNav website | Install instructions on /about or dedicated page | P1 |

Install command for users:
```bash
git clone https://github.com/skillnav-dev/skillnav-skill.git ~/.claude/skills/skillnav
```

## Milestones

### M1: API + Skill (1 session)

| Task | Files | Notes |
|------|-------|-------|
| Brief API endpoint | `src/app/api/skill/brief/route.ts` | Query daily_briefs, format JSON |
| MCP recommend endpoint | `src/app/api/skill/mcp/route.ts` | PGroonga search, quality sort |
| Trending endpoint | `src/app/api/skill/trending/route.ts` | Stars delta sort |
| SKILL.md | `skills/skillnav/SKILL.md` | Routing prompt + format rules |
| Local test | - | Install locally, test all 3 features |

### M2: Distribution + Polish (1 session)

| Task | Files | Notes |
|------|-------|-------|
| GitHub repo | `skillnav-dev/skillnav-skill` | README with install instructions |
| API rate limit | `src/middleware.ts` or route-level | Basic rate limit (60 req/min/IP) |
| Edge cases | API routes | No brief today, no MCP match, empty trending |
| Website install page | `src/app/skill/page.tsx` | Install instructions + feature preview |

## Success Metrics

| Metric | M1 | 1 month | 3 months |
|--------|-----|---------|----------|
| API response time | < 500ms | < 300ms | < 200ms |
| GitHub repo stars | - | 20+ | 100+ |
| Daily API calls | test only | 50+ | 500+ |
| User installs | 1 (us) | 10+ | 50+ |

Core health: API uptime > 99.5%, brief always available by 09:00 CST.

## Risks

| Risk | Probability | Mitigation |
|------|------------|------------|
| WebFetch blocked by Cloudflare | Low | Our own domain, no WAF issue |
| PGroonga search quality for short queries | Medium | Fallback to ILIKE if PGroonga miss |
| No daily brief (pipeline failure) | Low | Fallback to latest available brief |
| Low install rate (discoverability) | High | Content marketing + ClawHub submission |

## Dependencies

- Daily Brief pipeline running daily (active)
- `mcp_servers` table populated with published entries (M1 done)
- `refresh-tool-metadata.mjs` running weekly for trending data (M3 done)
