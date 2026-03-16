# HANDOFF
<!-- /checkpoint at 2026-03-16 -->

## Active Plan
Guides (专栏) — `docs/plans/guides-series.md` (3/8, 37%)

## Session Tasks
- [x] 确认 CI sync-articles 全量同步结果（旧 commit 45min 超时，新 120min 已生效）
- [x] 发现 Agentic Engineering Patterns 系列（Simon Willison, 12 篇结构化指南）
- [x] 设计系列支持方案（series 标签 + SeriesNav 组件 + backfill 脚本）
- [x] 实现 Phase 1-3：backfill 全部 13 篇 + 打标 + 前端系列导航 + 部署
- [x] 简化新入库文章 slug（去掉 -agentic-engineering-patterns 后缀）
- [x] 设计专栏（Guides）一级内容产品方案（已批准）
- [ ] 扩展 series.ts：chapters + description
- [ ] 专栏列表页 `/guides` + 系列落地页 `/guides/[slug]`
- [ ] 导航栏 + Footer 加"专栏"入口

## Key Files
- `docs/plans/guides-series.md` — 专栏方案（approved, 3/8）
- `src/data/series.ts` — 系列元数据配置
- `src/components/articles/series-nav.tsx` — 系列导航组件
- `scripts/backfill-series.mjs` — 系列内容回填脚本

## Next
1. 执行 guides-series.md 剩余 5 个任务（落地页 + 入口）
2. 观察 CI sync-articles cron 稳定性（120min timeout）
