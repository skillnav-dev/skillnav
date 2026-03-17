# HANDOFF
<!-- /checkpoint at 2026-03-17 -->

## Active Plan
学习中心 — `docs/plans/glossary-learning-center.md`（5/5, P1 done, P2 pending）

## Session Tasks
- [x] 周刊前端数据层：`/weekly` 列表页 + `/weekly/[slug]` 详情页接入 DB
- [x] generate-weekly.mjs 数据质量修复（排除 curated/manual source + A-tier 过滤 stale/archived）
- [x] MCP description_zh fallback 泄漏修复（5 条清理）
- [x] 删除旧 weekly-1 + 重新生成首期周刊 → published
- [ ] 翻译 prompt 加编者按：`scripts/lib/llm.mjs` JSON 输出新增 `editorNoteZh`
- [ ] 社交分发启动：X @skillnav_dev 发首条推文
- [ ] 学习中心 P2 选题确认（从 glossary.json 选 9-12 个概念）

## Key Files
- `src/app/weekly/page.tsx` — 列表页，接入 `getWeeklyArticles()`
- `src/app/weekly/[slug]/page.tsx` — 详情页，Markdown + prev/next 导航
- `src/lib/data/articles.ts` — 新增 `getAllWeeklySlugs()` + `getSitemapWeeklies()`
- `scripts/generate-weekly.mjs` — 三处数据质量过滤修复
- `scripts/lib/llm.mjs` — 待加 `editorNoteZh` 字段

## Decisions Needed
- 编者按策略：LLM 自动生成 vs 主编手写 vs 混合（LLM 草稿 + 主编润色）
