---
title: SkillNav 全面评审计划
date: 2026-05-02
status: in-progress
type: review-plan
---

# SkillNav 全面评审计划

## 目标

对项目进行 10 维度全面评审，输出诊断报告（不修复）。

## 模式

- **深度**：纯报告，不动代码
- **并行**：多 Agent 并行调研，按维度切分
- **交付物**：`docs/reviews/2026-05-02-comprehensive-review.md`（分维度打分 + 红点清单 + P0/P1/P2 优先级）

## 多 Agent 任务分配表

> 每个 Agent **只读**，禁止 Edit/Write。输出格式统一：维度评分（0-10）+ 红点清单（每条含 file:line + 严重度 P0/P1/P2 + 一句话修复建议）+ 不超过 600 字总结。

| # | Agent | 聚焦维度 | 输出上限 | 排除项 |
|---|-------|---------|---------|--------|
| **A1** | code-quality | TS 严格模式、lint warnings、死代码、单文件 >300 行、命名一致性、any 滥用 | 600 字 + 红点表 | 不评内容流水线脚本，不评 docs |
| **A2** | architecture | 调用方向合规（page→components→data→lib）、模块边界、`.claude/rules/architecture.md` 实际符合度、循环依赖 | 600 字 + 红点表 | 不评单文件代码质量（A1 负责） |
| **A3** | content-pipeline | scripts/ 下 sync-articles / generate-daily / paper-radar / scrape-signals 的健壮性、错误处理、幂等性、circuit breaker 真实有效性 | 800 字 + 红点表 | 不评 src/ 下前端代码 |
| **A4** | database | Supabase schema 索引覆盖、PGroonga 实际使用、查询 N+1、RLS 策略、慢查询风险点 | 600 字 + 红点表 | 不评 ORM 选型 |
| **A5** | frontend-ux | 页面性能（LCP/FID 风险）、移动端、SEO（sitemap/robots/JSON-LD）、404/500 边界、a11y、关键页面截图 | 800 字 + 红点表 | 不评样式美学（design-review 范畴） |
| **A6** | security | 密钥泄露扫描（git history + 当前文件）、依赖供应链（npm audit）、admin 路由鉴权、API 路由滥用面、输入校验 | 600 字 + 红点表 | 不做 pentest，不评业务逻辑安全 |
| **A7** | docs-system | docs/README 索引完整性、features.md 与现实同步、ADR 覆盖度、archive 隔离、孤儿文档、断链 | 500 字 + 红点表 | 不评文档措辞质量 |
| **A8** | ci-monitoring | GitHub workflows 健康（近 30 天通过率）、failover-check 实际触发、Better Stack 配置、/api/health 端点完整性 | 600 字 + 红点表 | 不评 CI 性能优化 |
| **A9** | strategic-gap | 现状 vs `docs/plans/` 中各 plan（content-strategy-v3、paper-channel-v3、perception-trending、skill-v2、tool-intelligence）的 gap，每个 plan 输出：完成度 / 偏移项 / Go-Hold-Kill 建议 | 1000 字 + 表格 | 不评代码实现细节 |
| **A10** | dx | scripts 可发现性、错误信息友好度、`.claude/rules/commands.md` 准确性、本地复跑成本、新手入门曲线 | 500 字 + 红点表 | 不评 IDE 配置 |

## 执行步骤

1. **Phase 0**：用户确认任务分配表 ← 当前
2. **Phase A 自动化体检**（并行）：A1 / A2 / A4 / A6 / A7 / A8 / A10 同时启动（7 个 Agent）
3. **Phase B 深度调研**（并行）：A3 / A5 / A9 同时启动（3 个 Agent，更长输出）
4. **Phase C 综合**：主 Claude 整合 10 份报告 → `docs/reviews/2026-05-02-comprehensive-review.md`

## 报告格式

```markdown
# SkillNav 全面评审报告（2026-05-02）

## 总分 X/10

## 维度雷达
| 维度 | 分数 | 关键红点数 |
|------|------|----------|
| 代码质量 | X | P0:n / P1:n / P2:n |
...

## P0 红点（必须立即修复）
...

## P1 红点（本周修复）
...

## P2 红点（机会主义修复）
...

## 战略 Gap（plan vs 现状）
...

## 行动建议（按 ROI 排序）
...
```

## 风险

- 每个 Agent 独立运行不共享上下文，可能出现重复发现 → 主 Claude 在 Phase C 去重
- A6 安全扫描可能扫到误报 → 报告中标注「需人工确认」
- A9 战略 gap 评估主观性强 → 多视角并不在本次计划，单 Agent 给出建议即可

## 时间预估

- Phase A: ~15 min（7 Agent 并行）
- Phase B: ~25 min（3 Agent 并行）
- Phase C: ~10 min（综合）
- 总计: ~50 min
