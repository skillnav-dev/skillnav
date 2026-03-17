# HANDOFF
<!-- /checkpoint at 2026-03-17 -->

## Active Plan
学习中心 — `docs/plans/glossary-learning-center.md`（2/5, P1 进行中）

## Session Tasks
- [x] 审批学习中心方案（已批准，微调：内容用 TS 导出而非 MDX）
- [x] 写 3 个样板概念页内容（Agent, MCP, RAG）
- [x] 搭建 `/learn` 索引 + `/learn/[slug]` 详情页骨架
- [x] DefinedTerm JSON-LD + 导航/footer 链接
- [x] 部署到 Cloudflare（修复 fs 兼容 + seoTitle 冗余）
- [ ] P1-3: 实现 2 种图解组件（对比图 + 架构图）
- [ ] P1-4: SEO 基础（sitemap 包含 /learn、内链到 articles/mcp）
- [ ] 决定 `rag-tutorial.html` 用途（替换 RAG 页/设计参考/独立指南）
- [ ] 检查 88 篇已发布文章重翻结果
- [ ] B-tier MCP description_zh 回填（~250/3521）
- [ ] 发布 106 篇高分草稿文章（`govern-articles --apply`）

## Key Files
- `src/data/learn.ts` — 概念元数据（3 条）
- `src/content/learn/what-is-{agent,mcp,rag}.ts` — 内容（TS 导出字符串）
- `src/app/learn/page.tsx` — 索引页
- `src/app/learn/[slug]/page.tsx` — 详情页
- `~/Downloads/rag-tutorial.html` — 用户做的 RAG 深度指南（6 章节+交互 demo）

## Decisions Needed
- `rag-tutorial.html` 如何集成（替换现有 RAG 页 / 独立深度指南 / 仅设计参考）
