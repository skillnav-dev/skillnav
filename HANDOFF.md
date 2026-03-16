# HANDOFF
<!-- /checkpoint at 2026-03-16 -->

## Active Plan
Skills & MCP 内容质量复审 — `docs/plans/content-quality-review.md`（Phase 3 partial）

## Session Tasks
- [x] Published articles retranslation started (88 articles, DeepSeek, ~32/88 processed, task bodm4p03w still running)
- [ ] Check retranslation results — `tail -20 /tmp/claude-501/.../tasks/bodm4p03w.output` or re-run `LLM_PROVIDER=deepseek node scripts/sync-articles.mjs --retranslate-published`
- [ ] B-tier description_zh backfill (3,521 servers, ~250/3521 done) — `LLM_PROVIDER=deepseek node scripts/backfill-mcp-description-zh.mjs --tier B --apply`
- [ ] Publish 106 high-score draft articles (`node scripts/govern-articles.mjs --apply`)
- [ ] Build terminology glossary (Codex report recommendation)
- [ ] S/A-tier MCP tools backfill (needs new approach — Smithery can't find mcp-registry sources)

## Key Files
- `scripts/lib/llm.mjs` — SYSTEM_PROMPT with fidelity rules (rewritten last session)
- `scripts/sync-articles.mjs` — `--retranslate-published` mode
- `scripts/backfill-mcp-description-zh.mjs` — `--tier` parameter
- `audit-data/translation-quality-report.md` — Codex quality audit report

## Decisions Needed
- Whether to batch-publish 106 high-score draft articles via `govern-articles --apply`
- Strategy for extracting tools data from mcp-registry/manual source servers (not on Smithery)
