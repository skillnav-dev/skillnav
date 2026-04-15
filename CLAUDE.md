# CLAUDE.md

## Project Overview

**SkillNav** -- 中文开发者的 AI 智能体工具站（Skills · MCP · 实战资讯）(skillnav.dev)

Core flywheel: 资讯翻译(引流) → 工具导航(留存) → Skill 套件(变现)

GitHub org: `skillnav-dev` | Domain: `skillnav.dev` (Cloudflare Registrar)

## Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | Next.js 15 (App Router + RSC + ISR) | 13K+ interactive listings |
| UI | Tailwind CSS + shadcn/ui | |
| i18n | next-intl | zh/en |
| Database | Supabase (PostgreSQL + PGroonga) | Chinese full-text search |
| Search | MVP: Orama (client-side) → Meilisearch | |
| Deploy | Cloudflare Workers (OpenNext adapter) | Zero bandwidth |
| Analytics | Umami + Google Analytics + GSC | |
| Email | Resend + React Email | |
| Payment | LemonSqueezy | |

## Database Schema

Core tables: `skills` (slug, name, name_zh, category, tags, stars, security_score) and `articles` (slug, title, title_zh, content, source_url, published_at).

## Commands

<!-- Full command list in .claude/rules/commands.md (auto-loaded) -->

```bash
npm run dev        # Local dev
npm run build      # Production build
npm run lint       # Linter
```

## Development Conventions

- 中文交流，代码注释用英文
- Commit message: English, Conventional Commits format
- Code style: TypeScript strict, ESLint + Prettier
- All user-facing content in Chinese by default (i18n for English)

## Deployment

Cloudflare Workers (OpenNext adapter) · Domain: skillnav.dev · CI/CD: GitHub Actions

## Architecture

<!-- Full architecture tree in .claude/rules/architecture.md (auto-loaded) -->

Call direction: `page.tsx` → `components/` → `data/` → `lib/`

## Documentation

```
docs/
├── README.md                    # Knowledge index
├── product-spec.md / design-spec.md  # Contracts
├── specs/                       # Domain specs
├── features.md / approved-deps.md    # State
├── plans/ / adr/ / research/ / troubleshooting/  # Knowledge
└── archive/                     # Superseded (not auto-loaded)
```

## Knowledge Retrieval Rules

- Before tech research: search `docs/research/` first
- Before debugging: search `docs/troubleshooting/` first
- Before tech decisions: search `docs/adr/` first
- Before adding deps: check `docs/approved-deps.md`

## Key Rules

- NEVER commit .env files or any file containing secrets
- NEVER use `git add .` — add files individually
- MUST read a file before modifying it
- MUST run `npm run build` to verify after multi-file changes
- New code MUST reference existing similar implementations for style consistency
- Use shadcn/ui components exclusively — NEVER introduce other UI libs
- Use Tailwind utility classes — NEVER write raw CSS
- Single file should not exceed 300 lines — split if approaching limit
- Push code → always verify CI passes. Run `npm run lint` locally first

## Work Mode

- Show implementation plan before writing code, wait for approval
- When modifying shared types, search all references first and list impact scope
- Small steps: complete one working state → verify → commit → next step
- If a fix fails twice on the same issue, stop and reassess approach

## Git Scope Mapping

```
home — Homepage          | skills — Skills module     | articles — Articles module
ui — Shared UI/layout    | data — Data layer/types    | seo — SEO
deps — Dependencies      | config — Configuration     | dx — Dev experience
```

## Project Glossary

| Term | Meaning | Not |
|------|---------|-----|
| Skill | A Claude Code custom skill (SKILL.md) | Not a general ability |
| ClawHub | Third-party Skills registry | Not our product |
| PGroonga | PostgreSQL Chinese full-text search | Not pg_trgm |
| ISR | Incremental Static Regeneration | Not SSR |
| OpenNext | Next.js → Cloudflare adapter | Not official |

## Known Pitfalls

<!-- File-specific pitfalls auto-loaded from .claude/rules/ (react-nextjs.md, scripts.md, styling.md) -->

General: shadcn/ui components must be installed before import (`npx shadcn@latest add <component>`)

## Documentation Rules

- Update `docs/features.md` when shipping or deprecating features
- Update `docs/approved-deps.md` when adding new dependencies
- Create `docs/adr/ADR-xxx.md` for major architecture decisions
- Update CLAUDE.md when adding modules or dev commands
