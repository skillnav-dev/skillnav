# Handoff — Skills 2.0: Curated Gallery

## Objective
Transform SkillNav's Skills module from a ClawHub mirror (6,447 low-quality skills) into a curated cross-platform gallery (~80-90 quality skills from 4 repos), positioning as "Wirecutter for AI Agent Skills".

## Current State
### Completed
- **Phase 1.1**: DB migration SQL (`supabase/migrations/20260306_skills_curated.sql`) — expands source enum, adds `repo_source`/`editor_comment_zh` columns, GIN index on platform, hides ClawHub skills
- **Phase 1.2**: Sync pipeline — `scripts/sync-curated-skills.mjs` (main script) + `scripts/lib/curated-adapters.mjs` (4 adapters: anthropics/skills, openai/codex, daymade/claude-code-skills, levnikolaevich/claude-code-skills)
- **Phase 1.3**: Types updated — `curated` added to `SkillSource`, `repoSource`/`editorCommentZh` added to `Skill` interface, Supabase types and mappers updated
- **Phase 1.4**: DAL extended — `getSkillsWithCount()`/`getSkills()` support `platform`/`tab`/`sort` filters; new `getSkillPlatforms()`/`getSkillRepoSources()` functions; search params updated
- **Phase 1.5**: npm script `sync:curated` added; CI workflow `.github/workflows/sync-curated-skills.yml` (weekly Wed UTC 03:00)
- **Phase 2.1**: New components — `platform-badge.tsx` (Claude/Codex/Universal badges), `skill-install-tabs.tsx` (multi-client install tabs), `skill-comments.tsx` (giscus widget, pending config)
- **Phase 2.2**: Listing page redesigned — toolbar with tabs (精选/最新/全部), platform filter, sort toggle; grid passes new params
- **Phase 2.3**: Card redesigned — platform badges, quality "精选" tag, editor comment one-liner, repo source label
- **Phase 2.4**: Detail page updated — PlatformBadge in hero, editor comment callout, SkillInstallTabs, SkillComments, SoftwareApplicationJsonLd; sidebar shows platform/repo_source
- **Build verification**: `npm run build` passes with 0 errors

### In Progress
- Nothing — all code changes complete, pending commit and deployment steps

## Next Actions
1. Apply DB migration: execute `supabase/migrations/20260306_skills_curated.sql` in Supabase SQL Editor
2. Run sync: `node scripts/sync-curated-skills.mjs --dry-run` to verify parsing, then live sync
3. Setup Giscus: create `skillnav-dev/discussions` repo, enable Discussions, install giscus app, fill `repoId`/`categoryId` in `src/components/skills/skill-comments.tsx:GISCUS_CONFIG`
4. Review levnikolaevich pick list: verify `LEVN_PICKS` set in `scripts/lib/curated-adapters.mjs` matches actual directory names in the repo (may need adjustment after dry-run)
5. Push to main and verify CI deployment

## Risks & Decisions
- **Giscus not configured**: `skill-comments.tsx` has empty `repoId`/`categoryId` — component renders nothing until filled
- **levnikolaevich pick list**: The 25 directory names in `LEVN_PICKS` are estimated — actual repo may have different naming; `--dry-run` will reveal mismatches
- **ClawHub hidden**: Migration sets `is_hidden=TRUE` for all clawhub source skills — detail pages still accessible via direct URL but won't appear in listings
- **No downloads column in card**: Replaced with `repoSource` label since curated skills have 0 downloads

## Verification
- `npm run build` — 0 errors (verified)
- `npm run lint` — check for lint issues
- `node scripts/sync-curated-skills.mjs --dry-run` — verify adapter parsing (requires GITHUB_TOKEN)

## Modified Files
- `supabase/migrations/20260306_skills_curated.sql` (new)
- `scripts/sync-curated-skills.mjs` (new)
- `scripts/lib/curated-adapters.mjs` (new)
- `.github/workflows/sync-curated-skills.yml` (new)
- `src/components/skills/platform-badge.tsx` (new)
- `src/components/skills/skill-install-tabs.tsx` (new)
- `src/components/skills/skill-comments.tsx` (new)
- `package.json` — +sync:curated script
- `src/data/types.ts` — +curated source, +repoSource, +editorCommentZh
- `src/lib/supabase/types.ts` — +curated source, +repo_source, +editor_comment_zh
- `src/lib/supabase/mappers.ts` — map new fields
- `src/lib/data/skills.ts` — platform/tab/sort filters, getSkillPlatforms, getSkillRepoSources
- `src/lib/data/index.ts` — export new functions
- `src/lib/skills-search-params.ts` — +platform, tab, sort params
- `src/app/skills/page.tsx` — pass new params to toolbar/grid
- `src/components/skills/skills-toolbar.tsx` — tabs + platform filter + sort toggle
- `src/components/skills/skills-grid.tsx` — pass new params
- `src/components/skills/skill-card.tsx` — platform badge, quality tag, editor comment, repo source
- `src/app/skills/[slug]/page.tsx` — install tabs, comments, SoftwareApplication JSON-LD
- `src/components/skills/skill-sidebar.tsx` — platform, repo source, updated labels
- `src/components/shared/json-ld.tsx` — +SoftwareApplicationJsonLd
