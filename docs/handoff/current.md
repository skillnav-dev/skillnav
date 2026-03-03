# Handoff — Skills 列表页分页/搜索/过滤完成

## Objective
为 Skills 列表页添加分页、搜索和分类过滤功能，解决一次加载 6,424 条记录的性能问题。

## Current State

### Completed
- **Skills 列表页增强** (`/skills`):
  - `src/app/skills/page.tsx` — Suspense 流式编排 + 动态 `generateMetadata`（含搜索词/分类/页码）
  - `src/components/skills/skills-toolbar.tsx` — `'use client'`，nuqs `useQueryState` 双向绑定搜索 + 分类过滤
  - `src/components/skills/skills-grid.tsx` — async Server Component，Suspense 内数据获取 + 渲染
  - `src/components/skills/skills-pagination.tsx` — Server Component，Link-based 截断页码（`1 ... 4 5 [6] 7 8 ... 268`）
  - `src/components/skills/skills-skeleton.tsx` — 骨架屏（24 卡片 + 分页占位）
  - `src/components/skills/skills-empty.tsx` — 空状态提示 + 清除筛选链接
- **nuqs 集成**:
  - `src/lib/skills-search-params.ts` — 类型安全参数定义（q/category/page），Server/Client 共享
  - `src/components/providers.tsx` — 添加 `NuqsAdapter` 包裹
  - URL 格式：`/skills?q=agent&category=开发&page=2`
- **DAL 扩展** (`src/lib/data/skills.ts`):
  - `getSkillsWithCount()` — Supabase `select("*", { count: "exact" })` 单次查询
  - `getSkillCategories()` — 去重排序的分类列表
- **前序完成项**（之前会话）:
  - Skills 详情页 `/skills/[slug]` + SkillMeta 组件
  - ClawHub 全量同步 6,424 skills
  - 同步脚本增强（进度条/分段/断点续传/去重）

### In Progress
- 无

## Next Actions

### 优先级 1：数据质量优化
1. `scripts/sync-clawhub.mjs:inferCategory()` — 改进分类逻辑，当前几乎所有 skills 归为"其他"，导致分类过滤无实际效果
2. 删除 `idx_skills_dedup` 约束（Supabase Dashboard SQL Editor），slug 唯一性已足够
3. 重跑 Batch 3 丢失的约 500 条记录

### 优先级 2：部署管线（当前无任何 CI/CD 配置）
4. 安装 `@opennextjs/cloudflare` 适配器，配置 `wrangler.toml`
5. 创建 `.github/workflows/deploy.yml` — GitHub Actions 自动部署到 Cloudflare Workers
6. Cloudflare Dashboard 配置环境变量（`NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`）
7. 验证生产环境 `skillnav.dev` 页面正常工作

### 优先级 3：搜索体验优化
6. `src/components/skills/skills-toolbar.tsx` — 搜索结果高亮匹配关键词
7. 考虑 Orama 客户端搜索替代 Supabase `ilike`（更快的中文搜索体验）

### 优先级 4：Articles 列表页同样升级
8. `src/app/articles/page.tsx` — 参考 skills 实现，添加分页 + 分类过滤
9. `src/lib/data/articles.ts` — 添加 `getArticlesWithCount()`

## Risks & Decisions
- **分类数据质量**：ClawHub 6,407 skills 中绝大多数归为"其他"，分类过滤当前几乎无用。需改进 `inferCategory()` 或引入 LLM 分类
- **双重数据获取**：`page.tsx` 和 `SkillsGrid` 各调用一次 `getSkillsWithCount`（toolbar 需要 total，grid 需要 skills）。Next.js 可能通过 React cache 去重，后续可优化
- **idx_skills_dedup 约束仍存在**：跨批次冲突导致约 500 条记录丢失
- **页面渲染模式**：所有数据页面为动态渲染（ƒ），每次请求查 Supabase

## Verification
- `npm run build` — 零错误，8 个路由
- `npm run lint` — 零错误
- `npm run dev` → 访问以下 URL 验证:
  - `/skills` — 第 1 页，24 条，分页 268 页
  - `/skills?page=2` — 第 2 页，title 含"第 2 页"
  - `/skills?q=code` — 搜索过滤
  - `/skills?category=其他` — 分类过滤
  - `/skills?q=test&category=其他&page=1` — 组合筛选

## Modified Files (本次会话)
- `package.json` / `package-lock.json` — 添加 nuqs 依赖
- `src/lib/skills-search-params.ts` — **新建**，nuqs 参数定义
- `src/lib/data/skills.ts` — 添加 `getSkillsWithCount` + `getSkillCategories`
- `src/lib/data/index.ts` — 添加 2 个导出
- `src/components/providers.tsx` — 添加 NuqsAdapter
- `src/components/skills/skills-toolbar.tsx` — **新建**，搜索 + 分类过滤
- `src/components/skills/skills-grid.tsx` — **新建**，数据网格
- `src/components/skills/skills-pagination.tsx` — **新建**，分页导航
- `src/components/skills/skills-skeleton.tsx` — **新建**，骨架屏
- `src/components/skills/skills-empty.tsx` — **新建**，空状态
- `src/app/skills/page.tsx` — 重写为 Suspense 流式编排

## Key References
- 产品方案：`/Users/apple/WeChatProjects/tishici/docs/playbook/skillnav-product-plan.md`
- DAL 代码：`src/lib/data/skills.ts`、`src/lib/data/articles.ts`
- nuqs 文档：https://nuqs.dev
- Supabase 项目：`caapclmylemgbrtgfszd`
- Cloudflare Pages：skillnav.dev
