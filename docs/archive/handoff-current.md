# Handoff — Day 1-2 Launch Readiness

## Objective
Complete cold-start preparation: analytics, about page, image fallback, and GSC verification — so the site is ready for content distribution.

## Current State
### Completed
- **Umami Analytics** integrated in `src/app/layout.tsx` (conditional Script, env-var controlled)
- **Google Search Console** verification meta tag added via `metadata.verification` in `layout.tsx`
- **GSC verified + sitemap submitted** (`https://skillnav.dev/sitemap.xml`)
- **`/about` page** created at `src/app/about/page.tsx` (122 lines, 4 sections: intro/why/stats/contact)
- **FallbackImage component** at `src/components/shared/fallback-image.tsx` (branded gradient placeholder on CDN image failure)
- **Article image fallback** applied to `article-card.tsx` and `articles/[slug]/page.tsx`
- **CI deploy.yml** updated to pass `NEXT_PUBLIC_UMAMI_WEBSITE_ID` and `NEXT_PUBLIC_GSC_VERIFICATION` at build time
- **GitHub Secrets** set: `NEXT_PUBLIC_UMAMI_WEBSITE_ID`, `NEXT_PUBLIC_GSC_VERIFICATION`
- **All commits pushed** to `origin/main`, CI deploy successful

### In Progress
- Nothing — all Day 1-2 work complete and deployed

## Next Actions
1. **Day 3-4: Write first original article** — "2026年值得装的10个Claude Code Skills实测"
   - Pick 10 skills from the 168 curated, try each, write review with install commands
   - Format: each skill with install command + use case + screenshot + link to skillnav detail page
   - Prepare 知乎/掘金 versions with SEO-optimized titles
2. **Day 5: Distribution matrix setup** — 知乎专栏 + 掘金/CSDN + 即刻 + Twitter/X
3. **Day 6-7: First distribution** — publish article across platforms, target 500+ reads
4. **Day 8-9: Second original article** — "Claude Code vs Cursor vs Codex Skills 生态对比" or "MCP Server 哪些真正好用"
5. **Day 10: Review Umami + GSC data** — which channels drive traffic, which keywords get impressions

## Risks & Decisions
- **Content quality vs speed**: first article must be genuinely useful (real testing), not just a listicle
- **Umami Cloud free tier**: 10K events/month — sufficient for cold start, revisit if traffic exceeds
- **GSC indexing delay**: Google may take days to crawl 650 pages — monitor in GSC
- **External CDN images**: FallbackImage handles errors gracefully, but some article cards will show placeholder in China

## Verification
- `npm run build` — 0 errors, 650 pages (verified 2026-03-06)
- `curl -s https://skillnav.dev | grep google-site-verification` — meta tag present
- `curl -s https://skillnav.dev | grep umami` — script preload present
- Visit `https://skillnav.dev/about` — page renders correctly

## Key Commits (this session)
- `3ecc2cd` — fix(config): pass analytics env vars to CI build step
- `0f230c4` — feat(ui): add analytics, about page, and article image fallback

## Modified Files
- `.env.example` — added analytics env vars
- `.github/workflows/deploy.yml` — added UMAMI + GSC env vars to build step
- `src/app/layout.tsx` — Umami Script + GSC verification meta
- `src/app/about/page.tsx` — new /about page
- `src/components/shared/fallback-image.tsx` — new FallbackImage client component
- `src/components/articles/article-card.tsx` — use FallbackImage
- `src/app/articles/[slug]/page.tsx` — use FallbackImage for hero image
