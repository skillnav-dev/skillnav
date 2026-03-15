# SkillNav 知识索引

项目文档的统一导航入口。按三层分类组织。

## 契约层（定义"建什么、怎么建"）

| 文档 | 说明 | 状态 |
|------|------|------|
| [product-spec.md](product-spec.md) | 产品结构契约：信息架构、用户旅程、状态权限、埋点 | 生效中 |
| [design-spec.md](design-spec.md) | 视觉设计契约：Token、组件、交互模式、组合模式 | 生效中 |
| [specs/content-strategy-v2.md](specs/content-strategy-v2.md) | 内容战略：从翻译聚合→编辑策展品牌 | 已确认 |
| [specs/content-pipeline-spec.md](specs/content-pipeline-spec.md) | 内容管线：采集标准、内容类型、源准入 | 生效中 |
| [specs/content-operations-spec.md](specs/content-operations-spec.md) | 内容运营：端到端时序编排 | 生效中（Phase 1） |
| [specs/content-distribution-spec.md](specs/content-distribution-spec.md) | 分发规范：一鱼多吃模型 | 待审批 |
| [specs/ui-ux-redesign-v1.md](specs/ui-ux-redesign-v1.md) | UX 诊断报告 + 改进方案 | 待审批 |

## 状态层（反映当前状态，持续更新）

| 文档 | 说明 |
|------|------|
| [features.md](features.md) | 功能全景清单 |
| [approved-deps.md](approved-deps.md) | 依赖白名单 |

## 知识层（持续累积，可检索复用）

### Plans（技术方案 & 执行计划）

| 文档 | 状态 | 说明 |
|------|------|------|
| [plans/content-quality-system.md](plans/content-quality-system.md) | approved | 统一分类 + 数据质量修复 |
| [plans/content-quality-review.md](plans/content-quality-review.md) | pending | 质量复审：空值率分析 |
| [plans/s-tier-editorial-picks.md](plans/s-tier-editorial-picks.md) | approved | S-tier MCP 精选方案 |
| [plans/content-visibility-strategy.md](plans/content-visibility-strategy.md) | approved | 双语策略 + llms.txt |
| [plans/tool-intelligence-pipeline.md](plans/tool-intelligence-pipeline.md) | draft | 内容操作系统 v2 |
| [plans/content-sources-audit.md](plans/content-sources-audit.md) | done | 内容源终审（10 个 RSS 源确定） |
| [plans/automation-tasks.md](plans/automation-tasks.md) | draft | CI 自动化任务体系 |
| [plans/weekly-pipeline.md](plans/weekly-pipeline.md) | draft | 周刊生成管线 |
| [plans/github-nav-design.md](plans/github-nav-design.md) | draft | GitHub 开源导航页 |

### ADR（架构决策记录）

| 编号 | 决策 | 状态 |
|------|------|------|
| [001](adr/001-mcp-directory-strategy.md) | MCP 三层目录策略 | Accepted |

### Research（技术调研）

| 文档 | 日期 | 领域 |
|------|------|------|
| [benchmark-design-analysis](research/2026-03-08-benchmark-design-analysis.md) | 2026-03-08 | 设计 |
| [competitive-content-analysis](research/2026-03-08-competitive-content-analysis.md) | 2026-03-08 | 竞品 |
| [competitive-ux-analysis](research/2026-03-08-competitive-ux-analysis.md) | 2026-03-08 | 竞品 |
| [competitor-design-systems](research/2026-03-08-competitor-design-systems.md) | 2026-03-08 | 设计 |
| [design-system-best-practices](research/2026-03-08-design-system-best-practices.md) | 2026-03-08 | 设计 |
| [internal-content-audit](research/2026-03-08-internal-content-audit.md) | 2026-03-08 | 审计 |
| [internal-ux-audit](research/2026-03-08-internal-ux-audit.md) | 2026-03-08 | 审计 |
| [market-trends-2026](research/2026-03-08-market-trends-2026.md) | 2026-03-08 | 市场 |
| [pipeline-technical-assessment](research/2026-03-08-pipeline-technical-assessment.md) | 2026-03-08 | 技术 |
| [skillnav-design-audit](research/2026-03-08-skillnav-design-audit.md) | 2026-03-08 | 审计 |
| [user-journey-ia-analysis](research/2026-03-08-user-journey-ia-analysis.md) | 2026-03-08 | UX |
| [competitive-distribution](research/distribution/2026-03-09-competitive-distribution.md) | 2026-03-09 | 分发 |
| [wechat-official-account](research/distribution/2026-03-09-wechat-official-account.md) | 2026-03-09 | 分发 |
| [x-twitter](research/distribution/2026-03-09-x-twitter.md) | 2026-03-09 | 分发 |
| [xiaohongshu](research/distribution/2026-03-09-xiaohongshu.md) | 2026-03-09 | 分发 |
| [content-ops-best-practices](research/2026-03-10-content-ops-best-practices.md) | 2026-03-10 | 运营 |
| [content-ops-ci-failure-analysis](research/2026-03-10-content-ops-ci-failure-analysis.md) | 2026-03-10 | 运营 |
| [content-ops-rss-timing](research/2026-03-10-content-ops-rss-timing.md) | 2026-03-10 | 运营 |
| [content-editing-competitor-models](research/2026-03-11-content-editing-competitor-models.md) | 2026-03-11 | 编辑 |
| [content-editing-draft-inventory](research/2026-03-11-content-editing-draft-inventory.md) | 2026-03-11 | 编辑 |
| [content-editing-seo-demand](research/2026-03-11-content-editing-seo-demand.md) | 2026-03-11 | 编辑 |
| [content-editing-standards-gap](research/2026-03-11-content-editing-standards-gap.md) | 2026-03-11 | 编辑 |

### Troubleshooting（踩坑知识库）

| 文档 | 日期 | 标签 |
|------|------|------|
| [clawhub-sync-issues](troubleshooting/2026-03-03-clawhub-sync-issues.md) | 2026-03-03 | supabase, sync |

## 归档

`archive/` 存放被取代的历史文档，AI 不主动加载。

- `content-pipeline.md` — 旧内容管线方案（被 specs/content-pipeline-spec.md 取代）
- `content-governance.md` — 旧内容治理方案（被 specs/content-pipeline-spec.md 取代）
- `design-system-v1.md` — 旧设计规范（被 design-spec.md 取代）
- `handoff-current.md` — 早期交接文档
- `github/` — GitHub 项目列表参考资料
