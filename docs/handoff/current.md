# Handoff — Content Governance Implementation

## Objective

Build a unified content governance system for SkillNav: DB schema extensions, category taxonomy rebuild (16→10), quality tiers, spam detection, and article relevance filtering.

## Current State

### Completed
- DB migration applied to prod: `quality_tier`, `is_hidden` on skills; `analysis` added to articles `article_type`
- Category taxonomy rebuilt: 16→10 scenario-based categories (编码开发, AI 智能体, 数据处理, 搜索研究, 运维部署, 内容创作, 效率工具, 安全监控, 平台集成, 其他)
- Quality tier assessment: content-length thresholds (A: content>2000+desc>50, B: content>200+desc>20, C: rest)
- Governance script created and **executed on all 6,447 skills** (0 errors)
- DAL `excludeHidden()` applied to 6 listing functions; featured skills restricted to A/B tier
- Article sync: relevance keyword filter for non-Anthropic sources; `analysis` type supported
- `release` removed from `ArticleType` (never in DB)
- Build passes (1037 pages generated)

### Governance Results
- A tier: 4,152 (64.4%) — comprehensive content
- B tier: 1,494 (23.2%) — adequate content
- C tier: 799 (12.4%) — stubs
- Hidden: 2 (0.03%) — spam detected
- "其他" category: 1,924 (29.8%) — mostly pre-existing, +181 from removed categories

### In Progress
- None — implementation complete

## Next Actions

1. **Push to remote** and verify CI/CD deploys successfully to Cloudflare Workers
2. **Manual QA** on `skillnav.dev`:
   - `/skills` — verify new category names display in toolbar dropdown
   - `/` homepage — verify featured skills section shows A/B-tier only (check count >= 6)
   - `/skills/[slug]` — verify hidden skills (2) are still accessible via direct URL
3. **Run article sync** `npm run sync:articles -- --dry-run` to verify relevance filter in practice
4. **Optional tuning**: If A-tier at 64% is too high, raise content threshold from 2000→4000 in `scripts/govern-skills.mjs:assessQuality()`
5. **Optional tuning**: If "其他" at 30% needs reducing, add domain-specific keywords to `scripts/lib/categorize.mjs` (top candidates: crypto/trading/finance terms)

## Risks & Decisions

- **Featured section could be empty**: If `is_featured=true AND quality_tier IN ('A','B')` returns < 6, fallback needed. Currently using `IN ('A','B')` as safety net.
- **"其他" at 30%**: Acceptable — 82.8% were already "其他" before migration. Most have no tags and generic names.
- **A-tier at 64%**: Higher than original target (30-40%) because content backfill gave 98.9% of skills substantial content. Still differentiates from C-tier stubs.
- **Spam patterns conservative**: Only 2 detected. Can expand patterns in future iterations.

## Verification

- `node scripts/govern-skills.mjs --audit` — verify quality distribution
- `npm run build` — full build passes (confirmed)
- `npm run dev` — manual check /skills with new categories
- `npm run sync:articles -- --dry-run` — verify relevance filter

## Commits (this session)

```
286ec12 scripts(govern): use content-length thresholds for quality tiers
04cba1d scripts(articles): add relevance filter and analysis article type
d3fb0e2 data(skills): filter hidden skills and restrict featured to A/B-tier
204cd8e scripts(govern): add content governance script with quality assessment
1b9815e data(categorize): rewrite 16 categories to 10 scenario-based categories
9201df0 data(migration): add quality_tier, is_hidden and expand article_type
```

## Modified Files

- `supabase/migrations/20260305_content_governance.sql` (new — applied to prod)
- `scripts/lib/categorize.mjs` (rewrite — 16→10 categories)
- `scripts/govern-skills.mjs` (new — audit/dry-run/apply governance)
- `src/lib/supabase/types.ts` (add quality_tier, is_hidden, analysis)
- `src/lib/supabase/mappers.ts` (add qualityTier, isHidden mapping)
- `src/data/types.ts` (add qualityTier, isHidden; remove release)
- `src/lib/data/skills.ts` (add excludeHidden to 6 functions; featured A/B filter)
- `scripts/sync-articles.mjs` (add relevanceFilter, isRelevant, analysis type)
- `src/components/articles/article-card.tsx` (remove release)
- `src/components/articles/article-meta.tsx` (remove release)
- `src/components/articles/articles-toolbar.tsx` (remove release)

## Reference Documents

- Governance plan: `docs/plans/content-governance.md`
- Product plan: `/Users/apple/WeChatProjects/tishici/docs/playbook/skillnav-product-plan.md`
