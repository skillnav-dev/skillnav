# HANDOFF
<!-- /checkpoint at 2026-03-17 -->

## Active Plan
学习中心 — `docs/plans/glossary-learning-center.md`（2/5, P1 进行中）

## Session Tasks
- [x] 发布 106 篇高分草稿（score>=4）→ 194 篇 published
- [x] SEO 基础：sitemap 补 /learn、article↔learn 双向内链
- [x] 检查 88 篇重翻结果 → 质量合格，3 篇缺 intro_zh（不紧急）
- [ ] P1-3: 实现 2 种图解组件（对比图 + 架构图）
- [ ] P1-4: learn 页面内链到 articles/mcp（已完成静态链接，待验证搜索参数 ?q= 是否生效）
- [ ] 决定 `rag-tutorial.html` 用途（结论：设计灵感存档，等基础流量起来再做深度指南品类）
- [ ] B-tier MCP description_zh 回填（~250/3521）
- [ ] 发布 26 篇 3 分草稿（可选，当前保留 draft）

## Key Files
- `src/app/sitemap.ts` — 已加 /learn 页面
- `src/app/articles/[slug]/page.tsx` — 新增概念速查内链
- `src/app/learn/[slug]/page.tsx` — 新增延伸阅读内链

## Data State
- Articles: 194 published, 36 draft (26×score3 + 9×low + 1×unscored)
- Skills: 168 published | MCP: 3,947 published
