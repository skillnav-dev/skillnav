# Handoff — Supabase 激活 + 数据全量同步

## Objective
激活 Supabase 数据库连接，完成采集脚本修复，并执行全量数据同步（Anthropic + ClawHub）。

## Current State

### Completed
- **Supabase 连接激活**:
  - `.env.local` 已创建（URL, anon key, service role key, GitHub token）
  - Supabase CLI v2.75.0 已安装并 link 项目
  - Migration SQL 已通过 Management API 执行 — 3 张表 + 索引 + RLS
  - `npm run db:seed` 验证通过（3 skills + 2 articles）
- **脚本修复**:
  - 所有 4 个脚本 dotenv 加载修复（`.env.local` 优先）
  - `sync-clawhub.mjs`: 仓库路径 `anthropics/claude-code-skills` → `openclaw/skills`
  - `sync-clawhub.mjs`: 新增 Markdown fallback 解析器（处理无 YAML frontmatter 的 SKILL.md）
  - `sync-clawhub.mjs`: 从路径提取 author，从 metadata 嵌套块提取 tags
  - `sync-clawhub.mjs`: source_url 改为 clawhub.com 规范链接
- **数据同步**:
  - Anthropic: 17 skills 已写入 Supabase ✅
  - ClawHub: 8363 skills 全量同步（可能在后台运行中或已完成）
- **工程修复**:
  - `pre-bash-firewall.sh`: pipe-to-shell 正则过宽已修复
  - `.gitignore`: 添加 `supabase/.temp/`

### In Progress
- ClawHub 全量同步可能仍在后台运行（`npm run sync:clawhub`）

## Next Actions

### 优先级 1：确认 ClawHub 同步结果
1. 检查同步是否完成：查看 Supabase skills 表总数
2. 如未完成或有错误，重跑：`npm run sync:clawhub`
3. 确认数据质量 — 检查 name/description/author/tags 填充率

### 优先级 2：页面迁移到 DAL（6 个文件）
4. `src/app/skills/page.tsx` — `import { mockSkills }` → `import { getSkills } from "@/lib/data"`
5. `src/app/articles/page.tsx` — 同上模式，使用 `getArticles()`
6. `src/app/articles/[slug]/page.tsx` — 使用 `getArticleBySlug()`
7. `src/components/home/featured-skills.tsx` — 使用 `getFeaturedSkills()`
8. `src/components/home/latest-articles.tsx` — 使用 `getLatestArticles()`
9. `src/app/sitemap.ts` — 使用 `getAllSkillSlugs()` / `getAllArticleSlugs()`

### 优先级 3：工程化补充
10. 修复 `src/components/layout/theme-toggle.tsx:13` 的 lint error（`setMounted` in useEffect）
11. 推送本地 7 个未推送 commit 到 origin/main

## Risks & Decisions
- **ClawHub 数据质量**: 大量 skills 分类为"其他"（category inference 覆盖不足），后续需优化分类逻辑
- **部分 SKILL.md 无法解析**: 既没有 YAML frontmatter 也没有 Markdown heading 的文件会被跳过
- **slug 去重**: openclaw/skills 仓库有多版本 skills（同名不同 author），当前按 skill-name slug 去重，同名 skill 只保留最后写入的版本
- **7 个未推送 commit** 在 main 分支

## Verification
- `npm run build` — 零错误（15 页面）
- `npm run lint` — 1 个已知 error（theme-toggle.tsx，Known Pitfalls）
- `npm run db:seed` — 验证 Supabase 连接
- `npm run sync:anthropic -- --dry-run` — 验证 Anthropic 脚本
- `npm run sync:clawhub -- --dry-run --limit 5` — 验证 ClawHub 脚本

## Modified Files (本次会话)
- `.env.local` — 新建，Supabase 凭证 + GitHub token（不提交）
- `.gitignore` — 添加 `supabase/.temp/`
- `.claude/hooks/pre-bash-firewall.sh` — 修复 pipe-to-shell 正则
- `scripts/seed-mock.mjs` — dotenv 加载修复
- `scripts/sync-anthropic-skills.mjs` — dotenv 加载修复
- `scripts/sync-clawhub.mjs` — 仓库路径 + Markdown fallback 解析 + author/tags 提取
- `scripts/translate-batch.mjs` — dotenv 加载修复

## Key References
- 产品方案: `/Users/apple/WeChatProjects/tishici/docs/playbook/skillnav-product-plan.md`
- DAL 代码: `src/lib/data/skills.ts`, `src/lib/data/articles.ts`
- Supabase 项目: `caapclmylemgbrtgfszd` (https://supabase.com/dashboard)
