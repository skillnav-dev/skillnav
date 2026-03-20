# HANDOFF
<!-- /checkpoint at 2026-03-20 -->

## Active Plan
30-Day Growth Sprint — Week 1（APPROVED）

## Session Tasks
- [x] CI 修复：sync-clawhub 假阳性、github rate limit 死等、weekly cron 时间
- [x] CI 新增：generate-daily.yml（UTC 22:30 自动生成 Daily Brief）
- [x] SOP 时间线优化：双窗口→单窗口 07:30-09:00，按平台高峰排发布
- [x] 信号层实现：scrape-signals.mjs（5 源抓取 + URL 归一化 + heat 聚合）
- [x] 信号层集成：generate-daily 自动读取信号 JSON 注入 LLM prompt
- [x] CI：scrape-signals.yml + generate-daily 先抓信号再生成
- [ ] 重翻译 239 篇存量文章（DeepSeek，后台跑中）
- [ ] X 首发帖 — 格式和配图都已准备好，复制发到 @skillnav_dev
- [ ] 掘金介绍帖 — Sprint 计划 Week 1 关键任务
- [ ] V2EX 介绍帖
- [ ] 每天发 Daily Brief 到各平台（形成节奏）

## Key Files
- `scripts/scrape-signals.mjs` — 信号层抓取脚本（5 源并行 + heat 聚合）
- `scripts/generate-daily.mjs` — Daily Brief 生成（已集成信号层）
- `docs/specs/content-operations-spec.md` — SOP 时间线（已更新）
- `docs/specs/content-signals-spec.md` — 信号层规范（Status: active）
- `.github/workflows/generate-daily.yml` — 每天 CST 06:30 自动跑
