# Handoff — Skills 2.0: From Database to Curated Gallery

## Objective

将 SkillNav Skills 模块从 ClawHub 爬虫镜像（6,447 低质 skills）转型为跨平台精选策展（Claude + Codex 双平台 ~135 高质量 skills），每个 skill 有中文名、编辑点评、多客户端安装指南、质量评级。

## Current State

### Completed (prior sessions)
- Content governance system: quality_tier (A/B/C), is_hidden, 10 categories
- 6,447 skills from ClawHub, 98.9% content backfilled (99.95% zero engagement)
- Article pipeline live (29 articles, 9 RSS sources, LLM translation)
- Skill detail page: two-column layout with content/install/sidebar
- RSS expanded from 4 to 9 sources, feed parsing hardened
- Strategic direction: content-first + quick-launch capability

### Completed (this session — planning only, no code changes)
- **Skills 2.0 strategy finalized**: curate ~135 skills from 7 high-quality repos, hide ClawHub data
- **Competitive analysis completed**: mcp.so, Glama, Smithery, ClawHub (detailed feature comparison)
- **7 source repos validated** (all active as of 2026-03-04):
  - P0: anthropics/skills (83K★, 16 skills) + openai/skills (10.7K★, 31 curated)
  - P1: daymade/claude-code-skills (621★, ~40) + alirezarezvani/claude-skills (2.3K★, ~15)
  - P2: levnikolaevich/claude-code-skills (144★, pick 25/108) + developer-kit (132★, pick 6/11) + neon (32★, 2)
- **Feature decisions made**:
  - Comments: giscus (GitHub Discussions widget, zero backend)
  - Repo browsing: filter-based (`/skills?repo=xxx`), not separate routes
  - Listing page: tabs (featured/latest/all) + platform filter + sort selector
  - Card: platform badge + quality badge + editor comment
  - Detail: multi-client install tabs (Claude Code / Codex / Cursor)
  - SEO: SoftwareApplication Schema
- **Competitor features mapped**: what to borrow vs skip (see details below)

### Key Competitive Insights
- **mcp.so**: Simple cards, Featured/Latest tabs, Blog/Cases content, Sponsor model. 18K listings, 1M+ monthly visits
- **Glama**: A-F security/quality/license grading, 7 sort options, 50+ filters, SoftwareApplication Schema, MCP API
- **Smithery**: Multi-client install (deep links), hosted deployment, Skills feature added
- **ClawHub**: Dead — 36% security vulnerabilities, 341+ malicious skills, no audit infrastructure. Lesson: security is existential
- **SkillNav edge**: Only Chinese site covering both Claude Skills + Codex Skills with editorial voice

### Borrowed from competitors
| Feature | Source | Why |
|---------|--------|-----|
| Featured/Latest/All tabs | mcp.so | Simple, zero cognitive cost |
| Sort selector (stars/updated) | Glama | Current: stars-only, no user choice |
| Platform filter (Claude/Codex) | Original | Cross-platform = unique positioning |
| Quality badge on cards | Glama A-F | Already have quality_tier, just visualize it |
| Multi-client install tabs | Smithery | Show install for Claude Code / Codex / Cursor |
| SoftwareApplication Schema | Glama | SEO rich snippets |
| giscus comments | Common pattern | Zero backend, GitHub-native for dev audience |

### Explicitly NOT borrowed
| Feature | Why skip |
|---------|---------|
| Playground / online try | High complexity, Skills can't run remotely like MCP |
| Discussions / forum | No user base yet, giscus comments sufficient |
| 50+ filter dimensions | 135 skills doesn't need it, over-engineering |
| Deep link install | Platform-specific, fragile |
| Claim mechanism | Premature |

## Next Actions

### Phase 1: Data Layer Rebuild (3-4 days)

1. **DB migration** `supabase/migrations/20260305_skills_v2.sql`:
   - `ALTER TABLE skills ADD COLUMN platform TEXT CHECK (platform IN ('claude', 'codex', 'universal'))`
   - `ALTER TABLE skills ADD COLUMN repo_source TEXT`
   - `ALTER TABLE skills ADD COLUMN editor_comment_zh TEXT`
   - `UPDATE skills SET is_hidden = true WHERE source = 'clawhub'`

