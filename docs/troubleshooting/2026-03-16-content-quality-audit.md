# Content Quality Audit — 2026-03-16
Tags: data-quality, skills, mcp, articles, translation

## Problems Found

### 1. ClawHub skills never deleted (P0)
- **Symptom**: Website showed 7,393 published skills instead of ~300
- **Root cause**: Previous "delete ClawHub" operation never executed or was reversed by a sync. 7,087 clawhub-sourced skills remained `status=published`
- **Fix**: Set all 7,087 clawhub skills to `status=hidden`
- **Verification**: Published count dropped to 168

### 2. Empty content skills published (P0)
- **Symptom**: 40% of published skills (138) had zero content — blank detail pages
- **Root cause**: Curated repo sync pulled metadata but not README content
- **Fix**: Set 138 empty-content skills to `status=draft`
- **Verification**: Published count dropped to 168 (all with content)

### 3. llm.mjs syntax error (P0)
- **Symptom**: `govern-articles.mjs --audit` crashed with SyntaxError at line 292
- **Root cause**: Unescaped backticks ``` inside a template literal (SYSTEM_PROMPT)
- **Fix**: Escaped as \`\`\`
- **Line**: `scripts/lib/llm.mjs:292`

### 4. B-tier MCP 100% missing description_zh (P1)
- **Symptom**: 4,190 B-tier servers had no Chinese description
- **Fix**: `backfill-mcp-description-zh.mjs --tier B --apply` (GPT proxy, batch of 10)
- **Also**: 669 B-tier with no description at all → `status=hidden`

### 5. Translation over-editorialization (P1)
- **Symptom**: Codex audit scored title accuracy 3.57/5, translation accuracy 3.63/5
- **Root cause**: SYSTEM_PROMPT encouraged "editorial adaptation" and "compelling rewriting" with no fidelity constraints
- **Fix**: Rewrote SYSTEM_PROMPT with explicit fidelity rules: no added conclusions, no scope inflation, no clickbait patterns, preserve original voice/genre
- **A/B test confirmed**: New prompt produces faithful, restrained translations

## Data Changes Summary

| Action | Count | Method |
|--------|-------|--------|
| ClawHub skills → hidden | 7,087 | DB update |
| Empty skills → draft | 138 | DB update |
| No-description MCP → hidden | 669 | DB update |
| Template vars cleaned | 2 | DB update |
| B-tier description_zh backfill | 3,521 (in progress) | `backfill-mcp-description-zh.mjs --tier B` |
| Published articles retranslation | 88 (in progress) | `sync-articles.mjs --retranslate-published` |

## Lessons

- **Verify destructive operations actually executed** — "deleted 7,159" was recorded in memory but never happened in DB
- **Audit published content regularly** — empty detail pages erode trust
- **Translation prompts need fidelity guardrails** — without explicit constraints, LLMs default to creative rewriting
- **Codex is effective for content quality audits** — produced actionable report in minutes
