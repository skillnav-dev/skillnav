# Handoff — SkillNav
<!-- Updated at 2026-03-12 session 37 -->

## Completed

### 第 1-35 轮摘要（session 1-36, Day 1-12）
- 站点上线 skillnav.dev + 168 精选 Skills + 99 篇文章 + 18 MCP servers
- UI/UX 重构 + Admin 后台 + 周刊工具链 + SEO + MCP tools JSONB + 发现源接入
- 工具情报管线 M1-M4 + CI 编排 + MCP Registry/Smithery 适配器

### 第 36 轮：MCP 全量同步 + Tools 回填 + 目录策略决策（session 37, Day 12）
- **MCP 首跑同步**: 5,145 新 servers 入库 (3,523 Registry + 1,625 Smithery), 0 errors
- **Tools 回填**: `backfill-mcp-tools.mjs` 从 Smithery 详情 API 回填 1,373 servers, 0 errors
- **目录策略决策**: 三层模型 (S 编辑精选 / A 优质自动 / B 长尾索引), 详见 `docs/decisions/mcp-directory-strategy.md`
- DB: 5,172 MCP servers (18 pub + 5,154 draft) + 309 skills + 99 articles

## Next

1. **P0 元数据刷新**: `node scripts/refresh-tool-metadata.mjs` 刷新 4,490 个 server 的真实星标
2. **P1 自动分层**: 写 `scripts/govern-mcp-servers.mjs` 按 stars/tools/description 自动分 A/B/hidden
3. **P2 技术适配**: 英文 MCP 列表 limit:100 改分页 + generateStaticParams 改 ISR
4. **Admin 审核**: 124 个 draft Skills + 36 篇 draft 文章待审核

## Key Files
- `scripts/backfill-mcp-tools.mjs` — Smithery API tools 回填脚本
- `scripts/sync-mcp-servers.mjs` — MCP 同步编排 (Registry + Smithery)
- `docs/decisions/mcp-directory-strategy.md` — 三层目录策略决策文档
