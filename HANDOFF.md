# HANDOFF
<!-- /checkpoint at 2026-03-24 -->

## Active Plan

`docs/plans/pipeline-dashboard.md` — Status: active, Progress: 9/9 (code done)

## Session Tasks
- [x] 调查 sync-articles 0 插入原因（19 篇被相关性过滤但未计数）
- [x] 调查 Cloudflare/a16z RSS fetch 失败（GitHub Actions IP 被封）
- [x] 设计 Admin Pipeline Dashboard（多 agent 调研 + 设计 + Codex 审阅）
- [x] Pipeline Dashboard 实施（M1-M9 全部完成）
- [x] /review 通过（1 critical auto-fixed: timer 泄漏）
- [ ] 在 Supabase Dashboard 执行迁移 SQL `supabase/migrations/20260325_pipeline_runs.sql`
- [ ] 手动跑 `node scripts/scrape-signals.mjs` 验证上报到 pipeline_runs
- [ ] 部署后检查 `/admin` 页面 PipelineStatusBar + TodoList
- [ ] Skill MVP M2：GitHub repo 发布 + 限流 + Brief CTA
- [ ] 社交媒体首发（X @skillnav_dev、掘金、V2EX）
- [ ] 感知源扩展：TwitterAPI.io + YouTube transcript

## Key Files
- `scripts/lib/run-pipeline.mjs` — 通用 wrapper（main→return→reportRun→exit）
- `scripts/lib/report-run.mjs` — 上报函数（markStart + 5s 超时）
- `supabase/migrations/20260325_pipeline_runs.sql` — 待执行的 DB 迁移
- `src/components/admin/pipeline-status-bar.tsx` — 管线状态条组件
- `src/components/admin/todo-list.tsx` — 今日待办组件
- `src/lib/data/admin.ts` — 新增 getPipelineStatus + getTodayTodos

## Decisions Needed
- Skill MVP M2 何时启动
- 社交媒体人格定位
