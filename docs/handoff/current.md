# Handoff — Article Detail Page Quality Fixes

## Objective
Fix quality issues on article detail pages: wasteful DB query, dead footer links, poor source URL display.

## Current State
### Completed
- **Related articles query optimized**: `getArticles()` (all ~273) → `getArticles({ limit: 3, category })`, fetches only 3 same-category articles from DB
- **Footer dead links removed**: cleared 5 non-existent page links (/submit, /guide, /docs, /changelog, Discord #) and empty "resources" group
- **Source URL display improved**: raw URL → "查看原文 ↗" inline link text
- **All commits pushed** to `origin/main`, CI/CD deployed

### In Progress
- Nothing — all work complete and deployed

## Next Actions
1. **Fix article content truncation**: `scripts/sync-articles.mjs` — add chunked translation for long articles (e.g. podcast transcripts) that currently get `[……后续内容截断……]` from LLM
2. **Add cover image fallback**: `src/app/articles/[slug]/page.tsx` — add placeholder/skeleton when external CDN images (substackcdn.com etc.) fail to load for China users
3. **Write 1 original article**: "2026年值得装的10个Claude Code Skills实测" — pick 10 skills, write review, link to detail pages
4. **Distribute first article**: post on 知乎, 掘金, 即刻, Twitter/X
5. **Setup Giscus comments**: create `skillnav-dev/discussions` public repo, configure `src/components/skills/skill-comments.tsx:GISCUS_CONFIG`

## Risks & Decisions
- **Content truncation** (P2): long-form articles (podcast transcripts, deep dives) are truncated during LLM translation — need chunked translation logic in sync script
- **External CDN images**: cover images from substackcdn.com / arstechnica.net may load slowly or fail for China users — no fallback currently
- **Nav "关于" link**: `/about` page doesn't exist yet but is in header nav (`src/lib/constants.ts:navItems`)

## Verification
- `npm run build` — 0 errors, 649 pages (verified 2026-03-05)
- Production: https://skillnav.dev/articles/every-agent-needs-a-box-aaron-levie-box — verify "查看原文 ↗" link and related articles section

## Key Commits (this session)
- `8c319f1` — perf(articles): optimize related articles query with category filter and limit
- `39cdb78` — fix(ui): remove dead footer links and improve article source URL display

## Modified Files
- `src/app/articles/[slug]/page.tsx` — related articles query + source URL display
- `src/lib/constants.ts` — footer links cleanup
