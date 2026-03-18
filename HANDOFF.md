# HANDOFF
<!-- /checkpoint at 2026-03-18 -->

## Active Plan
学习中心 — `docs/plans/glossary-learning-center.md`（8/9, P2 content done）

## Session Tasks
- [x] 项目全面健康评估（功能/SEO/内容管道/UI 审计验证）
- [x] SEO 修复：guides/weekly/about 页 canonical URL + guides BreadcrumbJsonLd
- [x] 根级 error.tsx 错误边界
- [x] MCP 详情页结构化模板（什么是/如何使用/核心功能/FAQ 可见化）
- [ ] 翻译文章加编辑点评（管线 SYSTEM_PROMPT 改造）
- [ ] 社交分发启动（X @skillnav_dev 首推）
- [ ] 学习中心 P2 剩余：MCP/Skills 自动关联、索引页搜索

## Key Files
- `src/components/mcp/mcp-content-sections.tsx` — 结构化区块组件（McpWhatIs/McpHowToUse/McpToolsList）
- `src/components/mcp/mcp-faq.tsx` — 可见 FAQ 组件
- `src/app/mcp/[slug]/page.tsx` — 重构后 281 行
- `src/app/error.tsx` — 根级 500 错误页
- `docs/research/2026-03-17-content-strategy-review.md` — 内容战略评审（Q2 优先级）
