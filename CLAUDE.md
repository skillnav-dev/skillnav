# CLAUDE.md

## Project Overview

**SkillNav** -- 中文开发者的 AI 智能体工具站（Skills · MCP · 实战资讯）(skillnav.dev)

Core flywheel: 资讯翻译(引流) → 工具导航(留存) → Skill 套件(变现)

GitHub org: `skillnav-dev` | Domain: `skillnav.dev` (Cloudflare Registrar)

## Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | Next.js 15 (App Router + RSC + ISR) | 13K+ interactive listings, not pure static |
| UI | Tailwind CSS + shadcn/ui | |
| i18n | next-intl | zh/en |
| Database | Supabase (PostgreSQL + PGroonga) | Auth/Storage/Realtime + Chinese full-text search |
| Search | MVP: Orama (client-side) → Meilisearch | Zero-cost start, upgrade when needed |
| Deploy | Cloudflare Workers (OpenNext adapter) | Zero bandwidth cost |
| CMS | MVP: MDX + Git → Payload CMS | |
| Analytics | Umami + Google Analytics + GSC | |
| Email | Resend + React Email | |
| Payment | LemonSqueezy | |

Key decisions: Next.js over Astro (ISR for 13K+ pages) · Supabase over D1 (PGroonga Chinese search) · Cloudflare over Vercel (zero bandwidth) · Orama → Meilisearch (zero-cost MVP search)

## Database Schema

Core tables: `skills` (slug, name, name_zh, category, tags, stars, security_score) and `articles` (slug, title, title_zh, content, source_url, published_at). Full schema defined in product plan — see Knowledge Base References.

## Commands

```bash
npm run dev        # Local dev server
npm run build      # Production build
npm run lint       # Run linter

# Content pipeline
node scripts/sync-articles.mjs                          # Full article sync (all sources)
node scripts/sync-articles.mjs --retranslate-published   # Re-compile published articles with current prompt
node scripts/sync-articles.mjs --retranslate-drafts      # Re-compile draft articles
node scripts/backfill-mcp-description-zh.mjs --tier B --apply  # Backfill B-tier Chinese descriptions
node scripts/govern-articles.mjs --audit                 # Article status/score report
node scripts/audit-content.mjs                           # Skills content quality audit

# Daily brief pipeline
node scripts/generate-daily.mjs                          # Generate today's daily brief
node scripts/generate-daily.mjs --dry-run                # Preview without writing to DB
node scripts/generate-daily.mjs --hours 48               # Look back 48h instead of 24h
node scripts/publish-daily.mjs                           # Publish today's approved brief
node scripts/publish-daily.mjs --channel rss             # Publish to specific channel only

# Card image generation (requires gstack browse)
python3 -m http.server 8765 --directory scripts/templates &  # Serve card template
$B goto http://localhost:8765/daily-card.html                 # Render in browser
$B screenshot --clip 0,0,1080,1350 xhs-1.png                 # Capture XHS cards (6 total)
$B screenshot --clip 0,8240,1080,608 wechat-header.png        # Capture WeChat header
```

## Development Conventions

- 中文交流，代码注释用英文
- Commit message: English, Conventional Commits format
- Code style: TypeScript strict, ESLint + Prettier
- All user-facing content in Chinese by default (i18n for English)

## Deployment

Cloudflare Workers (OpenNext adapter) · Domain: skillnav.dev · CI/CD: GitHub Actions · China: Argo Smart Routing + HK/JP/SG edge (no ICP)

## Architecture

```
src/
├── app/                        # Pages & routing (App Router)
│   ├── page.tsx                # Homepage (5 sections assembled)
│   ├── articles/               # Article list + [slug] detail (SSG)
│   ├── skills/                 # Skills listing + [slug] detail
│   ├── mcp/                    # MCP Server 精选导航 (static curated data)
│   ├── learn/                  # Learning Center: /learn index + /learn/what-is-[slug] detail
│   ├── admin/daily/            # Daily Brief admin: list + [id] detail (preview/edit/approve/publish)
│   ├── api/admin/daily/        # Admin API: PATCH update, POST approve, POST publish
│   ├── api/rss/daily/          # RSS feed for daily briefs
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
    └── fonts.ts                # Font configuration

public/
├── daily-cards/                # Generated card images for social distribution
│   └── YYYY-MM-DD/             # Per-date: xhs-{1-6}.png (1080x1350) + wechat-header.png (1080x608)
└── guides/                     # Interactive deep guides (11 standalone HTML)
    ├── ai-guide.html           # 10-chapter AI architecture guide
    ├── mcp-interactive-guide.html      # MCP config simulator
    ├── ai-coding-tools-compare.html    # Cursor/Copilot/Claude Code matrix
    ├── prompt-engineering-workshop.html # Prompt playground
    ├── agent-design-patterns.html      # ReAct/PaE/Multi-Agent flow animation
    ├── rag-vs-finetuning-decision-tree.html # Decision tree
    ├── llm-selection-guide.html        # Interactive filter
    ├── token-economics-calculator.html # Cost calculator
    ├── ai-safety-guardrails-simulator.html # Attack/defense demo
    ├── vector-database-comparison.html # DB recommendation
    └── embedding-dimensions.html       # Dimension visualization + cost calc

scripts/
├── generate-daily.mjs          # Daily brief generator (query → LLM curate → multi-format → upsert)
├── publish-daily.mjs           # Multi-channel publisher (RSS auto, WeChat/X copy-ready)
├── templates/daily-card.html   # Card image template (6 XHS cards + WeChat header, rendered via gstack browse)
├── lib/publishers/             # Platform format adapters (wechat.mjs, twitter.mjs, rss.mjs)
scripts/lib/
├── llm.mjs                     # LLM providers + compile prompt (imports glossary)
└── glossary.json               # Centralized terminology (keep/translate/bracket policies)
```

