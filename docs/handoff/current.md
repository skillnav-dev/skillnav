# Handoff — SkillNav M1-W1 网站基础搭建

## Objective
用 mock 数据搭建 SkillNav 网站基础：首页 + 文章页 + Skills 列表页 + SEO 基础，应用"深海导航"品牌方案。

## Current State

### Completed
- **Phase 1 基础设施**: next-themes + shadcn 组件安装, 品牌色彩变量 (globals.css), 字体配置 (lib/fonts.ts), 站点常量 (lib/constants.ts), 类型定义 (data/types.ts), ThemeProvider (components/providers.tsx), layout.tsx 改造 (中文 lang + metadata + Header/Footer)
- **Phase 2 数据层**: 10 条 mock Skills (data/mock-skills.ts), 7 篇 mock 文章含完整中文内容 (data/mock-articles.ts)
- **Phase 3 共享组件**: site-header, site-footer, mobile-nav, theme-toggle, section-header, security-badge, json-ld
- **Phase 4 首页**: hero-section, stats-bar, featured-skills (skill-card), latest-articles (article-card), newsletter-cta, 首页组装 (app/page.tsx)
- **Phase 5 文章页**: article-meta, article-content, 列表页 (app/articles/page.tsx), 详情页 (app/articles/[slug]/page.tsx) 含 SSG + generateMetadata
- **Phase 6 SEO + 收尾**: robots.ts, sitemap.ts, not-found.tsx, JSON-LD (WebSite + Article + Breadcrumb), 清理默认资源
- **补充**: /skills 列表页 (app/skills/page.tsx), sitemap 更新

### In Progress
- 无（M1-W1 技术任务全部完成）

## Next Actions (M1-W2)

### 线 1：数据基础设施
1. 配置 Supabase 项目，创建 `skills` / `articles` / `submissions` 表 — 参考 `docs/playbook/skillnav/product-plan.md` 中的完整 schema
2. 编写 ClawHub 采集脚本 `scripts/sync-clawhub.mjs` — ClawHub CLI/API 批量获取 → Supabase
3. 编写 Skills.sh 采集脚本 `scripts/sync-skills-sh.mjs` — GitHub API → Supabase
4. 数据去重逻辑 — name + author 匹配，多源合并取最优
5. AI 翻译管道 `scripts/translate.mjs` — Claude API 初译 → name_zh / description_zh

### 线 2：页面补全（程序化 SEO）
6. Skill 详情页 `src/app/skills/[slug]/page.tsx` — SSG + 完整信息展示 + SoftwareApplication JSON-LD
7. 分类聚合页 `src/app/category/[category]/page.tsx` — 按类别筛选 Skills
8. RSS 订阅 `src/app/feed.xml/route.ts`

### 线 3：搜索 + 体验
9. Orama 客户端搜索组件 — 零成本 MVP 搜索
10. 将 mock 数据切换为 Supabase 数据获取层

### 可选
- Cloudflare Workers 部署调通 (OpenNext adapter)
- MDX 种子长文排版

## Risks & Decisions
- **Supabase 凭证**: 需要用户创建 Supabase 项目并提供连接信息 (SUPABASE_URL + SUPABASE_ANON_KEY)
- **ClawHub API**: 需确认 API 可用性和 rate limit，可能需要 API key
- **Skills.sh 数据源**: 通过 GitHub API 获取，需 GitHub token 避免 rate limit
- **Claude API 翻译成本**: 批量翻译 8 万+ 条目需要估算 token 消耗和费用
- **执行顺序抉择**: 先做页面补全（纯前端，不依赖 Supabase）还是先打通数据管道？用户尚未决定

## Verification
- `npm run build` — 零错误零警告 (已验证通过, 15 页面)
- `npm run dev` — 手动检查首页/文章/Skills/404/robots.txt/sitemap.xml
- `npm run lint` — ESLint 检查

## Modified Files (本次会话)
- `package.json` — 添加 next-themes 依赖
- `src/app/globals.css` — 深靛蓝品牌色彩变量
- `src/app/layout.tsx` — 中文 lang, 字体, ThemeProvider, Header/Footer
- `src/app/page.tsx` — 首页 5 个 section 组装
- `src/app/not-found.tsx` — 自定义 404
- `src/app/robots.ts` — robots.txt 生成
- `src/app/sitemap.ts` — sitemap.xml 生成
- `src/app/articles/page.tsx` — 文章列表
- `src/app/articles/[slug]/page.tsx` — 文章详情 SSG
- `src/app/skills/page.tsx` — Skills 列表
- `src/lib/constants.ts` — 站点常量
- `src/lib/fonts.ts` — 字体配置
- `src/data/types.ts` — Skill / Article 接口
- `src/data/mock-skills.ts` — 10 条 mock Skill
- `src/data/mock-articles.ts` — 7 篇 mock 文章
- `src/components/providers.tsx` — ThemeProvider
- `src/components/layout/site-header.tsx`
- `src/components/layout/site-footer.tsx`
- `src/components/layout/mobile-nav.tsx`
- `src/components/layout/theme-toggle.tsx`
- `src/components/home/hero-section.tsx`
- `src/components/home/stats-bar.tsx`
- `src/components/home/featured-skills.tsx`
- `src/components/home/latest-articles.tsx`
- `src/components/home/newsletter-cta.tsx`
- `src/components/articles/article-card.tsx`
- `src/components/articles/article-meta.tsx`
- `src/components/articles/article-content.tsx`
- `src/components/skills/skill-card.tsx`
- `src/components/shared/section-header.tsx`
- `src/components/shared/security-badge.tsx`
- `src/components/shared/json-ld.tsx`
- `public/` — 删除 next.svg, vercel.svg, file.svg, globe.svg, window.svg

## Key References
- 产品方案: `/Users/apple/WeChatProjects/tishici/docs/playbook/skillnav/product-plan.md`
- 商业化路线图: `/Users/apple/WeChatProjects/tishici/docs/playbook/skillnav/monetization-roadmap.md`
- 竞品调研: `/Users/apple/WeChatProjects/tishici/docs/playbook/skillnav/competitive-research.md`
