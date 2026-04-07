# HANDOFF
<!-- /checkpoint at 2026-04-07 -->

## Active Plan
感知层 + 热度看板 — `docs/plans/perception-trending.md`（0/3 phases, approved v3.1）

## Session Tasks
- [x] 信息源覆盖面分析（16 RSS + 5 Newsletter + 3 论文 + 工具生态 → 缺 X/HN/Reddit）
- [x] 竞品调研（follow-builders、阮一峰周刊、GitHub Trending、HF Papers、Toolify、TwitterAPI.io）
- [x] 方案 v1 → v2（4-agent 评审）→ v3（Codex 11 findings）→ v3.1（产品走查 3 修复）
- [ ] 申请 S2 API Key → `.env.local` 加 `S2_API_KEY`
- [ ] 验证 ISR R2 缓存 → `npx wrangler r2 object list skillnav-cache`

## Key Files
- `docs/plans/perception-trending.md` — 感知层+热度看板方案 v3.1（approved）
- `docs/adr/005-llm-first-editorial-funnel.md` — 方案必须对齐的架构决策
- `src/lib/get-trending-tools.ts` — 工具赛道直接复用此函数（需加 monorepo 去重）
- `scripts/generate-daily.mjs` — X/HN/Reddit 信号扩展 LLM prompt 上下文

## Next Actions
- [ ] Phase 0: 建 `community_signals` 表 → `supabase/migrations/` 新建 SQL
- [ ] Phase 0: 注册 TwitterAPI.io 拿 API Key → `.env.local` 加 `X_API_KEY`
- [ ] Phase 0: 注册 Reddit OAuth 应用 → `.env.local` 加 `REDDIT_CLIENT_ID` + `REDDIT_SECRET`
- [ ] Phase 0: 定义 KOL 列表 40 人 → `config/x-kol-list.json`
- [ ] Phase 1: `scripts/scrape-x-signals.mjs` 采集脚本
