# Architecture

```
src/
├── app/                        # Pages & routing (App Router)
│   ├── page.tsx                # Homepage (5 sections assembled)
│   ├── articles/               # Article list + [slug] detail (SSG)
│   ├── skills/                 # Skills listing + [slug] detail
│   ├── mcp/                    # MCP Server 精选导航 (static curated data)
│   ├── trending/               # Trending dashboard: four-track (papers/tools/articles/community), ISR 5min
│   ├── daily/                  # Daily Brief public: /daily list (ISR 5min) + /daily/[date] detail
│   ├── learn/                  # Learning Center: /learn index + /learn/what-is-[slug] detail
│   ├── papers/                 # Paper listing page (source='arxiv', ISR 5min)
│   ├── admin/daily/            # Daily Brief admin: list + [id] detail (preview/edit/approve/publish)
│   ├── api/health/              # Pipeline health probe: stale if >36h no runs (Better Stack monitored)
│   ├── api/skill/query/         # Skill API: GET ?type=brief|mcp|trending|paper (public, anon key)
│   ├── api/content/[slug]/      # Article content API: lazy-load for long articles (bypasses CF Worker CPU limit)
│   ├── api/admin/daily/        # Admin API: PATCH update, POST approve, POST publish
│   ├── api/admin/community/    # Community signal moderation: PATCH is_hidden
│   ├── api/rss/daily/          # RSS feed for daily briefs
│   ├── go/paper/[id]/          # Paper click tracking: 302 redirect to arXiv + Umami server-side event
│   ├── layout.tsx              # Root layout (zh lang, fonts, Header/Footer)
│   ├── globals.css             # Brand color variables (deep indigo theme)
│   ├── robots.ts / sitemap.ts  # SEO
│   ├── not-found.tsx           # Custom 404
│   └── error.tsx               # Root error boundary (500)
├── components/
│   ├── home/                   # Homepage sections (hero, stats, featured, articles, newsletter)
│   ├── articles/               # Article card, meta, content, series-nav
│   ├── skills/                 # Skill card
│   ├── mcp/                    # MCP card, sidebar, content sections (what-is/how-to/tools), FAQ
│   ├── learn/                  # Concept card, related concepts, visual diagrams
│   ├── trending/               # Trending track components + source health bar
│   ├── layout/                 # Header, footer, mobile nav, theme toggle
│   ├── shared/                 # Section header, security badge, JSON-LD
│   └── ui/                     # shadcn/ui primitives
├── data/                       # Mock data (skills, articles) + type definitions
│   ├── types.ts                # Skill / Article interfaces
│   ├── series.ts               # Series metadata (chapters, authors) — static config
│   ├── learn.ts                # Learning Center concept metadata (slug, term, seo)
│   ├── mock-skills.ts          # 10 mock Skills
│   └── mock-articles.ts        # 7 mock articles with full Chinese content
└── lib/                        # Utilities
    ├── constants.ts            # Site-wide constants (name, URL, description)
    ├── fonts.ts                # Font configuration
    ├── parse-brief.ts          # Daily brief content_md → structured JSON
    ├── get-trending-tools.ts   # Skills + MCP trending merge
    └── trending-data.ts        # Trending page data fetchers (HF Papers, articles, community signals)

public/
├── daily-cards/                # Generated card images for social distribution
│   └── YYYY-MM-DD/             # Per-date: xhs-{1-6}.png (1080x1350) + wechat-header.png (1080x608)
└── guides/                     # Interactive deep guides (11 standalone HTML)

scripts/
├── paper-radar.mjs             # Paper sensing: 3-source (HF+S2+Newsletter)
├── translate-paper.mjs         # Paper translation: arXiv → DB + Vault (dual-write)
├── scrape-signals.mjs          # Newsletter layer: fetch 5 newsletters → JSON
├── generate-daily.mjs          # Daily brief generator (LLM editorial funnel)
├── publish-daily.mjs           # Multi-channel publisher (RSS auto, WeChat/X copy-ready)
├── scrape-x-signals.mjs        # X/Twitter KOL collection → community_signals
├── scrape-hn-signals.mjs       # HN collection → community_signals
├── scrape-reddit-signals.mjs   # Reddit .json API → community_signals (no API key needed)
├── auto-translate-radar.mjs    # Scan radar [x] papers → translate (launchd 22:00)
├── failover-check.mjs          # Pipeline freshness check (>36h → auto-run)
├── lib/llm.mjs                 # LLM providers + circuit breaker
├── lib/x-client.mjs            # TwitterAPI.io abstraction
├── lib/glossary.json           # Centralized terminology
└── lib/run-pipeline.mjs        # Universal pipeline wrapper (lock→claim→main→report)

skills/
└── skillnav/SKILL.md           # SkillNav Skill definition
```

Call direction: `page.tsx` → `components/` → `data/` → `lib/`
