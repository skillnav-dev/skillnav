# Content Strategy Review 2026-03-17

Tags: content-strategy, competitive-analysis, market-trends, editorial

## Summary

Editor-in-Chief level content strategy review covering internal audit, competitive landscape, market trends, and pipeline technology assessment. Key conclusion: direction correct, execution gaps in weekly newsletter and social distribution.

## Internal Audit

### Content Assets (2026-03-17)

| Asset | Total | Published | Health |
|-------|-------|-----------|--------|
| Skills | 7,396 | 168 | Curated model working |
| Articles | 258 | 208 | 16 draft, 34 hidden after batch review |
| MCP Servers | 5,172+ | 3,946 (S65/A360/B3521) | 3-tier layering established |
| Series | 1 (Agentic Engineering Patterns) | 13 articles | Complete |
| Learn Center | 3 concepts (Agent/MCP/RAG) | 3 | P1 done |
| Weekly | 0 issues | 0 | NOT ACTIVATED — critical gap |
| Interactive Guides | 1 (AI Architecture, 10ch) | 1 | Complete |

### Pipeline Capabilities

- **Ingestion**: 14 RSS + 1 Sanity CMS, ~5-10 articles/day
- **Translation**: 5 LLM providers with auto-fallback, 43-term glossary
- **Governance**: Dual-dimension scoring (DevValue × Originality), automated tiering
- **Weekly generation**: Script ready (672 lines), GitHub Actions configured, **frontend pages need DB data layer**
- **SEO**: JSON-LD (6 types) + sitemap (13K+ URLs) + robots + llms.txt + llms-full.txt
- **Distribution**: ZERO channels active (X/WeChat/Zhihu/Jike all not started)

### Scripts Inventory

36 scripts total: 7 sync, 4 governance, 3 content production, 7 backfill, 5 classification, 3 migration, 6 maintenance.

## Competitive Landscape

### Direct Competitors

| Competitor | Type | Scale | Editorial Depth | Chinese | Monetization |
|------------|------|-------|----------------|---------|-------------|
| Toolify.ai | AI tool directory | 28K+ tools | Low (auto-generated) | Machine translated | Ads + submission fees |
| ai-bot.cn | Chinese AI nav | 1K+ tools | Low-Med | Native | Ads |
| AICPB | AI product rankings | 10K+ products | Med (data-driven) | Bilingual | Data services |
| Glama.ai | MCP hosting | 19K+ servers | Low | None | Subscription hosting |
| Smithery.ai | MCP marketplace | 7.3K+ tools | Low | None | Freemium |
| mcp.so | MCP directory | 18.6K+ servers | Very low | None | None |
| PulseMCP | MCP media | 10.8K+ servers | Med-High (Newsletter) | None | Early stage |

**Key finding**: All MCP directories are English-only. SkillNav is the ONLY Chinese MCP curated navigation — zero direct competition.

### Content Strategy References

- **Sspai (少数派)**: Paid columns (¥29-79) + membership model — proven Chinese content monetization template
- **Wirecutter**: Editorial independence → product recommendations → affiliate links. Methodology transparency is key to trust
- **36Kr**: Broad but shallow AI coverage; no tool-level depth

### Translation Sources Priority

- **Tier 1 (core)**: Anthropic Blog, Simon Willison — highest alignment with SkillNav
- **Tier 2 (important)**: TechCrunch AI, OpenAI Blog — news/timeliness
- **Tier 3 (supplement)**: The Verge — consumer angle, selective translation

## Market Trends

### Tailwinds

| Trend | Data Point | Implication |
|-------|-----------|-------------|
| AI Agent market explosion | $88-109B in 2026, CAGR 25-50% | High ceiling for the vertical |
| MCP becomes industry standard | 6,400+ servers, OpenAI/Google/MS all support, Linux Foundation governance | MCP navigation is infrastructure-level need |
| Claude Code #1 developer satisfaction | 46% satisfaction (Cursor 19%) | Skills navigation hits hottest tool |
| LLMO is the new SEO | Brands cited by AI see 35% organic click uplift | Learning center is naturally LLMO-optimized |
| AI tool affiliate commissions high | 15-50% recurring | Wirecutter model monetization potential is high |

### Headwinds

| Risk | Data Point | Mitigation |
|------|-----------|------------|
| Google CTR declining | AI Overview causes 58% CTR drop | Dual strategy: traditional SEO + LLMO |
| Scaled AI content penalized | Google cracking down on bulk AI content | Every article must have editorial value-add (editor's note) |
| Chinese payment willingness low | Newsletter paid model not mature in China | WeChat Official Account / Zhishixingqiu as primary carriers |
| Pure SEO traffic peaking | AI search expected to surpass traditional search by 2029-2030 | Early LLMO + social distribution investment |

### LLMO Key Strategies (directly applicable)

1. Question-style titles: "什么是 MCP？" > "MCP 协议概述" (already done in /learn)
2. Information gain: original data/unique perspective increases citation 30-40%
3. Content updated within 13 weeks has significantly higher citation probability (3.2x for <30 days)
4. Structured data + Schema helps AI understand content entities
5. Third-party mentions (Reddit, Zhihu) amplify LLM learning
6. "Citations are the new backlinks" — Share of Answer is the new market share

## Strategic Conclusions

### 3 Confirmations + 2 Adjustments

**Confirmed**:
1. "Wirecutter for AI Agent Tools" positioning — competitor analysis validates the gap
2. MCP curated navigation — only Chinese offering, zero direct competition
3. Editorial depth = moat — in AI search era, trust determines survival

**Adjustments needed**:
1. From pure SEO → SEO + LLMO dual engine
2. From "wait for traffic on-site" → active distribution (weekly + social channels)

### Q2 2026 Priority Stack

| Priority | Item | Rationale |
|----------|------|-----------|
| P0 | Launch weekly newsletter | Core brand carrier, 0→1 |
| P0 | Clear draft backlog | Done: 63→16 drafts |
| P1 | LLMO-optimize learning center | Q&A titles + 13-week update cadence |
| P1 | Add editor's note to translations | Avoid Google penalty + information gain |
| P2 | Launch social distribution | X account + Jike |
| P2 | Learning center P2 concepts | 9-12 new concept pages |
| P3 | WeChat Official Account | Primary Chinese distribution carrier |
| P3 | Affiliate monetization research | AI tools 15-50% recurring commissions |

## Proposed Editorial Standards

1. **Translated articles must have editor's note**: ≥2 sentences from Chinese developer perspective
2. **Learning center titles in Q&A format**: already done ("什么是 X？")
3. **13-week content freshness cadence**: review learning center concepts every 13 weeks
4. **Weekly three-pillar format**: curated articles + tool discoveries + ecosystem insights
