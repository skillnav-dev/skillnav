# Handoff — Content-First Strategy + RSS Source Expansion

## Objective

将 SkillNav 定位为中文 AI 工具生态的资讯 + 导航站（Skills / MCP / Agent 工具），核心模式：日常学习/试用的副产品系统化沉淀和发布，边际成本≈0。

## Current State

### Completed (prior sessions)
- Content governance system shipped: quality_tier, is_hidden, 10 categories
- 6,447 skills ingested from ClawHub, 98.9% content backfilled
- Article pipeline live (29 articles synced via LLM translation)
- Skill detail page with two-column layout
- All commits pushed to remote (clean state)

### Completed (this session)
- **Strategic direction finalized**: content-first + quick-launch capability
  - MCP directory pivot **cancelled** (red ocean: mcp.so 15K+, Glama 9K+, 阿里云百炼 etc.)
  - Original instinct "MCP导航已是红海，不碰" validated by market research
  - Positioning: NOT a media company, but "making daily learning visible" with Claude as co-pilot
  - Flywheel: daily learning/trial → content → traffic → data accumulation → better tool discovery
- **RSS sources expanded from 4 to 9** (`scripts/sync-articles.mjs`):
  - Existing: Anthropic, OpenAI, LangChain, Simon Willison
  - Added: Google AI, GitHub, Hugging Face, CrewAI, TechCrunch AI
  - Cursor & Vercel feeds unavailable (no valid RSS), noted in code comments
- **Relevance keywords expanded** from 14 to 27 (added cursor, copilot, codex, gemini, a2a, crewai, etc.)
- **Feed parsing hardened**: switched from `parseURL` to `fetch+parseString` with XML sanitization (fixes unescaped `&`)
- **GitHub Actions workflow updated**: source filter description expanded
- **11 prior commits pushed** to remote (content governance + strategic planning work)
- **Memory updated**: strategic direction, market context, deferred arsenal items

### Key Strategic Context
- **mcp.so case study**: built by idoubi in 2h from gpts.works template, now 1M+ monthly visits. Success = timing + reuse + distribution, not tech. Code open-source. ShipAny ($199-299) is his template SaaS.
- **Market data**: MCP is industry standard (AAIF/Linux Foundation), 10K+ public servers, 97M+ SDK downloads/month. Claude Code = 4% of GitHub commits → 20%+ projected.
- **Core insight**: SkillNav already has quick-launch capability comparable to ShipAny. Keep ready to seize next "MCP moment" while building content on skillnav.dev.

## Next Actions

### 1. Content pipeline quality upgrade
- Optimize translation prompts in `scripts/lib/llm.mjs` — add editorial perspective, not just translation
- Add "editor comment" field to articles schema — 2-3 sentence take per article
- Consider adding more RSS sources as they become available (Cursor, Vercel)

### 2. Content validation (before investing more dev time)
- Manually publish 5 articles to 知乎/掘金, measure: views, engagement, referral to skillnav.dev
- Determine which content type performs best (news vs tutorial vs review)
- Set sustainable publishing cadence based on results

### 3. Distribution channels setup
- 知乎 account + column for AI tools content
- 掘金/CSDN for technical tutorials
- 公众号 for weekly digest
- 即刻/Twitter for quick news

### 4. Quick-launch arsenal (deferred — do when opportunity arises)
- Abstract skillnav.dev architecture into reusable site template
- Template-ize sync scripts (API → translate → upsert pattern)
- Domain name reservation for future verticals
- Watch signals: A2A protocol, AAIF new standards, new agent platforms, Claude Code Skills marketplace

## Risks & Decisions

- **Content quality vs speed**: LLM translation + fast publishing can become low-quality scraping site. Editorial judgment is the real product
- **Solo developer sustainability**: start weekly cadence, not daily. Burning out is worse than being slow
- **Platform dependency**: if Anthropic/OpenClaw launch official Chinese Skills docs, translation content value drops. Original reviews/tutorials are irreplaceable
- **ClawHub data**: 6,447 skills with 99.95% zero engagement — keep for SEO long tail, don't invest further

## Verification

- `npm run build` — should pass
- `node scripts/sync-articles.mjs --dry-run --limit 3` — verify all 9 RSS sources fetch successfully (expect ~21 articles, 0 failures)
- `git status` — clean working tree, up to date with origin

## Modified Files (this session)

- `scripts/sync-articles.mjs` — RSS sources 4→9, keywords 14→27, feed parsing hardened
- `.github/workflows/sync-articles.yml` — source filter description updated
