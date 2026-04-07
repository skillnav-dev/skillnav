# HANDOFF
<!-- /checkpoint at 2026-04-07 -->

## Active Plan
论文雷达 — `docs/plans/paper-radar.md`（3/3, done）

## Session Tasks
- [x] auto-translate-radar.mjs + launchd 22:00 定时
- [x] LaTeX 公式渲染修复（normalizeMath fenced 格式）
- [x] Citation key 清理（bare + bracketed 两种格式）
- [x] References 段落截断（heading + bold 格式）
- [x] `/papers` 论文独立页面 + 导航入口
- [x] 13 篇历史论文审计 + 7 篇重翻（cite/refs/crlf）
- [x] paper-radar launchd 每天 06:50 定时
- [x] 今日雷达 10 篇全部翻译发布（共 22 篇论文上线）
- [ ] 申请 S2 API Key → `.env.local` 加 `S2_API_KEY`
- [ ] 验证 ISR R2 缓存 → `npx wrangler r2 object list skillnav-cache`

## Key Files
- `src/app/papers/page.tsx` — 论文列表页（ISR 5min）
- `src/components/articles/article-content.tsx` — normalizeMath() 公式渲染修复
- `scripts/auto-translate-radar.mjs` — 扫描雷达 [x] → 去重 → 翻译
- `scripts/translate-paper.mjs` — citation/refs 清理 + \r\n sanitize
- `scripts/com.skillnav.paper-radar.plist` — 06:50 定时雷达

## Next Actions
- [ ] 申请 S2 API Key：https://www.semanticscholar.org/product/api
- [ ] 验证 ISR R2 缓存写入：`npx wrangler r2 object list skillnav-cache`
- [ ] 4/23 论文频道 Go/Hold/Kill 评估
