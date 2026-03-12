# Decision: MCP Directory Strategy — Full Index + Editorial Curation

**Date**: 2026-03-12
**Status**: Approved
**Context**: MCP sync brought 5,145 new servers into DB (total 5,172). Need to decide: pure curation (like Skills) or leverage the volume.

## Background

- Skills module follows pure curation: 168 published, editor-reviewed
- MCP sync imported 3,523 from MCP Registry + 1,625 from Smithery
- Tools backfill: 1,373 servers got complete tool definitions from Smithery API
- All new imports are draft status (not visible to users)

## Competitive Landscape (researched 2026-03-12)

| Competitor | Listings | Strategy | Chinese Content |
|-----------|----------|----------|----------------|
| Glama.ai | ~19,000 | Full catalog + security scan | None |
| mcp.so | ~18,400 | Full catalog + community | Machine-translated `/zh/` |
| MCPdb | 10,000+ | Full catalog | None |
| PulseMCP | ~8,700 | Full catalog + newsletter | None |
| Smithery | ~7,300 | Full catalog + hosting | None |
| mcpservers.org | Hundreds | Human-curated | None |

**Key finding**: No competitor does Chinese editorial reviews. mcp.so has `/zh/` but it's UI-only translation.

## Decision: Three-Tier Model

| Tier | Definition | Est. Count | Visibility |
|------|-----------|------------|------------|
| **S: Editor's Pick** | Manual Chinese review + scenario + Skills pairing | 50-100 | Homepage, featured, weekly |
| **A: Quality Auto** | stars >= 100 OR tools >= 3 OR verified | 200-500 | Normal listing, search |
| **B: Long-tail Index** | Has description + GitHub URL | 3,000-4,000 | Search/category only, SEO |
| **Hidden** | No description, no GitHub, junk | 500-1,000 | status=hidden |

## Rationale

1. **SEO long-tail**: 3,000+ Chinese MCP pages = massive keyword coverage competitors lack
2. **Editorial moat**: 50-100 deep Chinese reviews are uncopyable
3. **Avoids ClawHub mistake**: draft-first, auto-tier, only publish qualified ones
4. **Data already paid for**: sync scripts built, 5,145 records in DB, tools backfilled

## What We Don't Do

- Don't chase listing count (can't beat 19K Glama)
- Don't build MCP hosting/deployment (infra cost)
- Don't do English-only directory (no differentiation)
- Don't bulk-publish unreviewed content

## Implementation Phases

| Phase | Action | Dependency |
|-------|--------|-----------|
| P0 | Run `refresh-tool-metadata` for real star counts | GitHub token |
| P1 | Write `govern-mcp-servers.mjs` for auto-tiering | P0 |
| P2 | Fix en/mcp limit:100 + switch to ISR | None |
| P3 | Editorial: pick 50 from A-tier, write Chinese reviews | P1 |
| P4 | Cross-link: MCP detail -> recommended Skills | P3 |
