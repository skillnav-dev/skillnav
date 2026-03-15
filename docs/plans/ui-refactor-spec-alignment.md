# UI Refactor: Spec Alignment
Status: done
Progress: 29/29
Date: 2026-03-15
Feature: ui-refactor

## Goal

Align the entire SkillNav UI codebase with `product-spec.md` (PS) and `design-spec.md` (DS) contracts. Full-site audit identified 11 HIGH, 16 MEDIUM, ~20 LOW deviations across tokens, components, and page composition.

## Task List

### Phase 1: Token Foundation (H1, H2, M1-M3)

- [x] 1. `globals.css` — add `fade-in` / `slide-up` keyframes + `--animate-*` vars to `@theme` (DS:7)
- [x] 2. `globals.css` — fix `--border` dark to `oklch(0.30 0.015 260)` (DS:2.2)
- [x] 3. `globals.css` — fix `--destructive` to `oklch(0.55 0.2 25)` both modes (DS:2.2)
- [x] 4. `globals.css` — add `line-height: 1.75` to body (DS:2.8)
- [x] 5. `fonts.ts` + `globals.css` — wire Chinese font fallbacks into `--font-sans` (DS:2.7)

### Phase 2: Component Fixes (H5-H7, H10-H11, M6-M12)

- [x] 6. `article-card.tsx` — restructure 3 layers: Header=title, Content=summary, Footer=meta (DS:4.3)
- [x] 7. `skill-card.tsx` — add `<h3>`, `px-6`, PlatformBadge, SecurityBadge (DS:4.3)
- [x] 8. `mcp-card.tsx` — add `px-6`, use shared CopyButton (DS:4.3)
- [x] 9. `security-badge.tsx` — safe→ShieldCheck, unscanned→Shield (DS:4.4)
- [x] 10. `freshness-badge.tsx` — colors amber/blue, icons Flame/Sparkles, threshold 14d (DS:4.4)
- [x] 11. `section-header.tsx` — add `href` + `linkText` props for "View all" (DS:4.9)
- [x] 12. `mobile-nav.tsx` — `side="left"` → `side="right"` (DS:4.6)
- [x] 13. `mcp-grid-skeleton.tsx` — structured skeleton matching MCPCard layout (DS:4.7)
- [x] 14. `nav-links.tsx` — `font-medium` conditional on active only (DS:4.5)
- [x] 15. `skills-toolbar.tsx` — tab pills use Button sm or explicit `h-10` (DS:4.9)

### Phase 3: Page Composition (H3, H4, H8-H9, M4-M5, M13-M16)

- [x] 16. `hero-section.tsx` — `py-12 sm:py-16` → `py-20 sm:py-28` (DS:3.5)
- [x] 17. `editorial-highlights.tsx` / `featured-tools.tsx` / `latest-articles.tsx` — `py-10` → `py-16` (DS:3.5)
- [x] 18. `articles-grid.tsx` — remove `lg:grid-cols-3` (DS:3.3)
- [x] 19. `page.tsx` (homepage) — add `<NewsletterCta />` as last section (DS:6.6)
- [x] 20. `articles/[slug]/page.tsx` — add `<GiscusComments />` (DS:6.3)
- [x] 21. `mcp/page.tsx` + `en/mcp/page.tsx` — wrap MCPToolbar in `mt-6` (DS:3.5)
- [x] 22. `skills/[slug]/page.tsx` — move GiscusComments after Related; reorder Related (DS:6.2)
- [x] 23. `mcp/[slug]/page.tsx` — move GiscusComments after Related (DS:6.2)
- [x] 24. `articles/[slug]/page.tsx` — move InlineNewsletterCta outside narrow container (DS:6.3)

### Phase 4: Polish (LOW items)

- [x] 25. 3 cards — add `shadow-sm` default (DS:2.11)
- [x] 26. EmptyState — unify icon `size-10`, `mt-2`, Button `mt-6` (DS:4.7)
- [x] 27. Skeleton/card `rounded-xl` unify (DS:2.10)
- [x] 28. CopyButton icon `size-4` + green tint (DS:4.1)
- [x] 29. Minor token drift fixes (`--muted`, `--cta` dark, etc.) (DS:2.2)

## Key Decisions

- Phased by layer: Token → Component → Composition → Polish
- Each phase independently verifiable and committable
- No new dependencies or files needed
- ArticleCard restructure is the highest-risk change (most complex)
