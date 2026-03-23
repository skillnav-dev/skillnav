# ADR-005: LLM-First Editorial Funnel

Status: accepted
Date: 2026-03-23
Supersedes: content-signals-spec.md (signal parsing layer)

## Context

The signal layer (`scrape-signals.mjs`) was designed to scrape 5 AI newsletters, extract structured items via regex, calculate heat scores by URL cross-referencing, and match against our article pipeline. In practice:

- `summaries` field was empty 73-100% of the time (only TLDR provided summaries)
- `in_our_pipeline` matching returned 0% (URL exact-match logic failed)
- Titles contained garbage data (UUIDs, domain names, truncated anchor text)
- TLDR (the best source) failed 2/3 recent days

Root cause: regex was doing a job that requires semantic understanding.

## Decision

Replace the regex parsing + heat scoring layer with a single LLM call that reads raw newsletter text directly. The LLM performs cross-referencing, editorial judgment, and brief generation in one pass.

**Pipeline change:**
```
Before: newsletters → regex parse → signals.json → generate-daily → LLM → brief
After:  newsletters → extract text → generate-daily → LLM (with full text) → brief
```

**Format change:**
```
Before: 🚀 头条 + 🛠️ 工具与发布 + ⚡ 快讯 (flat three sections)
After:  📌 今日头条 (0-1) + 📋 值得关注 (3-5) (editorial hierarchy)
```

## Consequences

- Positive: Signal quality dramatically improved (LLM understands semantics, not regex patterns)
- Positive: 385 fewer lines of code (-32%)
- Positive: Uncovered hot topics now included as signal items (slug: "signal-N")
- Positive: Headline is null when nothing qualifies — no forced filler
- Negative: Slightly higher LLM token cost (~2.7 yuan/month vs ~0.5 yuan/month)
- Negative: Old `data/daily-signals/` format is abandoned (kept for historical reference)

## Files Changed

- `scripts/scrape-signals.mjs` — rewritten (fetch + text extraction only)
- `scripts/generate-daily.mjs` — new LLM prompt + V3 format
- Output: `data/daily-newsletters/YYYY-MM-DD.json` (replaces `data/daily-signals/`)
