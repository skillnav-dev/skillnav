# HANDOFF
<!-- /checkpoint at 2026-03-18 session 2 -->

## Active Plan
产品转型：从"目录"到"指南" — 4 个 Phase

## Session Summary (2026-03-18)
大量 SEO 修复 + 产品走查 + 首页/Skills 架构重设计

### Deployed (10 commits)
- OG:Image 动态生成（5 个路由 + 共享生成器）
- 列表页 openGraph + 首页 canonical
- Sitemap MCP 分页修复 → B-tier 移除 + noindex
- Hidden 文章 301 重定向（消除 97 个 404）
- generate-weekly.yml: deepseek + 30min timeout
- Newsletter 空壳 → X 关注 CTA
- 软广自动检测（pipeline isAdvertorial flag）
- 术语表 42→50 + 概念映射 10→12
- Skills 安装命令修复（168 条）+ 仓库分组视图
- **首页场景化导航**（"你想做什么"8 个入口）

### Data fixes (DB)
- 168 skill install_command 指向具体 skill 路径
- 3 篇软广 hidden（Dynatrace/GitHub Dev Days/LangChain Interrupt）

### Analytics baseline (Umami)
- 30 天：142 访客 / 1,058 PV / 67% 跳出
- 来源：Google 79% / ChatGPT 5% / 微信 3%
- Top：首页 23% / 文章 37% / Skills 14% / MCP 1%
- GSC：133 页已索引 / 259 未索引（97 个 404 已修）

## Phase Plan
1. ✅ 场景化入口（首页改造，已部署）
2. [ ] 做厚 S-tier 详情页（66 MCP + 17 Skills 官方）
3. [ ] 编辑原创内容（5-10 篇 "最佳X" 指南）
4. [ ] 分发节奏（X 每周 3 条 + V2EX/掘金月度）

## Pending User Actions
- [ ] GSC 重新提交 sitemap
- [ ] 发置顶推文 + 首条推文
- [ ] X API Free tier 额度激活（CreditsDepleted）

## Key Files
- `src/components/home/scenario-shortcuts.tsx` — 场景化导航
- `src/components/skills/skills-repo-grid.tsx` — 仓库卡片 + 仓库详情
- `src/lib/og-image.tsx` — 共享 OG 图片生成器
- `src/lib/data/mcp.ts:368` — sitemap S/A only
- `scripts/lib/llm.mjs` — isAdvertorial 检测
- `public/brand/` — logo 素材（avatar-dark.png 用于 X）
