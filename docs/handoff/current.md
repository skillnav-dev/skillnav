# Handoff — Supabase 基础设施 + 数据采集脚本

## Objective
为 SkillNav 建立 Supabase 后端基础设施和数据采集管道（M1-W2 数据线），包括数据库 schema、客户端工具、数据访问层（DAL）、同步脚本和 AI 翻译管道。

## Current State

### Completed
- **依赖安装**: `@supabase/supabase-js`, `@supabase/ssr`, `dotenv`, `@anthropic-ai/sdk`
- **SQL Migration**: `supabase/migrations/001_initial_schema.sql` — 3 张表（skills, articles, submissions）+ indexes + RLS + updated_at trigger
- **Supabase 客户端**:
  - `src/lib/supabase/server.ts` — RSC cookie-based client
  - `src/lib/supabase/client.ts` — 浏览器端 client
  - `src/lib/supabase/types.ts` — Database 类型定义（手写，匹配 migration）
  - `src/lib/supabase/mappers.ts` — snake_case → camelCase 转换（SkillRow→Skill, ArticleRow→Article）
- **数据访问层（DAL）**:
  - `src/lib/data/skills.ts` — getSkills(), getSkillBySlug(), getFeaturedSkills(), getSkillsCount(), getAllSkillSlugs()
  - `src/lib/data/articles.ts` — getArticles(), getArticleBySlug(), getLatestArticles(), getAllArticleSlugs()
  - `src/lib/data/index.ts` — barrel export
  - 内部检测 NEXT_PUBLIC_SUPABASE_URL，无 Supabase 时自动回退 mock 数据
- **类型扩展**: `src/data/types.ts` — 新增 SkillSource, PricingType, ArticleType（+review/comparison/weekly）, Submission 接口
- **Mock 数据更新**: `src/data/mock-skills.ts` — clawhubUrl→sourceUrl, 添加 source:"clawhub"
- **组件修复**: article-card.tsx, article-meta.tsx — 补全新 ArticleType 标签和颜色
- **同步脚本**:
  - `scripts/sync-clawhub.mjs` — 从 GitHub 仓库采集 SKILL.md（解析 YAML frontmatter）
  - `scripts/sync-anthropic-skills.mjs` — 从 anthropics/skills 仓库采集
  - `scripts/translate-batch.mjs` — Claude Sonnet API 批量翻译 name/description → zh
  - `scripts/seed-mock.mjs` — Mock 数据写入 Supabase 验证连接
  - `scripts/lib/supabase-admin.mjs` — service_role admin client
  - `scripts/lib/github.mjs` — GitHub API helper（rate limit 重试、分页、raw 文件获取）
  - `scripts/lib/logger.mjs` — 带颜色和计时的日志
- **配置**: `.env.example`（模板）, `.mcp.json`（Supabase MCP Server）
- **npm scripts**: db:seed, sync:clawhub, sync:anthropic, sync:all, translate
- **Build 验证**: `npm run build` 通过，15/15 页面，零 TypeScript 错误

### In Progress
- 无（本阶段任务全部完成）

## Next Actions

### 优先级 1：激活 Supabase 连接
1. **重启 Claude Code 会话**以激活 `.mcp.json` 中的 Supabase MCP Server
2. 在 Supabase Dashboard SQL Editor 或通过 MCP 执行 `supabase/migrations/001_initial_schema.sql` 建表
3. 将 Supabase 凭证填入 `.env.local`（URL, anon key, service role key）
4. 运行 `npm run db:seed` 验证连接（seed-mock.mjs 写入 3 skills + 2 articles）

### 优先级 2：测试采集脚本
5. 运行 `npm run sync:clawhub -- --dry-run` 测试 ClawHub 数据获取
6. 运行 `npm run sync:anthropic -- --dry-run` 测试 Anthropic Skills 获取
7. 确认实际 GitHub 仓库路径（sync-clawhub.mjs 当前指向 `anthropics/claude-code-skills`）
8. 配置 GITHUB_TOKEN 到 `.env.local` 提升 API 速率限制（60→5000 req/hr）

### 优先级 3：页面迁移到 DAL
9. 修改 `src/app/skills/page.tsx` — 从 `import { mockSkills }` 改为 `import { getSkills } from "@/lib/data"`
10. 修改 `src/app/articles/page.tsx` — 同上模式
11. 修改 `src/app/articles/[slug]/page.tsx` — 使用 getArticleBySlug()
12. 修改 `src/components/home/featured-skills.tsx` — 使用 getFeaturedSkills()
13. 修改 `src/components/home/latest-articles.tsx` — 使用 getLatestArticles()
14. 修改 `src/app/sitemap.ts` — 使用 getAllSkillSlugs() / getAllArticleSlugs()

### 优先级 4：工程化补充
15. 修复 `src/components/layout/theme-toggle.tsx:13` 的 lint error（useEffect 中 setMounted）
16. 推送本地 5 个未推送 commit 到 origin/main

## Risks & Decisions
- **ClawHub 仓库路径**: sync-clawhub.mjs 的 `REPO_OWNER/REPO_NAME` 可能需要调整，需验证 `anthropics/claude-code-skills` 是否是正确仓库
- **Supabase MCP**: 需要新会话才能激活，首次使用需浏览器 OAuth 授权
- **DAL 回退机制**: 无 NEXT_PUBLIC_SUPABASE_URL 时自动用 mock 数据，build 时也是如此（ISR 页面在部署环境需要 env vars）
- **翻译成本**: Claude Sonnet 翻译 ~$3/百万 token，13K skills 短文本预计 < $5

## Verification
- `npm run build` — 零错误（15 页面）
- `npm run lint` — 1 个已知 error（theme-toggle.tsx，Known Pitfalls）

## Modified Files (本次会话)
- `package.json` — 新增 4 个依赖 + 5 个 npm scripts
- `package-lock.json` — 锁文件更新
- `.env.example` — 新建，环境变量模板
- `.mcp.json` — 新建，Supabase MCP Server 配置
- `supabase/migrations/001_initial_schema.sql` — 新建，建表 SQL
- `src/lib/supabase/server.ts` — 新建
- `src/lib/supabase/client.ts` — 新建
- `src/lib/supabase/types.ts` — 新建
- `src/lib/supabase/mappers.ts` — 新建
- `src/lib/data/skills.ts` — 新建，Skills DAL
- `src/lib/data/articles.ts` — 新建，Articles DAL
- `src/lib/data/index.ts` — 新建，barrel export
- `src/data/types.ts` — 扩展（+SkillSource, PricingType, ArticleType, Submission）
- `src/data/mock-skills.ts` — 更新（clawhubUrl→sourceUrl, +source）
- `src/components/articles/article-card.tsx` — 补全新 ArticleType 标签/颜色
- `src/components/articles/article-meta.tsx` — 补全新 ArticleType 标签
- `scripts/lib/supabase-admin.mjs` — 新建
- `scripts/lib/github.mjs` — 新建
- `scripts/lib/logger.mjs` — 新建
- `scripts/seed-mock.mjs` — 新建
- `scripts/sync-clawhub.mjs` — 新建
- `scripts/sync-anthropic-skills.mjs` — 新建
- `scripts/translate-batch.mjs` — 新建

## Key References
- 产品方案: `/Users/apple/WeChatProjects/tishici/docs/playbook/skillnav-product-plan.md`
- 实施计划: `/Users/apple/.claude/plans/breezy-riding-emerson.md`
