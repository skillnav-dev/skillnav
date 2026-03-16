# HANDOFF
<!-- /checkpoint at 2026-03-16 -->

## Active Plan
Guides (专栏) — `docs/plans/guides-series.md` (7/8, 87%)

## Session Tasks
- [x] 扩展 series.ts：chapters + description + isGuide + getGuideSeries()
- [x] 新增 getAllSeriesArticles() 数据查询函数
- [x] 专栏列表页 `/guides`（系列大卡片）
- [x] 系列落地页 `/guides/[slug]`（按章节分组目录）
- [x] 导航栏 + Footer 加"专栏"入口
- [x] 修复系列文章翻译丢失 code block 问题（4 篇：prompts-i-use / linear-walkthroughs / red-green-tdd / first-run-the-tests）
- [x] 优化 compile prompt 强化代码块保留规则
- [ ] 首页编辑精选区加专栏卡片（P1）

## Key Files
- `docs/plans/guides-series.md` — 专栏方案（approved, 7/8）
- `src/data/series.ts` — 系列元数据（含 chapters/description）
- `src/app/guides/page.tsx` — 专栏列表页
- `src/app/guides/[slug]/page.tsx` — 系列落地页
- `scripts/lib/llm.mjs` — compile prompt（已强化 code block 保留）

## Next
1. 首页编辑精选区加专栏卡片（guides-series.md 最后一个 task）
2. 观察 CI sync-articles cron 稳定性（120min timeout）
