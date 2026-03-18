# HANDOFF
<!-- /checkpoint at 2026-03-18 -->

## Active Plan
产品转型 "目录→指南" — `docs/adr/002-product-direction-guide-over-directory.md`

## Session Tasks
- [x] SEO P0 修复（OG 图/openGraph/canonical/sitemap 分页/404→301/B-tier noindex）
- [x] CI 修复（generate-weekly deepseek+30min/lint fix）
- [x] Skills 安装命令修复（168 条）+ 仓库分组架构（B 方案）
- [x] 首页场景化导航（"你想做什么" 8 入口）
- [x] 软广检测管线 + 3 篇 hidden
- [x] Newsletter → X 关注 CTA
- [x] 术语表 42→50 + 概念映射 12/12
- [x] 品牌素材整理（public/brand/）
- [x] 流量基线建立（Umami API 分析）
- [ ] Phase 2: 做厚 S-tier 详情页（66 MCP + 17 Skills）
- [ ] Phase 3: 编辑原创（"最佳 X" 指南 5-10 篇）
- [ ] Phase 4: 分发节奏（X 周 3 条 + V2EX/掘金）

## Pending User Actions
- [ ] GSC 提交 sitemap（打开 GSC → 站点地图 → 提交）
- [ ] 发置顶推文 + 首条推文（文案在对话中）
- [ ] X API Free tier 额度激活

## Key Files
- `src/components/home/scenario-shortcuts.tsx` — 8 场景入口
- `src/components/skills/skills-repo-grid.tsx` — 仓库卡片 + 详情
- `src/lib/og-image.tsx` — 共享 OG 图片生成器
- `scripts/lib/llm.mjs` — isAdvertorial 检测
- `docs/adr/002-product-direction-guide-over-directory.md` — 转型决策
- `docs/research/2026-03-18-traffic-baseline.md` — 流量基线
