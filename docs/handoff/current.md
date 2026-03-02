# Handoff — DAL 迁移完成 + ClawHub 全量同步

## Objective
完成前端页面从 mock 数据到 Supabase DAL 的迁移，部署上线，并执行 ClawHub 全量数据同步。

## Current State

### Completed
- **DAL 迁移（6 个页面/组件）**:
  - `src/app/skills/page.tsx` — `getSkills()` 替代 mockSkills
  - `src/app/articles/page.tsx` — `getArticles()` 替代 mockArticles
  - `src/app/articles/[slug]/page.tsx` — `getArticleBySlug()` + `getAllArticleSlugs()`
  - `src/components/home/featured-skills.tsx` — `getFeaturedSkills()`
  - `src/components/home/latest-articles.tsx` — `getLatestArticles()`
  - `src/app/sitemap.ts` — `getAllArticleSlugs()` + `getAllSkillSlugs()`（新增 skills 到 sitemap）
- **Build-time Supabase 客户端**:
  - 新建 `src/lib/supabase/static.ts` — 无 cookies 客户端，解决 `generateStaticParams` 中 `cookies()` 报错
  - `getAllArticleSlugs()` / `getAllSkillSlugs()` 改用 static client
- **Lint 修复**:
  - `src/components/layout/theme-toggle.tsx` — `useState+useEffect` → `useSyncExternalStore`（0 lint errors）
- **代码推送 + 部署**:
  - 9 个 commits 推送到 `origin/main`
  - Cloudflare Pages 已部署更新（skillnav.dev）
- **Supabase 数据（已确认）**:
  - Anthropic: 17 skills ✅
  - ClawHub: 仅 3 skills（上次同步中断）
  - Articles: 2 条（seed data）
- **架构决策**:
  - 确认不搭建后台管理系统，日常运营通过 CLI + Claude 操作
  - RuoYi-Next 项目评估后决定不复用（架构过重、ORM 冲突）

### In Progress
- **ClawHub 全量同步正在后台运行**（`npm run sync:clawhub`，8364 个 skills）

## Next Actions

### 优先级 1：确认 ClawHub 全量同步完成
1. 检查后台同步进程是否完成
2. 查询 Supabase `skills` 表总数，期望 ≥ 8000
3. 检查数据质量 — `name/description/author/tags` 填充率
4. 如同步失败，重跑：`npm run sync:clawhub`

### 优先级 2：数据质量优化
5. 优化分类逻辑 — 大量 skills 归类为"其他"，需改进 `scripts/sync-clawhub.mjs:inferCategory()`
6. 处理 slug 去重问题 — 同名不同 author 的 skills 只保留最后写入版本，考虑改用 `author-skillname` slug

### 优先级 3：搭建部署管线（Cloudflare Pages）
7. 确认 Cloudflare Pages 自动构建配置（build command、环境变量）
8. 配置 Supabase 环境变量到 Cloudflare Pages（`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`）
9. 验证生产环境页面正确展示 Supabase 数据

### 优先级 4：前台功能完善
10. Skills 详情页 — `src/app/skills/[slug]/page.tsx`（当前只有列表页）
11. 搜索功能 — Orama 客户端搜索集成
12. 分页 — skills 列表 8000+ 条需要分页

## Risks & Decisions
- **ClawHub 数据质量**: 大量 skills 分类为"其他"（category inference 覆盖不足）
- **slug 去重**: openclaw/skills 仓库有多版本 skills（同名不同 author），当前按 skill-name slug 去重
- **Cloudflare Pages 环境变量**: 生产环境需配置 Supabase credentials，否则页面回退到 mock 数据
- **页面渲染模式变化**: DAL 迁移后页面从 SSG (○) 变为 Dynamic (ƒ)，每次请求查 Supabase
- **无后台系统**: 运营操作依赖 CLI 脚本 + Claude，若团队扩大需重新评估

## Verification
- `npm run build` — 零错误（10 页面，动态渲染）
- `npm run lint` — 零错误
- `npm run sync:clawhub -- --dry-run --limit 5` — 验证 ClawHub 脚本
- `npm run db:seed` — 验证 Supabase 连接

## Modified Files (本次会话)
- `src/app/skills/page.tsx` — mock → `getSkills()`
- `src/app/articles/page.tsx` — mock → `getArticles()`
- `src/app/articles/[slug]/page.tsx` — mock → `getArticleBySlug()` + `getAllArticleSlugs()`
- `src/components/home/featured-skills.tsx` — mock → `getFeaturedSkills()`
- `src/components/home/latest-articles.tsx` — mock → `getLatestArticles()`
- `src/app/sitemap.ts` — mock → `getAllArticleSlugs()` + `getAllSkillSlugs()`
- `src/lib/supabase/static.ts` — 新建，build-time 无 cookies 客户端
- `src/lib/data/articles.ts` — `getAllArticleSlugs` 改用 static client
- `src/lib/data/skills.ts` — `getAllSkillSlugs` 改用 static client
- `src/components/layout/theme-toggle.tsx` — useSyncExternalStore 修复 lint

## Key References
- 产品方案: `/Users/apple/WeChatProjects/tishici/docs/playbook/skillnav-product-plan.md`
- DAL 代码: `src/lib/data/skills.ts`, `src/lib/data/articles.ts`
- Static client: `src/lib/supabase/static.ts`
- Supabase 项目: `caapclmylemgbrtgfszd` (https://supabase.com/dashboard)
- Cloudflare Pages: skillnav.dev
- RuoYi-Next 参考: `/Users/apple/WeChatProjects/ruoyi`（评估后不复用）
