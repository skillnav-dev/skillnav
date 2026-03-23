# ADR-004: 三层内容质量体系

Date: 2026-03-23
Status: accepted
Tags: content, quality, automation

## Context

311 篇文章中 37 篇被 hidden（12%），人工审核每批 30+ 篇耗时 20-30 分钟。其中 62%（23/37）的质量问题来自 Anthropic 源的 `relevanceFilter: null` 配置，大量公关稿/人事/政策内容混入。

## Decision

采用三层递进方案，按成本递增顺序过滤：

### Layer 0: 源头治理（零成本）
- Anthropic 源从全量接收改为关键词白名单过滤
- 验证：27 published 零误杀，17/23 hidden 正确拦截（74%）
- 原则：能用配置解决的不用 AI

### Layer 1: 入库规则（零 API 成本）
- content_zh < 200 字 → draft（翻译失败检测）
- 验证：243 published 零误判
- 原则：能用规则解决的不用 LLM

### Layer 2: LLM 评分（仅处理灰区）
- 两个维度：audience_fit（受众匹配度）+ credibility（内容可信度），各 0-10
- 决策：两项均 ≥7 → publish，任一 <4 → hidden，其余 → draft（人工终审）
- 验证：20 篇样本 95% 准确率，零误杀
- 原则：AI 做初筛建议，人做最终判断

## Alternatives Considered

### 三维度评分（加翻译质量维度）
拒绝。翻译用的就是同一个 LLM，自己给自己打分没意义。翻译质量靠换更好的 prompt 和模型解决。

### 全自动（无人工环节）
拒绝。LLM 对"正经但不相关"的文章过于宽容（测试中 hidden 文章多数被判为 draft 而非 hidden）。人在回路是品牌保障。

### 单一 LLM 评分（不分层）
拒绝。62% 的问题用配置就能解决，每篇都调 LLM 浪费且慢。分层后 LLM 只处理每天 3-6 篇灰区文章。

## Consequences

- 人工审核量从 30+/批 降到 5-8/批
- 垃圾漏入率从 12% 预期降到 <3%
- 每月 LLM 额外成本 ~$0.15
- 系统只降级不升级（publish→draft、draft→hidden），永不自动把 hidden 改为 publish
