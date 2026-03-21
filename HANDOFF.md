# HANDOFF
<!-- /checkpoint at 2026-03-21 -->

## Active Plan
30-Day Growth Sprint — Week 1（战略方向调整中，见 `docs/research/2026-03-21-skill-distribution-strategy.md`）

## Session Tasks
- [x] CI 诊断：Daily Brief 时区 bug 定位 + 修复（UTC → CST）
- [x] CI 诊断：Superhuman/Neuron beehiiv 403 → 首页 JSON 解析 fallback
- [x] 手动跑 3/21 信号抓取 + Daily Brief 生成（draft 入库）
- [x] README.md 重写（项目介绍 + 技术栈 + 收录内容）
- [x] VaultX 原创文章撰写 + 入库（editorial，已 published 待预览）
- [x] Follow Builders 项目分析 + 视频转录（Whisper）
- [x] 战略反思：Skill 分发 + 编辑品牌定位
- [ ] VaultX 文章最终审核 + 调整
- [ ] SkillNav Skill MVP 规划 + 实现
- [ ] 内容质量自动化脚本（`scripts/audit-quality.mjs`）
- [ ] 感知源扩展：Follow Builders 的 builder list + 播客纳入信号层
- [ ] 社交媒体首发（X @skillnav_dev、掘金、V2EX）
- [ ] 3/20 Daily Brief publish + 3/21 brief approve

## Key Files
- `scripts/scrape-signals.mjs` — 修复：CST 时区 + beehiiv 通用首页抓取
- `scripts/generate-daily.mjs` — 修复：CST 时区
- `scripts/insert-vaultx-article.mjs` — VaultX 原创文章入库脚本（一次性）
- `docs/research/2026-03-21-follow-builders-analysis.md` — Follow Builders 分析
- `docs/research/2026-03-21-skill-distribution-strategy.md` — Skill 分发策略
- `docs/troubleshooting/2026-03-21-daily-brief-timezone-and-beehiiv.md` — 时区 + 403 修复

## Decisions Needed
- SkillNav Skill MVP 的功能范围和优先级
- 原创内容节奏：每周几篇、什么角度
- 社交媒体人格定位：技术向 vs 产品向 vs 混合