Call direction: `page.tsx` → `components/` → `data/` → `lib/`

## Documentation

```
docs/
├── README.md                    # Knowledge index (navigation hub)
│
│   ── 契约层 ──
├── product-spec.md              # Product structure contract (IA, journeys, permissions)
├── design-spec.md               # Visual design contract (tokens, components, patterns)
├── specs/                       # Domain specs (content strategy, pipeline, ops)
│
│   ── 状态层 ──
├── features.md                  # Feature inventory
├── approved-deps.md             # Dependency allowlist
│
│   ── 知识层 ──
├── plans/                       # Implementation plans (9)
├── adr/                         # Architecture decision records
├── research/                    # Tech research (22, date-prefixed)
│   └── distribution/            # Distribution channel research
├── troubleshooting/             # Issue knowledge base
│
└── archive/                     # Superseded docs (AI does not auto-load)
```

## Knowledge Retrieval Rules

- Before tech research: search `docs/research/` first (avoid duplicate research)
- Before debugging: search `docs/troubleshooting/` first (avoid repeat mistakes)
- Before tech decisions: search `docs/adr/` first (avoid revisiting rejected options)
- Before adding dependencies: check `docs/approved-deps.md` (avoid banned packages)
- Retrieval method: grep tags or title keywords

## Key Rules

- NEVER commit .env files or any file containing secrets
- NEVER use `git add .` — add files individually
- MUST read a file before modifying it — confirm types/functions exist before referencing
- MUST run `npm run build` to verify after multi-file changes
- New code MUST reference existing similar implementations for style consistency (anchor file pattern)
- Use shadcn/ui components exclusively — NEVER introduce Ant Design / MUI / Chakra
- Use Tailwind utility classes — NEVER write raw CSS
- Single file should not exceed 300 lines — split if approaching limit

## Work Mode

- Show implementation plan (files to modify + changes) before writing code, wait for approval
- When modifying shared types, search all references first and list impact scope
- Small steps: complete one working state → verify → commit → next step
- If a fix fails twice on the same issue, stop and reassess approach

## Git Scope Mapping

```
home — Homepage          | skills — Skills module     | articles — Articles module
ui — Shared UI/layout    | data — Data layer/types    | seo — SEO (sitemap, robots, JSON-LD)
deps — Dependencies      | config — Configuration     | dx — Dev experience/tooling
```

## Project Glossary

| Term | Meaning in this project | Not |
|------|------------------------|-----|
| Skill | A Claude Code custom skill (SKILL.md definition) | Not a general ability |
| ClawHub | Third-party Skills registry (clawhub.com) | Not our product |
| PGroonga | PostgreSQL extension for Chinese full-text search | Not standard pg_trgm |
| ISR | Incremental Static Regeneration (Next.js) | Not server-side rendering |
| OpenNext | Adapter to deploy Next.js on Cloudflare Workers | Not official Next.js tooling |

## Known Pitfalls

- `useEffect(() => { setMounted(true) }, [])` triggers `react-hooks/set-state-in-effect` lint error — use `useSyncExternalStore` or suppress with care
- shadcn/ui components must be installed before import: `npx shadcn@latest add <component>`
- Next.js 15 uses async `params` in dynamic routes — destructure with `await` in server components
- Tailwind v4 uses CSS-based config (`@theme` in globals.css), not `tailwind.config.ts`

## Documentation Rules

- Update `docs/features.md` when shipping or deprecating features
- Update `docs/approved-deps.md` when adding new dependencies
- Create `docs/adr/ADR-xxx.md` for major architecture decisions
- Update CLAUDE.md "Architecture" section when adding modules/directories
- Update CLAUDE.md "Commands" section when adding dev commands
- Update CHANGELOG.md for milestone-level changes

## Context Management

When executing `/compact`, preserve:
1. Current task objective (one sentence)
2. Completed and remaining steps
3. Modified file list with key changes
4. Test commands and verification results
5. Architectural decisions made in this session

## Knowledge Base References

Detailed docs in personal knowledge base:

| Document | Path |
|----------|------|
| 产品方案 | `/Users/apple/WeChatProjects/tishici/docs/playbook/skillnav-product-plan.md` |
| 商业化路线图 | `/Users/apple/WeChatProjects/tishici/docs/playbook/skillnav-monetization-roadmap.md` |
| 赛道调研 | `/Users/apple/WeChatProjects/tishici/docs/playbook/openclaw-skills-research.md` |
