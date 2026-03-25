# HANDOFF
<!-- /checkpoint at 2026-03-26 -->

## Active Plan
Paper Channel v2 — `docs/plans/paper-channel-proposal-v2.md`（Phase 1 已上线，4 周观察期）

## Session Tasks
- [x] Paper Channel Phase 1 实施：HF API + LLM 选稿 + markdown 渲染 + parse-brief 解析
- [x] Umami 点击追踪：`/go/paper/[id]` 302 重定向 + server-side tracking
- [x] Push to remote（`49885e7` + `540ae5d`）

## Key Files
- `scripts/generate-daily.mjs` — 新增 fetchHFDailyPapers + 论文 prompt + tracked URL
- `src/lib/parse-brief.ts` — 新增 BriefPaper + parsePaperSection
- `src/app/go/paper/[id]/route.ts` — 论文点击追踪重定向路由
- `docs/plans/paper-channel-proposal-v2.md` — 方案书（已拍板）

## What's Next
- 4 周观察期（~2026-04-23）：每天审日报论文板块，记 corrections.jsonl
- 观察期结束后：Umami `/go/paper/` 数据 → Go/Hold/Kill 决策
- Skill MVP M2 何时启动
- 社交媒体人格定位
