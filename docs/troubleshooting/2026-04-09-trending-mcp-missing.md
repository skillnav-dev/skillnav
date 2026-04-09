# Trending 工具赛道 MCP 条目消失

Date: 2026-04-09

## 症状

`/trending` 页面和 `/api/skill/query?type=trending` API 返回 0 条 MCP 条目，工具赛道全是 Skills。

## 误判

最初以为 MCP 查询在 CF Worker edge runtime 上静默失败（`from("mcp_servers")` + `as any` 类型 hack）。尝试了多种绕过方案（REST API fallback、untyped client）均未解决。

## 根因

MCP 查询实际正常工作（logs: `mcps=15, mcpError=false`）。真正原因是 **monorepo Skills 占满了所有排名位**：

1. `openai/codex`（30+ tools，delta=5033）、`alirezarezvani/claude-skills`（29 tools，delta=1649）、`openclaw/skills`（906 tools，delta=239）等 monorepo 的所有工具共享同一 repo 的 stars
2. DB 层排除列表只过滤了 `anthropics/skills`，遗漏了其他 monorepo
3. `dedupeMonorepo()` 只在 page 路径（`trending-data.ts`）生效，API 路径（`get-trending-tools.ts`）完全没有去重
4. 纯全局 top N 排序无法保证 MCP 有代表

## 修复

1. **per-repo-key 去重**（替代手动 blocklist）— normalize `github_url` 去掉 `/tree/...`，每个 repo 只保留 delta 最高的 1 个代表
2. **混合组合** — `ceil(N/2) skills + ceil(N/2) MCPs`，保证两种类型都有代表
3. **逻辑下沉** — 去重移入 `getTrendingTools()`，API 和 page 共享
4. 删除 `trending-data.ts` 中冗余的 `dedupeMonorepo()`

验证：Codex 独立审查确认分析正确。线上部署后 API 返回 Skills 3 + MCPs 5。

## 预防

- 新 monorepo 无需手动维护 blocklist，per-repo 去重自动处理
- 混合组合保证即使某类型 delta 远低于另一类型，仍有展示位
