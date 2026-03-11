# Handoff — SkillNav
<!-- Updated at 2026-03-11 session 35 -->

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
- **方案 v2 产出**: `docs/plans/tool-intelligence-pipeline.md`（含全部调研结论）
- **关键决策**: OpenClaw 精选应做；MCP 必须入库；编辑点评是最大差异化武器

### 第 31 轮：M1 MCP 入库 — 代码层完成（session 32, Day 11）
- 类型/DAL/前端 SSR 改造：MCP 页面从静态硬编码 → Supabase DAL + nuqs + Suspense
- DB 脚本：`sql/create-mcp-servers.sql` + `scripts/migrate-mcp-to-db.mjs`

### 第 32 轮：M1 DB 完成 + MCP 详情页 + M2 Skills 补列（session 33, Day 11）
- MCP 详情页 `/mcp/[slug]` + `/en/mcp/[slug]`（两栏布局、JSON-LD、相关推荐）
- M2 Skills DB 迁移：13 个新列 + DAL `onlyPublished(status)` 切换

### 第 33 轮：M2/M3/M4 工具情报管线代码实现（session 34, Day 11）
- **三个 Agent 并行开发**（worktree 隔离），文件范围无重叠，合并后构建通过
- **M2 Skills 同步脚本改造**:
  - `sync-curated-skills.mjs` 新增 `--incremental`/`--source`/`--evaluate` flags
  - 新建 `scripts/lib/sources/awesome-skills.mjs`：解析 awesome-agent-skills(617) + awesome-claude-skills(34)，去重后 127 个
  - 新建 `scripts/lib/sources/skills-sh.mjs`：npm registry 搜索 96 个，去重后 85 个
  - LLM 评价集成（`--evaluate` 产出 nameZh/descriptionZh/category/qualityScore/editorCommentZh）
  - 新 Skills 入库 status='draft'，双重去重（slug + github_url）
- **M3 保鲜层**:
  - `scripts/lib/github.mjs` 新增 `githubGraphQLBatch()`（每批 50 repo，alias 模式）
  - 新建 `scripts/refresh-tool-metadata.mjs`（每日更新 stars/freshness + `--snapshot` 周快照 + trending）
  - 新建 `sql/create-stars-snapshots.sql`（快照表 + UNIQUE 约束 + 降序索引）
  - 新建 `src/components/shared/freshness-badge.tsx`（Trending/New/Stale/Archived 角标）
  - `skill-card.tsx`：SecurityBadge → FreshnessBadge + editorCommentZh 展示
  - `mcp-card.tsx`：FreshnessBadge + toolsCount + editorCommentZh 展示
- **M4 周刊升级**:
  - `generate-weekly.mjs` 从"仅文章"→ 三支柱（文章 + Skills/MCP 动态 + 生态变更）
  - 新增 5 个查询函数（newSkills/trendingSkills/newMcp/trendingMcp/freshnessChanges）
  - Markdown 三段式格式（本周亮点 + 精选文章 + 生态动态）
  - LLM prompt 整合三支柱上下文
- **dry-run 验证全部通过**: awesome-list 651→127 / skills-sh 96→85 / GraphQL 16 repos 4s / build OK

### 第 34 轮：管线运维首跑 + CI 编排 + MCP 详情页丰富（session 35, Day 11）
- **DB 操作执行**:
  - `stars_snapshots` 表已创建（通过 Supabase Management API + Keychain token 提取）
  - `skills_source_check` 约束更新：新增 `awesome-list`/`skills-sh`/`openclaw` 值
- **首次保鲜成功**: 168 Skills + 17 MCP 的 stars/freshness 写入 DB，0 错误
  - 发现 `linear/linear-mcp-server` 仓库不可解析（可能改名/删除）
- **首次增量同步成功**: awesome-list 124 个新 Skills 入库（status=draft），去重正常
  - DB 现状：curated 168 pub + anthropic 17 pub + awesome-list 124 draft = 309 skills