2. **Create sync script** `scripts/sync-curated-skills.mjs`:
   - Adapter pattern: one parser per repo (7 adapters)
   - Interface: `{ repo, source, platform, listSkills(tree), parseSkill(content, meta) }`
   - Shared infra: `scripts/lib/llm.mjs`, `scripts/lib/supabase-admin.mjs`, `scripts/lib/logger.mjs`
   - Adapters in `scripts/adapters/`:
     - `anthropic.mjs` → `skills/{name}/SKILL.md`, platform='claude'
     - `openai.mjs` → `skills/.curated/{name}/`, platform='codex'
     - `daymade.mjs` → `{name}/` root, platform='claude'
     - `alirezarezvani.mjs` → `{name}/` root, platform='claude'
     - `levnikolaevich.mjs` → `ln-{num}-{name}/` (whitelist), platform='claude'
     - `developer-kit.mjs` → `plugins/{name}/`, platform='claude'
     - `neon.mjs` → `skills/{name}/`, platform='universal'

3. **Sync P0 sources**: anthropics/skills (16) + openai/skills (31) = 47 skills

4. **LLM translate**: Chinese name + description + editor comment for all 47

### Phase 2: Community Sources (2-3 days)

1. daymade adapter + sync (~40 skills)
2. alirezarezvani adapter + sync (~15 skills)
3. levnikolaevich whitelist selection + adapter (25 skills)
4. developer-kit + neon adapters (8 skills)
5. Full LLM translation + editor comments (~88 skills)
6. **Phase 2 milestone**: ~135 curated skills live

### Phase 3: Frontend Upgrade (2-3 days)

1. **Skills toolbar**: tabs (featured/latest/all) + platform filter + repo filter + sort selector
   - `src/lib/skills-search-params.ts`: add `platform`, `repo`, `sort`, `tab` params
   - `src/components/skills/skills-toolbar.tsx`: new filter chips + sort dropdown
2. **Skill card redesign**: platform badge + quality badge (A/B) + editor comment preview + repo link
   - `src/components/skills/skill-card.tsx`
3. **Skill detail page enhancements**:
   - Multi-client install tabs (Claude Code / Codex / Cursor): `src/components/skills/skill-install.tsx`
   - Repo source in sidebar with "view all from repo" link: `src/components/skills/skill-sidebar.tsx`
4. **SEO**: SoftwareApplication JSON-LD schema on detail pages
   - `src/components/shared/skill-jsonld.tsx`
5. **Homepage**: update stats section + featured skills refresh
   - `src/components/home/stats-section.tsx`, `src/components/home/featured-skills.tsx`
6. **giscus comments**: embed at bottom of skill detail page
   - Create `skillnav-dev/discussions` public repo, enable Discussions
   - `src/components/skills/skill-comments.tsx` (giscus React component)
   - Mapping: skill slug → Discussion title

### Phase 4: Operations (ongoing)

1. GitHub Actions: `sync-curated-skills.yml` weekly cron
2. New skill discovery: GitHub trending monitoring
3. Original skill reviews (reuse articles pipeline)

## Risks & Decisions

- **135 skills "looks too few"**: Each has editorial depth. Homepage shows "精选 X 个" not total count. Quality perception > quantity
- **Upstream repo structure changes**: Adapter isolation — one repo breaking doesn't affect others. Weekly sync has error reporting
- **ClawHub SEO impact**: Detail pages stay accessible (DAL doesn't filter detail page). Remove from sitemap only. Monitor GSC 30 days
- **levnikolaevich selection**: Pick criteria — universal dev scenarios > workflow-specific, no overlap with other repos
- **giscus dependency**: If GitHub Discussions API changes, easy to swap (it's one component). Data exportable via GitHub API

## Verification

- `npm run build` — should pass (1037 pages, ~775ms)
- `node scripts/sync-articles.mjs --dry-run --limit 3` — 9 RSS sources, 0 failures
- `git status` — clean working tree, 1 commit ahead of origin

## Modified Files (this session)

- `docs/handoff/current.md` — this file (updated from content-first strategy to Skills 2.0 plan)
- No code changes — this was a pure planning session
