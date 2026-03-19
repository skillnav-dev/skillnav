# HANDOFF
<!-- /checkpoint at 2026-03-19 -->

## Active Plans
- daily-brief-pipeline — `docs/plans/daily-brief-pipeline.md`（Phase 1 done, Phase 2 planned）
- 产品转型 "目录→指南" — `docs/adr/002-product-direction-guide-over-directory.md`

## Session Tasks
- [x] Daily Brief Pipeline Phase 1: 引擎+3渠道+Admin+API+DB migration+管线验证
- [x] Vibe Physics 封面文章样板（翻译修复 + 编辑按语 + editorial tier + 发布）
- [x] 三层内容架构决策（ADR-003: flagship/standard/not-worth）
- [x] 封面文章候选名单（5 篇已选定）
- [ ] 逐篇审读候选封面文章（反模式/工程模式/20亿次/多智能体/子智能体）
- [ ] Daily Brief Phase 2: 小红书/知乎/邮件/OpenClaw Skill 适配器
- [ ] Phase 2: 做厚 S-tier 详情页（66 MCP + 17 Skills）
- [ ] Phase 3: 编辑原创（"最佳 X" 指南 5-10 篇）
- [ ] Phase 4: 分发节奏（X 周 3 条 + V2EX/掘金）

## Pending User Actions
- [ ] 配置 crontab（sync 6am → generate 7am → 人工审核 → publish）
- [ ] GSC 提交 sitemap
- [ ] 发置顶推文 + 首条推文
- [ ] X API Free tier 额度激活

## Key Files
- `docs/adr/003-editorial-content-tiers.md` — 封面文章编辑流程定义
- `scripts/generate-daily.mjs` — 每日简报生成
- `scripts/publish-daily.mjs` — 简报多渠道发布
- `src/app/admin/daily/` — Admin Dashboard
- Vibe Physics article ID: `7a0d9e18-175a-4528-a012-29795d2fe158`