- **CI 编排完成**（子代理并行）:
  - 新建 `refresh-tool-metadata.yml`：每日 UTC 02:00 保鲜 + 周一 UTC 03:00 快照
  - 更新 `sync-curated-skills.yml`：周一 UTC 01:00 + 新增 source/incremental/evaluate 参数
  - 更新 `generate-weekly.yml`：周一 UTC 04:00（在快照之后）
- **MCP 详情页丰富**（子代理并行）:
  - 新建 `src/lib/github-readme.ts`：GitHub API 获取 README + 24h ISR 缓存
  - 新建 `src/components/mcp/mcp-readme.tsx`：ReactMarkdown 渲染 + 折叠/展开
  - 新建 `src/components/shared/giscus-comments.tsx`：共享评论组件（MCP + Skills 页面）
  - MCP 详情页新增：README 区块 + 工具数展示 + giscus 评论
  - Skills 详情页：评论组件切换为共享 GiscusComments
- **构建通过**: 488 页面全部成功

## In Progress

无

## Next

1. **Admin 审核**: 124 个 draft Skills + 36 篇 draft 文章待审核
2. **部署**: push 代码到 GitHub，触发 CI/CD 部署
3. **排查**: `linear/linear-mcp-server` MCP 服务器可能已改名，需更新或移除
4. **清理**: 旧的 `src/components/skills/skill-comments.tsx` 可移除（已被共享组件替代）
5. **MCP 工具列表**: DB 增加 `tools` JSONB 字段，展示每个 MCP Server 的具体工具列表
6. **MCP 发现源**: 接入 Official MCP Registry + Smithery（方案已在 pipeline plan 中）

## Risks & Decisions

- **工具情报管线方案已审批**: 用户确认按计划执行
- **OpenClaw 精选已决策**: 做，50-100 个带编辑点评，source='openclaw'
- **编辑点评是护城河**: 竞品（mcp.so/SkillHub）都是量无观点，我们做"精+有观点"
- **Skills DAL 迁移**: `is_hidden` → `status` 字段切换完成
- **Supabase Management API**: Keychain token 提取方式已验证可用（go-keyring-base64 编码）
- **DB 约束**: `skills_source_check` 已扩展支持 awesome-list/skills-sh/openclaw
- **CI 时间线**: 周一 01:00→02:00→03:00→04:00 UTC 顺序编排（同步→保鲜→快照→周刊）

## Verify

- `test -f .github/workflows/refresh-tool-metadata.yml && echo OK` — 保鲜 CI workflow 存在
- `grep "0 2 \* \* \*" .github/workflows/refresh-tool-metadata.yml | head -1` — 每日保鲜 cron
- `grep "0 3 \* \* 1" .github/workflows/refresh-tool-metadata.yml | head -1` — 周一快照 cron
- `grep "0 1 \* \* 1" .github/workflows/sync-curated-skills.yml | head -1` — 周一同步 cron
- `grep "0 4 \* \* 1" .github/workflows/generate-weekly.yml | head -1` — 周一周刊 cron
- `grep "source" .github/workflows/sync-curated-skills.yml | head -1` — source 参数
- `test -f src/lib/github-readme.ts && echo OK` — README 获取函数存在
- `test -f src/components/mcp/mcp-readme.tsx && echo OK` — README 组件存在
- `test -f src/components/shared/giscus-comments.tsx && echo OK` — 共享评论组件存在
- `grep "GiscusComments" src/app/mcp/\[slug\]/page.tsx | head -1` — MCP 详情页用共享评论
- `grep "GiscusComments" src/app/skills/\[slug\]/page.tsx | head -1` — Skills 详情页用共享评论
- `grep "fetchReadme" src/app/mcp/\[slug\]/page.tsx | head -1` — MCP 详情页获取 README
- `npm run build` — 构建通过
