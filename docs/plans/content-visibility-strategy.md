# Content Visibility Strategy

> Status: approved (2026-03-11)
> Decision: make knowledge machine-readable, let tools speak English, keep editorial Chinese

## Core Insight

skillnav.dev's content has two layers with different discovery logic:

- **Knowledge layer**: 168 Skills, 18 MCP Servers, 50 GitHub projects — structured data, natively English (package names, repos, README). Chinese is our addition.
- **Editorial layer**: compiled articles, editor comments, weekly digest — editorial voice, natively Chinese. English world doesn't need our version of their own news.

**Principle: Let knowledge speak its own language. Let editorial stay Chinese. Let both humans and machines find us.**

## Three Actions

### 1. Make our content machine-readable

- `llms.txt` + `llms-full.txt` — declare site knowledge structure for AI crawlers
- Upgrade JSON-LD: SoftwareApplication + FAQ + citation schemas
- `robots.txt` — allow AI crawlers (GPTBot, ClaudeBot, PerplexityBot)
- Every article's first paragraph must directly answer the core question (GEO-friendly)

### 2. Let tool pages speak English

- Enable `/en/skills/[slug]` and `/en/mcp` using existing English data in DB
- hreflang zh <-> en cross-references
- English sub-sitemap
- No English articles — that's our Chinese editorial moat

### 3. GEO-friendly compilation prompt

- Add constraint: first paragraph must be a direct answer ("what is X", "what problem does X solve")
- Cost: one line in prompt. Benefit: every new article is auto GEO-friendly.

## Not Doing

- English articles — competing with original sources, zero differentiation
- English social distribution — Chinese distribution not even started yet
- Separate GEO system — GEO = good SEO + structured data + AI crawler access
- English navigation/about/weekly — editorial pages stay Chinese only

## Implementation Scope

No new DB tables, no new scripts, no new dependencies. Opening windows on existing architecture:

- `llms.txt` + `llms-full.txt` (site knowledge declaration)
- JSON-LD upgrade (SoftwareApplication + FAQ + citation)
- `/en/skills` + `/en/mcp` route enablement (data exists, just wiring)
- hreflang + English sitemap
- Compilation prompt "first-paragraph-as-answer" constraint
- `robots.txt` AI crawler rules

## Expected Outcome

In 3 months: when someone asks Perplexity "best claude code skills", our data gets cited. When someone asks ChatGPT "MCP server recommendations", our editorial opinion gets cited.
