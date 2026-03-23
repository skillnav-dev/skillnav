# HANDOFF
<!-- /checkpoint at 2026-03-23 -->

## Session Tasks
- [x] CI 诊断：Daily Brief 时区 bug（UTC→CST）+ beehiiv 403 → 首页 JSON 解析
- [x] README.md 重写 + VaultX 原创文章撰写入库（editorial, published）
- [x] a16z 文章翻译入库（editorial）+ a16z RSS 源加入采集管线（第 15 源）
- [x] Follow Builders 项目分析 + 小红书视频 Whisper 转录
- [x] 战略反思：编辑品牌 + Skill 分发 + 渐进披露
- [x] Content Strategy V3 spec 完成（`docs/specs/content-strategy-v3.md`）
- [x] Daily Brief 积压处理：3/19 hidden, 3/20+3/21 published, 3/23 生成+published
- [x] 三层内容质量体系设计 + 实现 + 验证（L0 源配置 + L1 规则 + L2 LLM 评分）
- [x] Lobsters gonzo 文章 hidden，记录质量自动化需求
- [ ] SkillNav Skill MVP 规划 + 实现
- [ ] 感知源扩展：Follow Builders 的 builder X list + 播客纳入信号层
- [ ] 社交媒体首发（X @skillnav_dev、掘金、V2EX）— Sprint 任务一直未做
- [ ] 工具存活检查脚本（Skills/MCP GitHub 状态、stars 趋势、过期标记）
- [ ] 质量体系观察一周后校准 prompt（对比 LLM 建议与人工修正率）

## Key Files
- `scripts/lib/quality.mjs` — L2 LLM 评分模块（audience_fit + credibility）
- `scripts/sync-articles.mjs` — 集成三层质量门控 + a16z 源 + Anthropic 白名单
- `docs/specs/content-strategy-v3.md` — 编辑漏斗 + 渐进披露 + Skill 分发（draft）
- `docs/adr/004-content-quality-system.md` — 三层质量体系决策记录

## Decisions Needed
- Content Strategy V3 是否 approve（当前 draft）
- SkillNav Skill MVP 功能范围
- 社交媒体人格定位
