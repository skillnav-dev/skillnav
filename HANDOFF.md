# HANDOFF
<!-- /checkpoint at 2026-03-17 -->

## Active Plan
学习中心 — `docs/plans/glossary-learning-center.md`（5/5, P1 done, P2 pending）

## Session Tasks
- [x] 删除 RAG 单独指南 + 提升 AI 指南入口到 /guides 页面
- [x] 内容战略复审（内部审计 + 竞品分析 + 市场趋势）→ `docs/research/2026-03-17-content-strategy-review.md`
- [x] Draft 批量审核：13 篇发布 + 34 篇隐藏（63→16 draft）
- [ ] 周刊前端数据层：`/weekly` 列表页 + `/weekly/[slug]` 详情页接入 DB
- [ ] 首期周刊：运行 `generate-weekly.mjs` → 审核 → 发布
- [ ] 翻译 prompt 加编者按：`scripts/lib/llm.mjs` JSON 输出新增 `editorNoteZh`
- [ ] 社交分发启动：X @skillnav_dev 发首条推文
- [ ] 学习中心 P2 选题确认（从 glossary.json 选 9-12 个概念）

## Key Files
- `src/app/weekly/page.tsx` — 列表页骨架，需接入 `getWeeklyIssues()` DB 查询
- `src/app/weekly/[slug]/page.tsx` — 详情页 TODO，需实现完整渲染
- `src/lib/data/articles.ts` — 数据层，需新增 weekly 查询函数
- `scripts/lib/llm.mjs` — 翻译 prompt，需加 editorNoteZh 字段
- `scripts/generate-weekly.mjs` — 周刊生成脚本（已就绪）

## Decisions Needed
- 编者按策略：LLM 自动生成 vs 主编手写 vs 混合（LLM 草稿 + 主编润色）
