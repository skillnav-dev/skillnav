# HANDOFF
<!-- /checkpoint at 2026-03-16 -->

## Active Plan
Skills & MCP 内容质量复审 — `docs/plans/content-quality-review.md`（Phase 3 partial）

## Session Tasks
- [x] Fix `llm.mjs` backtick syntax error (line 292)
- [x] Hide 7,087 ClawHub skills (published → hidden)
- [x] Hide 138 empty-content skills (published → draft)
- [x] Hide 669 no-description B-tier MCP servers
- [x] Clean 2 skills with template variable residue
- [x] Rewrite SYSTEM_PROMPT with fidelity guardrails (anti-clickbait, anti-hallucination)
- [x] Add `--retranslate-published` to sync-articles.mjs
- [x] Add `--tier` flag to backfill-mcp-description-zh.mjs
- [x] Run Codex translation quality audit → `audit-data/translation-quality-report.md`
- [ ] B-tier description_zh backfill (3,521 servers, GPT proxy, ~250/3521 done)
- [ ] Published articles retranslation (88 articles, DeepSeek, just started)
- [ ] Publish 106 high-score draft articles (`govern-articles --apply`)
- [ ] Build terminology glossary (Codex report recommendation)
- [ ] S/A-tier MCP tools backfill (needs new approach — Smithery can't find mcp-registry sources)

## Key Files
- `scripts/lib/llm.mjs` — Rewritten SYSTEM_PROMPT with fidelity rules
- `scripts/sync-articles.mjs` — Added `--retranslate-published` mode
- `scripts/backfill-mcp-description-zh.mjs` — Added `--tier` parameter
- `audit-data/translation-quality-report.md` — Codex quality audit report
- `docs/troubleshooting/2026-03-16-content-quality-audit.md` — Full audit record

## Decisions Needed
- Whether to batch-publish 106 high-score draft articles via `govern-articles --apply`
- Strategy for extracting tools data from mcp-registry/manual source servers (not on Smithery)
