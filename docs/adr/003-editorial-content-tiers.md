# ADR-003: Editorial Content Tiers

- **Status**: accepted
- **Date**: 2026-03-19
- **Context**: 280 articles, 278 marked `translated`, only 2 `editorial`. All content goes through the same LLM pipeline regardless of quality/importance. Positioning as "Wirecutter for AI tools" requires editorial judgment, not just translation volume.

## Decision

Adopt a three-tier content architecture with differentiated editorial treatment:

### Tier 1: Flagship (editorial)
- 3-5 per month, human-reviewed
- Criteria: deep narrative, hands-on tutorial, or significant analysis directly relevant to SkillNav audience (AI Agent, Claude, MCP, dev tools)
- Treatment: review translation against original, fix cultural references/idioms, write editorial note (100-200 chars), rewrite intro for impact, mark `content_tier = 'editorial'`
- Examples: Vibe Physics (first flagship, 2026-03-19)

### Tier 2: Standard (translated)
- Bulk pipeline output, acceptable quality for SEO breadth
- No additional editorial work beyond automated scoring/filtering
- Current pipeline continues as-is

### Tier 3: Not worth full translation
- Short news/announcements, off-topic content (e.g., Btrfs scaling, office openings)
- Either: hidden, or condensed to one-line mention in weekly digest
- Should not receive full article translation

## Editorial Workflow (Flagship)
1. **Select** — by source prestige, topic relevance, article depth
2. **Review translation** — compare against original, fix idioms/cultural refs/terminology
3. **Write editorial note** — blockquote at top: why this matters for Chinese developers
4. **Rewrite intro** — lead with core finding, not generic description
5. **Mark editorial + publish**

## Consequences
- Flagship articles become the sharable content that builds brand reputation
- Clear separation between "editorial product" and "SEO infrastructure"
- Editorial note is the visible differentiator from pure translation sites
