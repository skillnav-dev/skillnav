# CLAUDE.md

## Project Overview

**SkillNav** -- 中文世界的 AI Agent Skills 导航 + 资讯站 (skillnav.dev)

Core flywheel: 资讯翻译(引流) → 导航站(留存) → Skill 套件(变现)

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

Key decisions:
- **Next.js over Astro**: ISR on-demand generation for 13K+ Skills pages
- **Supabase over D1**: full-stack suite + PGroonga Chinese search
- **Cloudflare over Vercel**: zero bandwidth fees at scale
- **Orama → Meilisearch**: zero-cost client search for MVP, server search at growth stage

## Database Schema

```sql
-- Skills table
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_zh TEXT,
  description TEXT,
  description_zh TEXT,
  author TEXT,
  category TEXT,
  tags TEXT[],
  stars INTEGER DEFAULT 0,
  downloads INTEGER DEFAULT 0,
  security_score TEXT,
  clawhub_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- News/Articles table
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  title_zh TEXT,
  content TEXT,
  content_zh TEXT,
  source_url TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## Commands

```bash
npm run dev        # Local dev server
npm run build      # Production build
npm run lint       # Run linter
```

## Development Conventions

- 中文交流，代码注释用英文
- Commit message: English, Conventional Commits format
- Code style: TypeScript strict, ESLint + Prettier
- All user-facing content in Chinese by default (i18n for English)

## Deployment

- **Platform**: Cloudflare Workers via OpenNext adapter
- **Domain**: skillnav.dev (Cloudflare Registrar)
- **CI/CD**: GitHub Actions → Cloudflare Workers
- **China optimization**: Cloudflare Argo Smart Routing + HK/JP/SG edge nodes (no ICP needed)

## Architecture

> This section will be filled as the project develops. Key directories and data flow will be documented here once the initial scaffolding is complete.

## Knowledge Base References

Detailed docs live in the personal knowledge base (tishici repo):

| Document | Path |
|----------|------|
| 产品方案 | `/Users/apple/WeChatProjects/tishici/docs/playbook/skillnav-product-plan.md` |
| 商业化路线图 | `/Users/apple/WeChatProjects/tishici/docs/playbook/skillnav-monetization-roadmap.md` |
| 赛道调研 | `/Users/apple/WeChatProjects/tishici/docs/playbook/openclaw-skills-research.md` |
| 域名注册实践 | `/Users/apple/WeChatProjects/tishici/docs/playbook/domain-registration.md` |
| 域名设计方法论 | `/Users/apple/WeChatProjects/tishici/docs/playbook/domain-naming-methodology.md` |
