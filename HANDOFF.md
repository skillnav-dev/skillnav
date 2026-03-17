# HANDOFF
<!-- /checkpoint at 2026-03-17 -->

## Active Plan
学习中心 — `docs/plans/glossary-learning-center.md`（5/5, P1 done, P2 pending）

## Session Tasks
- [x] 周刊质量评审：按主题分组 + 必读标记需求确认
- [x] `generate-weekly.mjs` 改造：`generateEditorialPlan` 替代 `generateEditorsNote`，LLM 返回 JSON（editorsNote + topicGroups + mustReads）
- [x] fallback 策略：LLM 失败时按来源分组 + relevance_score 前 3 为必读
- [x] weekly-1 用 DeepSeek 重新生成并发布（5 主题分组 + 3 必读）
- [ ] 翻译 prompt 加编者按：`scripts/lib/llm.mjs` JSON 输出新增 `editorNoteZh`
- [ ] 社交分发启动：X @skillnav_dev 发首条推文
- [ ] 学习中心 P2 选题确认（从 glossary.json 选 9-12 个概念）

## Key Files
- `scripts/generate-weekly.mjs` — 周刊生成脚本（editorial plan 模式）

## Decisions Needed
- 编者按策略：LLM 自动生成 vs 主编手写 vs 混合（LLM 草稿 + 主编润色）
- CI 周刊生成是否切换默认 provider 为 DeepSeek（当前 GPT 代理本地超时频繁）
