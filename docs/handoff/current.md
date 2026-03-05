# Handoff — Skills 2.0: Curated Gallery (Deployed)

## Objective
Transform SkillNav's Skills module from a ClawHub mirror (6,447 low-quality skills) into a curated cross-platform gallery, positioning as "Wirecutter for AI Agent Skills".

## Current State
### Completed
- **DB migration applied** — `20260306_skills_curated.sql` executed in production Supabase
  - `repo_source`, `editor_comment_zh` columns added
  - `skills_source_check` constraint updated (supports `curated`)
  - GIN index on `platform`, B-tree index on `repo_source`
  - 6,430 ClawHub skills set to `is_hidden=TRUE`
- **Data synced** — 85 curated skills upserted (0 errors)
  - anthropics/skills: 17 (claude)
  - openai/codex: 2 (codex)
  - daymade/claude-code-skills: 41 (claude)
  - levnikolaevich/claude-code-skills: 25 (claude)
- **Adapter fixes** — levnikolaevich branch `main` → `master`, LEVN_PICKS corrected to real directory names
- **Lint clean** — removed unused `dryRun` param in `syncAdapter()`
- **Frontend deployed** — listing (tabs/platform filter/sort), card (badges/editor comment), detail (install tabs/comments/JSON-LD)
- **CI deployment** — all commits pushed, Cloudflare Workers deploy successful

### In Progress
- Nothing — all work complete and deployed

## Next Actions
1. **Setup Giscus comments**: create `skillnav-dev/discussions` public repo, enable Discussions, install giscus app, fill `repoId`/`categoryId` in `src/components/skills/skill-comments.tsx:GISCUS_CONFIG`
2. **Add editor comments**: populate `editor_comment_zh` for curated skills (manual or LLM-assisted batch)
3. **Homepage refresh**: update featured skills section to pull from curated source instead of ClawHub
4. **Add more sources**: consider `alirezarezvani/claude-skills` (2.3K★, ~15 skills), `developer-kit` (132★), `neon` (32★)

## Risks & Decisions
- **Giscus not configured**: `skill-comments.tsx` renders nothing until `repoId`/`categoryId` are filled
- **ClawHub hidden**: 6,430 skills hidden from listings, detail pages still accessible via direct URL
- **Anthropic source overlap**: 17 skills from `anthropic` source (old) coexist with 17 from `curated` source (new anthropics/skills adapter) — may have slug conflicts if not deduplicated

## Verification
- `npm run build` — 0 errors (verified)
- `npm run lint` — 0 warnings (verified)
- `node scripts/sync-curated-skills.mjs --dry-run` — 85 skills, 0 errors (verified)
- Production: skillnav.dev/skills — curated gallery live

## Key Commits
- `3515b7b` — wip: skills 2.0 curated gallery — full implementation
- `c7a6e4a` — fix(skills): correct levnikolaevich adapter branch and pick list
- `6b818bd` — fix(scripts): remove unused dryRun param in syncAdapter
