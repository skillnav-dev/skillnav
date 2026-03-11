# Handoff — SkillNav
<!-- Updated at 2026-03-11 session 32 -->

## Completed

### 第 1-29 轮摘要（session 1-30, Day 1-11）
- 站点上线 skillnav.dev + 168 精选 Skills + 99 篇文章（13 RSS 源自动管线）
- 编译模式（LLM prompt 从翻译→编译）+ 全量回炉 48 篇 + 数据清洗
- UI/UX 重构 Phase 0-5 + 设计规范 v1 + 移动端修复
- Admin 后台 + MCP 18 个精选 + GitHub 50 个项目 + 周刊工具链
- 内容战略 2.0 + 运营规范 + 分发规范 + 竞情分析（腾讯 SkillHub）
- SEO: sitemap 精简 950→224, llms.txt, 英文路由, GEO 优化
- ClawHub 7,159 条全量删除，DB 精简至 185 skills + 99 articles

### 第 30 轮：工具情报管线方案设计（session 31, Day 11）
- **四路并行调研**: Skills 发现源 + MCP 发现源 + 竞品展示分析 + 保鲜机制技术方案
- **腾讯 SkillHub 补充调研**: ClawHub CDN 镜像，无 API，无编辑深度，低威胁
- **方案 v2 产出**: `docs/plans/tool-intelligence-pipeline.md`（含全部调研结论）
- **关键决策**: OpenClaw 精选应做（50-100 个带编辑点评）；MCP 必须入库；编辑点评是最大差异化武器
- **发现源选型**: Skills P0=awesome-agent-skills+skills.sh / MCP P0=Official Registry+Smithery

### 第 31 轮：M1 MCP 入库 — 代码层完成（session 32, Day 11）
- **方案补充**: `tool-intelligence-pipeline.md` 新增 `install_count`(Skills) + `version`(MCP) 字段
- **类型基础层**: `McpServer` 接口 + `McpServerRow` DB 类型 + `mapMcpServerRow` mapper + `McpSource/McpStatus/FreshnessLevel` 类型
- **DAL 完整实现**: `src/lib/data/mcp.ts`（8 个函数：getMcpServers/WithCount/BySlug/Featured/Count/Categories/AllSlugs/Sitemap）
- **前端 SSR 改造**: MCP 页面从静态硬编码 → Supabase DAL + nuqs URL params + Suspense streaming
- **新增组件**: `mcp-toolbar.tsx`（搜索+分类+排序）、`mcp-grid-skeleton.tsx`（加载骨架屏）
- **英文页同步**: `/en/mcp` 也改为 DAL 查询
- **DB 脚本**: `sql/create-mcp-servers.sql`（建表+索引+RLS）+ `scripts/migrate-mcp-to-db.mjs`（18条迁移）
- **审查修复**: RLS 安全漏洞（移除 USING(true) 全权限策略）、补全 `author` 字段全链路、移除冗余索引
- **构建验证**: `npm run build` 通过，`/mcp` 和 `/en/mcp` 从 Static → Dynamic

## In Progress

**M1 待执行 DB 操作**（代码已就绪，等待用户在 Supabase 执行）：
1. 在 Supabase SQL Editor 执行 `sql/create-mcp-servers.sql`
2. 运行 `node scripts/migrate-mcp-to-db.mjs --dry-run` 预览
3. 运行 `node scripts/migrate-mcp-to-db.mjs` 正式迁移
4. 验证 `/mcp` 页面数据从 DB 正常加载

## Next

1. **完成 M1 DB 操作** — 建表 + 迁移 18 条 + 验证页面
2. **M2: Skills 管线** — Skills 表补列 + 接入 awesome-agent-skills + skills.sh + OpenClaw 精选
3. **M3: 保鲜层** — `refresh-tool-metadata.mjs` + GraphQL 批量 + freshness 角标
4. **M4: 周刊枢纽** — 升级 `generate-weekly.mjs` 整合三支柱
5. **审核 36 篇 draft** — Admin 后台 publish/hide
6. **MCP 详情页** — `/mcp/[slug]` 页面（当前只有列表无详情）

## Verify
- `test -f sql/create-mcp-servers.sql && echo OK` — 建表 SQL 存在
- `test -f scripts/migrate-mcp-to-db.mjs && echo OK` — 迁移脚本存在
- `test -f src/lib/data/mcp.ts && echo OK` — MCP DAL 存在
- `test -f src/components/mcp/mcp-toolbar.tsx && echo OK` — MCP 工具栏存在
- `test -f src/components/mcp/mcp-grid-skeleton.tsx && echo OK` — 骨架屏存在
- `test -f src/lib/mcp-search-params.ts && echo OK` — 搜索参数存在
- `grep "McpServer" src/data/types.ts | head -1` — McpServer 接口已定义
- `grep "mapMcpServerRow" src/lib/supabase/mappers.ts | head -1` — mapper 已定义
- `grep "getMcpServers" src/lib/data/index.ts | head -1` — DAL 已导出
- `npm run build` — 构建通过

## Risks & Decisions
- **工具情报管线方案已审批**: 用户确认按计划执行
- **OpenClaw 精选已决策**: 做，50-100 个带编辑点评，source='openclaw'
- **编辑点评是护城河**: 竞品（mcp.so/SkillHub）都是量无观点，我们做"精+有观点"
- **author 字段**: 原方案遗漏，已补全到 SQL/类型/mapper/DAL/迁移脚本全链路
- **RLS 策略**: 仅公开 SELECT published 行，service_role 自动绕过 RLS（无额外策略）
