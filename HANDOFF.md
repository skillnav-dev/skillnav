# Handoff — SkillNav
<!-- Updated at 2026-03-11 session 33 -->

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

### 第 32 轮：M1 DB 完成 + MCP 详情页 + M2 Skills 补列（session 33, Day 11）
- **M1 MCP DB 操作**: Supabase 建表 `mcp_servers`（39 字段）+ 迁移 18 条数据（9 featured），验证通过
- **MCP 详情页**: `/mcp/[slug]` + `/en/mcp/[slug]` 全新页面
  - 两栏布局（主内容+侧边栏）、安装命令复制、编辑点评高亮、配置示例
  - 侧边栏：分类/来源/Stars/工具数/版本/验证/活跃度/收录日期/标签/外链
  - JSON-LD (Breadcrumb + SoftwareApplication + FAQ)、中英双语 hreflang
  - 相关 MCP Server 推荐（同分类 top 3）
  - MCP 卡片加 Link 跳转详情页
  - Sitemap 新增 MCP 详情页 URL（中英双语）
- **M2 Skills DB 迁移**: 13 个新列（status, intro_zh, quality_score, quality_reason, discovered_at, pushed_at, forks_count, is_archived, is_trending, weekly_stars_delta, freshness, install_count, last_synced_at）
  - 185 条 skills 全部 backfill status='published'
  - DAL 从 `excludeHidden(is_hidden)` → `onlyPublished(status)`
  - SkillRow 类型 + Skill 接口 + mapper 全部同步更新
- **并行执行**: 两个 Agent 同时开发，文件范围无重叠，合并后构建通过
- **Supabase API 技巧**: Management API (`api.supabase.com/v1/projects/{ref}/database/query`) 绕过中国网络 Postgres 直连限制

## In Progress

无

## Next

1. **M2 续: Skills 同步脚本** — 改造 `sync-curated-skills.mjs` 增量检测 + 新增 awesome-agent-skills/skills.sh 源
2. **M3: 保鲜层** — `refresh-tool-metadata.mjs` + GraphQL 批量 + `stars_snapshots` 表 + freshness 角标
3. **M4: 周刊枢纽** — 升级 `generate-weekly.mjs` 整合三支柱
4. **审核 36 篇 draft** — Admin 后台 publish/hide
5. **MCP 详情页内容丰富** — 接入 README 内容、工具列表、giscus 评论

## Risks & Decisions

- **工具情报管线方案已审批**: 用户确认按计划执行
- **OpenClaw 精选已决策**: 做，50-100 个带编辑点评，source='openclaw'
- **编辑点评是护城河**: 竞品（mcp.so/SkillHub）都是量无观点，我们做"精+有观点"
- **Skills DAL 迁移**: `is_hidden` → `status` 字段切换完成，旧列保留兼容
- **Supabase Management API**: 可靠的中国网络替代方案（token 在 macOS keychain）

## Verify

- `test -f src/app/mcp/[slug]/page.tsx && echo OK` — MCP 详情页存在
- `test -f src/app/en/mcp/[slug]/page.tsx && echo OK` — 英文 MCP 详情页存在
- `test -f src/components/mcp/mcp-detail-sidebar.tsx && echo OK` — 侧边栏组件存在
- `grep "Link" src/components/mcp/mcp-card.tsx | head -1` — MCP 卡片有 Link
- `grep "mcpPages" src/app/sitemap.ts | head -1` — Sitemap 含 MCP 详情页
- `test -f sql/skills-m2-columns.sql && echo OK` — Skills M2 迁移 SQL 存在
- `grep "onlyPublished" src/lib/data/skills.ts | head -1` — Skills DAL 用 status 过滤
- `grep "quality_score" src/lib/supabase/types.ts | head -1` — SkillRow 有新列
- `grep "freshness" src/data/types.ts | head -1` — Skill 接口有 freshness
- `npm run build` — 构建通过
