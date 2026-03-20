# HANDOFF
<!-- /checkpoint at 2026-03-20 -->

## Active Plans
- 30-Day Growth Sprint — `~/.gstack/projects/skillnav-dev-skillnav/apple-main-design-20260319-182224.md`（APPROVED, Week 1）
- GSC 索引率修复 — `docs/research/2026-03-19-gsc-indexing-diagnosis.md`（调研完成，待执行）

## Session Tasks
- [x] 10 个新交互式指南集成到 `public/guides/` + `/guides` 页面更新为 11 卡片网格
- [ ] Growth Sprint Week 1: 生成 daily brief → 发 X/知乎/小红书 → 掘金介绍帖 → V2EX 介绍帖
- [ ] SEO 修复: sitemap 移除 /en/ 路由 + robots.txt disallow _next/
- [ ] 重翻译剩余 46 篇（`node scripts/sync-articles.mjs --retranslate-published`）
- [ ] 逐篇审读 5 篇封面文章候选

## Pending User Actions
- [ ] .env.local 设 `LLM_PROVIDER=gpt`
- [ ] 配置 crontab（sync 6am → generate 7am → 审核 → publish）

## Key Files
- `src/app/guides/page.tsx` — 专栏页（11 交互式指南卡片）
- `public/guides/*.html` — 11 个独立交互式 HTML 指南
- `scripts/lib/llm.mjs` — 翻译 prompt（上次优化，commit 98410d7）
