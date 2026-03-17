# HANDOFF
<!-- /checkpoint at 2026-03-17 -->

## Active Plan
学习中心方案 — `docs/plans/glossary-learning-center.md`（待审批）

## Session Tasks
- [x] Build centralized terminology glossary (`scripts/lib/glossary.json`, 42 terms)
- [x] Integrate glossary into translation pipeline SYSTEM_PROMPT (`scripts/lib/llm.mjs`)
- [x] Competitive research for glossary/learning center products
- [x] Draft learning center plan (`docs/plans/glossary-learning-center.md`)
- [ ] User to approve/revise learning center plan
- [ ] Write 3 sample concept pages (Agent / MCP / RAG) for style validation
- [ ] Build `/learn` index + `/learn/[slug]` detail page skeleton
- [ ] Check retranslation results (88 published articles, started last session)
- [ ] B-tier MCP description_zh backfill (~250/3521 done)
- [ ] Publish 106 high-score draft articles (`govern-articles --apply`)

## Key Files
- `scripts/lib/glossary.json` — centralized term glossary (pipeline use)
- `scripts/lib/llm.mjs` — SYSTEM_PROMPT now imports glossary dynamically
- `docs/plans/glossary-learning-center.md` — full learning center plan
- `docs/research/2026-03-17-glossary-competitive-research.md` — competitive analysis

## Decisions Needed
- Approve learning center plan (path, scope, P1 terms)
- Strategy for extracting tools data from mcp-registry source servers
