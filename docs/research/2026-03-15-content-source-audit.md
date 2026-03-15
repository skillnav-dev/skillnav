# Content Source Audit — 2026-03-15

Tags: content-pipeline, rss, sanity, data-source

## Context

Daily article output was ~2.7/day, with thenewstack accounting for 52% of volume. Anthropic source used a third-party RSS mirror (taobojlen/anthropic-rss-feed) with only 13 posts vs 293+ on the official site.

## Key Finding: Anthropic Sanity CMS API

Anthropic's website runs on Next.js + Sanity CMS. The Sanity API is publicly accessible:

- **Project ID**: `4zrzovbb`
- **Dataset**: `website`
- **Content type**: `post`
- **Date field**: `_createdAt` (publishedAt is null)
- **Query**: `*[_type=="post"] | order(_createdAt desc) [0..49] { title, slug, _createdAt }`
- **URL pattern**: `https://www.anthropic.com/news/{slug.current}`

## Source Audit Results

### Added (4 sources)

| Source | Feed URL | 30d Volume | Filter |
|--------|----------|------------|--------|
| Google AI Blog | `blog.google/technology/ai/rss/` | ~19/mo | RELEVANCE_KEYWORDS |
| Together AI | `together.ai/blog/rss.xml` | ~10/mo | RELEVANCE_KEYWORDS |
| Lobsters /ai | `lobste.rs/t/ai.rss` | ~25/mo | RELEVANCE_KEYWORDS |
| Cloudflare Blog | `blog.cloudflare.com/rss/` | ~20/mo | RELEVANCE_KEYWORDS |

### Evaluated but not added

| Source | Reason |
|--------|--------|
| Cursor / Windsurf | RSS malformed or 404 |
| Mistral AI | No RSS feed |
| a16z | RSS 404 |
| Dev.to / Medium | Signal-to-noise too low |
| PulseMCP | No RSS feed |
| Microsoft AI / AWS ML | Enterprise marketing, weak agent/skills relevance |
| Sourcegraph | RSS feed 404 (was added then removed) |

### Upgraded (1 source)

| Source | Before | After |
|--------|--------|-------|
| Anthropic | Third-party RSS (13 posts) | Sanity CMS API (293+ posts) |

## Dry-run Validation

14 sources total: 551 fetched, 69 deduped, 198 would insert, 0 failures.

## Expected Impact

Daily published articles: ~2.7 → ~4-5/day. Source concentration reduced from 52% thenewstack to more balanced distribution.
