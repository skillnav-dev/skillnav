# Handoff — Content Governance Implementation

## Objective

Build a unified content governance system for SkillNav: define content boundaries, rebuild the 16→10 category taxonomy, implement quality tiers for skills, and add relevance filtering for article sources.

## Current State

### Completed
- Content governance plan finalized (`docs/plans/content-governance.md`)
- Competitive research on classification systems (Smithery 11, Skill4Agent 7, Glama 66, PulseMCP 48, awesome-mcp-servers 42)
- 10 new scenario-based categories designed with "help me do X" validation
- Quality tier decision tree designed (A/B/C + hidden)
- Article relevance filter designed (per-source keyword matching)
- Existing `audit-content.mjs` committed (content format checks)
- Existing `20260304120000_skill_content.sql` migration committed (content fields migration)

### In Progress
- None — plan phase complete, implementation not started

## Next Actions

1. **Create DB migration** `supabase/migrations/20260305_content_governance.sql`: Add `quality_tier TEXT CHECK(IN 'A','B','C')`, `is_hidden BOOLEAN DEFAULT FALSE` to skills table; expand articles `article_type` constraint to include `analysis`

2. **Rewrite categorizer** `scripts/lib/categorize.mjs`: Replace `CATEGORY_KEYWORDS` with 10 new categories (编码开发, AI智能体, 数据处理, 搜索研究, 运维部署, 内容创作, 效率工具, 安全监控, 平台集成, 其他). Redistribute ~400 keywords. Keep scoring algorithm unchanged.

3. **Create govern script** `scripts/govern-skills.mjs`: Unified script with `assessQuality(skill)` (decision tree) + `categorize()` (from categorize.mjs). Modes: `--audit` (report only), `--dry-run` (preview changes), `--apply` (execute). Batch update `category`, `quality_tier`, `is_hidden`.

4. **Update DAL** `src/lib/data/skills.ts`: Add `.or('is_hidden.is.null,is_hidden.eq.false')` to all public queries. Add `.eq('quality_tier', 'A')` to `getFeaturedSkills`.

5. **Update article sync** `scripts/sync-articles.mjs`: Add `relevanceFilter` field to SOURCES config. Add `isRelevant(item, source)` filter function between dedup and translation steps. Add `'analysis'` to `validDbTypes`.

6. **Update types** `src/data/types.ts`: Add `'analysis'` to `ArticleType` union.

## Risks & Decisions

- Category migration touches all 6,447 skills — **must run --dry-run first** and verify distribution is reasonable
- The keyword-based categorizer may not perfectly handle edge cases — accept ~8% "其他" fallback rate
- Article type constraint change: must DROP old constraint before adding new one (Supabase doesn't support ALTER CHECK)
- Spam pattern list may need iteration after first audit run
- DAL filter change affects all skill listing/detail pages — full build verification required

## Key Design Decisions Made

1. **10 categories** (not 8, not 15): Balances Smithery's simplicity (11) with adequate coverage
2. **Decision tree** over weighted scoring: 4 steps, transparent logic, no magic numbers
3. **Single migration**: All schema changes in one file, not 3 separate migrations
4. **Single govern script**: Replaces need for separate audit + apply-scores + cleanup scripts
5. **Relevance filter on source config**: Not LLM-based — simple keyword matching in title/snippet, zero extra API cost

## Verification

- `node scripts/govern-skills.mjs --audit` — check quality tier distribution
- `node scripts/recategorize-skills.mjs --dry-run --sample 30` — preview category changes
- `npm run build` — full build passes
- `npm run dev` — manual check /skills page with new categories
- `npm run sync:articles -- --dry-run` — verify relevance filter works

## Modified Files

Committed this session:
- `docs/plans/content-governance.md` (new — governance plan)
- `scripts/audit-content.mjs` (new — content format audit)
- `supabase/migrations/20260304120000_skill_content.sql` (new — content fields migration)

To be created/modified next session:
- `supabase/migrations/20260305_content_governance.sql` (new)
- `scripts/govern-skills.mjs` (new)
- `scripts/lib/categorize.mjs` (rewrite)
- `scripts/sync-articles.mjs` (modify)
- `src/lib/data/skills.ts` (modify)
- `src/data/types.ts` (modify)
- `src/components/skills/skill-card.tsx` (modify if needed)

## Reference Documents

- Governance plan: `docs/plans/content-governance.md`
- Product plan: `/Users/apple/WeChatProjects/tishici/docs/playbook/skillnav-product-plan.md`
- Competitive research: `/Users/apple/WeChatProjects/tishici/docs/playbook/openclaw-skills-research.md`
