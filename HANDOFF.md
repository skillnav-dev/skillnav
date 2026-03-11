# Handoff — SkillNav
<!-- Updated at 2026-03-11 session 34 -->

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

## In Progress

无

## Next

1. **DB 操作**: 在 Supabase 执行 `sql/create-stars-snapshots.sql` 建快照表
2. **首次保鲜**: `node scripts/refresh-tool-metadata.mjs`（写入真实 stars 到 DB）
3. **首次增量同步**: `node scripts/sync-curated-skills.mjs --incremental --source awesome-list`
4. **Admin 审核**: 审核新入库的 draft Skills + 36 篇 draft 文章
5. **CI 编排**: GitHub Actions cron（每日保鲜 + 每周同步 + 每周快照）
6. **MCP 详情页丰富**: 接入 README 内容、工具列表、giscus 评论

## Risks & Decisions

- **工具情报管线方案已审批**: 用户确认按计划执行
- **OpenClaw 精选已决策**: 做，50-100 个带编辑点评，source='openclaw'
- **编辑点评是护城河**: 竞品（mcp.so/SkillHub）都是量无观点，我们做"精+有观点"
- **Skills DAL 迁移**: `is_hidden` → `status` 字段切换完成
- **Supabase Management API**: 可靠的中国网络替代方案
- **Worktree 并行开发**: 已验证可行，注意 worktree 可能基于旧 commit，需手动合并而非直接覆盖

## Verify

- `test -f scripts/lib/sources/awesome-skills.mjs && echo OK` — awesome-list 源存在
- `test -f scripts/lib/sources/skills-sh.mjs && echo OK` — skills.sh 源存在
- `grep "incremental" scripts/sync-curated-skills.mjs | head -1` — 增量同步支持
- `grep "githubGraphQLBatch" scripts/lib/github.mjs | head -1` — GraphQL 批量查询
- `test -f scripts/refresh-tool-metadata.mjs && echo OK` — 保鲜脚本存在
- `test -f sql/create-stars-snapshots.sql && echo OK` — 快照表 SQL 存在
- `test -f src/components/shared/freshness-badge.tsx && echo OK` — Freshness 角标组件
- `grep "FreshnessBadge" src/components/skills/skill-card.tsx | head -1` — skill-card 用 FreshnessBadge
- `grep "FreshnessBadge" src/components/mcp/mcp-card.tsx | head -1` — mcp-card 用 FreshnessBadge
- `grep "queryNewSkills\|queryTrendingSkills" scripts/generate-weekly.mjs | head -1` — 周刊三支柱查询
- `npm run build` — 构建通过
