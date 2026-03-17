# HANDOFF
<!-- /checkpoint at 2026-03-17 -->

## Active Plan
学习中心 — `docs/plans/glossary-learning-center.md`（5/5, P1 done, P2 pending）

## Session Tasks
- [x] P1-3: 实现图解组件（CompareChart, FlowDiagram, ArchitectureDiagram, Callout）
- [x] P1-4/5: 嵌入 3 个概念页 + 部署验证
- [x] 修复 sync-articles CI 失败（llm.mjs 反引号转义，已在之前 commit 修复，本次推送生效）
- [x] 手动触发文章采集（CI run 23179616401 运行中）
- [x] 上线 AI 架构交互式深度指南 → `public/guides/ai-guide.html`
- [x] 上线 RAG 交互式深度指南 → `public/guides/rag-deep-guide.html`
- [ ] 删除 RAG 单独指南（与 AI 指南内容重复）
- [ ] 提升指南入口（当前藏在 /learn 底部，需移到主导航或首页）
- [ ] B-tier MCP description_zh 回填（~250/3521）
- [ ] P2: 补齐剩余 9-12 个概念页

## Key Files
- `src/components/learn/compare-chart.tsx` — 对比图组件
- `src/components/learn/flow-diagram.tsx` — 流程箭头图组件
- `src/components/learn/architecture-diagram.tsx` — 时间轴/架构图组件
- `src/app/learn/[slug]/page.tsx` — 图解插入逻辑（visualInserts config）
- `public/guides/ai-guide.html` — 10 章交互式 AI 指南

## Decisions Needed
- 指南入口放哪？主导航加"指南" vs 首页加板块
