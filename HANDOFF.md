# Handoff — SkillNav
<!-- Updated at 2026-03-12 session 36 -->

## Completed

### 第 1-34 轮摘要（session 1-35, Day 1-11）
- 站点上线 skillnav.dev + 168 精选 Skills + 99 篇文章 + 18 MCP servers
- UI/UX 重构 + Admin 后台 + 周刊工具链 + SEO 优化
- 工具情报管线 M1-M4：MCP 入库 + Skills 同步 + 保鲜层 + 周刊三支柱
- CI 编排：周一 01→02→03→04 UTC + 每日保鲜 + MCP 详情页丰富
- DB: 309 skills (168 curated pub + 17 anthropic pub + 124 awesome-list draft) + 99 articles

### 第 35 轮：MCP 扩展 + 清理 + 发现源接入（session 36, Day 12）
- **#3 Linear 排查**: `linear/linear-mcp-server` 已 404，更新为 `jerhadf/linear-mcp-server` (344★)
- **#4 清理**: 删除废弃 `skill-comments.tsx`（已被 `giscus-comments.tsx` 替代）
- **#5 MCP tools JSONB**: DB 新增 `tools` 列 + 类型/映射 + 中英详情页工具列表 UI
- **#6 MCP 发现源**: Official MCP Registry (3,528) + Smithery (1,631) 适配器 + 编排脚本 + CI
- **已部署**: 7 commits pushed，CI/CD 触发

## Next

1. **Admin 审核**: 124 个 draft Skills + 36 篇 draft 文章待审核
2. **首跑 MCP 同步**: `node scripts/sync-mcp-servers.mjs --incremental --dry-run` 验证后全量执行
3. **MCP tools 回填**: 编写脚本从 GitHub README 或 MCP Registry 提取每个 server 的工具列表填入 tools 字段
4. **OpenClaw 精选**: 50-100 个精选 Skills，带编辑点评，source='openclaw'

## Key Files
- `scripts/lib/sources/mcp-registry.mjs` — Official MCP Registry 适配器
- `scripts/lib/sources/smithery.mjs` — Smithery 适配器
- `scripts/sync-mcp-servers.mjs` — MCP 同步编排脚本
- `.github/workflows/sync-mcp-servers.yml` — 周一 UTC 05:00 自动同步
- `sql/add-mcp-tools-column.sql` — tools JSONB 列迁移

## Verify

- `test -f scripts/sync-mcp-servers.mjs && echo OK` — MCP 同步脚本存在
- `test -f scripts/lib/sources/mcp-registry.mjs && echo OK` — Registry 适配器存在
- `test -f scripts/lib/sources/smithery.mjs && echo OK` — Smithery 适配器存在
- `grep "0 5 \* \* 1" .github/workflows/sync-mcp-servers.yml | head -1` — 周一 MCP 同步 cron
- `grep "tools" src/lib/supabase/types.ts | head -1` — tools 字段类型定义
- `npm run build` — 构建通过
