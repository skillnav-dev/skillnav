# HANDOFF
<!-- /checkpoint at 2026-04-08 -->

## Active Plan
感知层 + 热度看板 — `docs/plans/perception-trending.md`（2/3 phases, Phase 0-2 done）

## Session Tasks
- [x] X 采集恢复：dotenv + x-client 响应解析修复 → 108 条入库
- [x] HN 采集恢复：dotenv 修复 → 30 条入库
- [x] Reddit 采集新建：`scripts/scrape-reddit-signals.mjs` → 30 条入库
- [x] 全线切 DeepSeek：`.env.local` + 6 个 CI workflow
- [x] Trending 页面走查：论文链接 404、中文标签、monorepo dedup、社区均衡
- [ ] Trending 工具赛道 MCP 查询 CF Worker 失败 → `src/lib/get-trending-tools.ts`

## Key Files
- `scripts/scrape-reddit-signals.mjs` — 新建的 Reddit 采集脚本
- `scripts/lib/x-client.mjs` — TwitterAPI.io 响应解析修复
- `src/lib/get-trending-tools.ts` — 工具查询 + monorepo 排除（MCP 待修）
- `src/lib/trending-data.ts` — 论文中文标题 + Reddit health bar
- `src/components/trending/track-components.tsx` — UI 中文化 + 排版修复

## Next Actions
- [ ] 调查 MCP 查询在 CF Worker 失败的根因 → 在 `get-trending-tools.ts` 加 error logging 后部署观察
- [ ] OpenAI 订阅恢复后改回 `LLM_PROVIDER=gpt`（`.env.local` + 6 个 CI workflow）
- [ ] Phase 3 回测评估：积累 1-2 周三源社区数据后评估

## Decisions Needed
- MCP 查询修复策略：加 DB types 定义 vs 独立 Supabase client vs REST API fallback
