# HANDOFF
<!-- /checkpoint at 2026-04-06 -->

## Active Plan
论文雷达 — `docs/plans/paper-radar.md`（3/3, done）

## Session Tasks
- [x] paper-radar.mjs 三源采集 + 中文翻译 + Vault 输出
- [x] translate-paper.mjs 双写 Vault
- [x] 6 篇论文翻译 + 发布 + 图片 URL 修复
- [x] CF Worker 1102 修复：ISR 缓存配置 + 列裁剪 + 客户端加载
- [ ] paper-radar 自动触发翻译 → `scripts/auto-translate-radar.mjs`
- [ ] Semantic Scholar API Key → `.env.local` 加 `S2_API_KEY`

## Key Files
- `scripts/paper-radar.mjs` — 三源论文感知 → ~/Vault/知识库/AI/论文雷达/
- `scripts/translate-paper.mjs` — 论文翻译，双写 DB + ~/Vault/知识库/AI/论文/
- `src/components/articles/article-content.tsx` — 客户端 Supabase 直查内容
- `src/lib/data/articles.ts` — getArticleBySlug 列裁剪（不含 content）
- `wrangler.jsonc` + `open-next.config.ts` — ISR R2 缓存 + DO 队列

## Next Actions
- [ ] 申请 S2 API Key：https://www.semanticscholar.org/product/api
- [ ] 写 `scripts/auto-translate-radar.mjs`：扫描雷达 [x] → 自动翻译
- [ ] 配 launchd 定时跑 paper-radar + auto-translate
- [ ] 验证 ISR R2 缓存写入：`npx wrangler r2 object list skillnav-cache`
