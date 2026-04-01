# HANDOFF
<!-- /checkpoint at 2026-04-01 -->

## Active Plan
Skill v2 — `docs/plans/skill-v2-proposal.md`（7/9, 78%）

## Session Tasks
- [x] 扩展 translate-paper.mjs 支持 `--local <pdf> --arxiv-id <id>`
- [x] 修复 5 个 bug（arXiv https、pdf-parse v2、fetch try-catch、Unicode、图片丢失）
- [x] 4-agent 调研论文翻译最佳实践 → `docs/research/2026-04-01-arxiv-paper-translation.md`
- [x] 改进 ar5iv 解析保留图片/公式（`toMarkdown()`）+ 翻译 prompt
- [x] 翻译 5 篇具身智能论文，OpenVLA 改进版效果好
- [ ] 剩余 4 篇用改进版重翻 → `node scripts/translate-paper.mjs <arxiv-id>`

## Key Files
- `scripts/translate-paper.mjs` — 论文翻译（本次：本地 PDF、ar5iv 图片、新 prompt）
- `docs/research/2026-04-01-arxiv-paper-translation.md` — 翻译调研报告
- `docs/troubleshooting/2026-04-01-translate-paper-bugs.md` — 5 个 bug 记录

## Next Actions
- [ ] 重翻 4 篇 PDF 版本（RT-2/VideoGen/NavFoM/3DLLM-Mem），先删旧记录
- [ ] 评估 LaTeX 源码提取（Phase 2）和 Claude Sonnet 翻译（Phase 3）
- [ ] Skill v2 W2: 掘金文章 + X 公告推文
- [ ] MCP trending 第二次快照 `node scripts/refresh-tool-metadata.mjs --snapshot`
