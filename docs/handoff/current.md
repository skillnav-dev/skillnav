# Handoff — Strategic Pivot: Skills → AI Agent Tools Directory

## Objective

Expand SkillNav from a Claude Code Skills-only directory to a curated AI Agent tools directory (MCP Servers + Skills), pivoting from quantity (6,400 low-quality) to quality (~300-500 community-validated tools).

## Current State

### Completed (prior sessions)
- Content governance system shipped: quality_tier, is_hidden, 10 categories, spam detection
- 6,447 skills ingested from ClawHub, 98.9% content backfilled
- Article pipeline live (29 articles synced via LLM translation)
- Skill detail page with two-column layout
- **10 unpushed commits on main** (content governance work)

### Completed (this session — strategic planning)
- **Data quality audit**: confirmed ClawHub data is low-value (99.95% zero stars/downloads)
- **Skills quality scoring simulation**: tested V1 (content-length only) and V2 (multi-dimensional) — both fail because underlying data has no community signals
- **MCP ecosystem research**: mapped all major registries (Smithery, Glama, PulseMCP, mcp.so, official registry, 6+ Chinese competitors)
- **Smithery API deep analysis**: 3,717 entries → 1,412 unique (62% duplicates!) → 296 with useCount ≥ 100
- **Strategic decision**: abandon complex auto-scoring for low-quality Skills, pivot to curated MCP + Skills directory

### Key Data Findings

**Smithery MCP servers (go-to data source):**
- API: `GET https://registry.smithery.ai/servers?q=&pageSize=100&page=N` (free, no auth)
- 1,412 unique servers after dedup
- useCount ≥ 100: **296 servers** (ideal curated set)
- useCount ≥ 1000: **138 servers** (head tools)
- 24 verified (Exa 1.5M uses, Slack 20K, GitHub 6.2K, Notion 5.4K...)
- Detail endpoint: `GET https://registry.smithery.ai/servers/{qualifiedName}` — returns tools[] with full schemas

**Official MCP Registry:**
- API: `GET https://registry.modelcontextprotocol.io/v0.1/servers` (free, no auth)
- Bare-bones: name, description, repository, remotes — no usage data
- Useful as supplementary/authority source

**Chinese MCP competitors:** MCPMarket.cn (22K+), mcp.so (18K, open-source Next.js+Supabase), MCPWorld, MCPZone — all doing quantity-based aggregation, no editorial curation

### In Progress
- None — this was a strategy session, no code changes

## Next Actions

### Phase 1: Data Layer (3-5 days)
1. **DB migration** `supabase/migrations/004-mcp-expansion.sql`:
   - Add `tool_type TEXT DEFAULT 'skill' CHECK (tool_type IN ('skill','mcp_server','prompt','framework'))` to skills table
   - Add `quality_score INTEGER DEFAULT 0` (0-100)
   - Expand `quality_tier` CHECK to include `'S'`
   - Add MCP fields: `transport TEXT[]`, `capabilities TEXT[]`, `registry_downloads INTEGER`, `registry_source TEXT`
   - Expand `source` CHECK to include `'smithery','glama','pulsemcp','mcp_official'`
2. **Type updates** `src/data/types.ts`: add `ToolType`, expand `SkillSource`, add MCP-specific fields to `Skill` interface
3. **Mapper updates** `src/lib/supabase/mappers.ts`: map new snake_case → camelCase fields
4. **DAL updates** `src/lib/data/skills.ts`: add `tool_type` filter parameter to listing functions

### Phase 2: MCP Data Sync (3-5 days)
1. **Create `scripts/sync-mcp.mjs`**: Smithery API → filter(useCount ≥ 50) → dedup → LLM translate(name_zh, description_zh) → upsert(tool_type='mcp_server')
2. **Quality scoring**: for MCP servers, use `useCount` directly (log-scale → 0-100 score). Simple and based on real data
3. **Tier assignment**: S = verified OR useCount ≥ 5000; A = useCount ≥ 500; B = useCount ≥ 50; C = rest

### Phase 3: Frontend (3-5 days)
1. **Navigation**: add MCP Servers section (or unified "Tools" with type filter)
2. **Toolbar**: add `tool_type` param to `skills-search-params.ts`
3. **Card adaptation**: show transport/capabilities for MCP, install_command for Skills
4. **Detail page**: MCP config snippet, capabilities list, real download count

### Phase 4: Existing Skills Cleanup
1. **Simplify tier logic**: S = manual featured; A = has real stars/downloads; B = has content; C = stub
2. **Stop investing** in `govern-skills.mjs` complexity
3. **Keep pages** for SEO, but deprioritize from featured/homepage

## Risks & Decisions

- **Brand tension**: skillnav.dev has "skill" in domain — acceptable short-term (skill = agent capability), revisit if MCP > 70% of content
- **Smithery API stability**: startup, API may change — build with abstraction layer, consider Glama/PulseMCP as backup
- **Chinese competitor lead**: MCPMarket.cn has 22K+ entries — but they do quantity, we do quality+editorial, different value prop
- **Unpushed commits**: 10 commits on main need pushing before starting new work
- **Product plan conflict**: original plan says "MCP导航已是红海，不碰" — this pivot contradicts that, user has approved the direction change

## Verification

- `git log --oneline -10` — confirm 10 unpushed governance commits
- `npm run build` — should pass (last confirmed working)
- `curl -s "https://registry.smithery.ai/servers?pageSize=1" | python3 -m json.tool` — verify Smithery API accessible
- `curl -s "https://registry.modelcontextprotocol.io/v0.1/servers?limit=1" | python3 -m json.tool` — verify official registry API

## Reference Documents

- Product plan: `/Users/apple/WeChatProjects/tishici/docs/playbook/skillnav-product-plan.md`
- Content governance plan: `docs/plans/content-governance.md`
- Smithery API: `https://registry.smithery.ai/servers` (no auth, paginated)
- Official MCP Registry API: `https://registry.modelcontextprotocol.io/v0.1/servers`
- PulseMCP API: `https://api.pulsemcp.com/v0.1/servers` (needs API key)
