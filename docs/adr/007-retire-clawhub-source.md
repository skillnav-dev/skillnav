# ADR-007: Retire the ClawHub Skills Source

Date: 2026-08-23
Status: accepted

## Context

`Sync Skills` had been failing every week since at least 2026-08-03. Root cause: the
upstream `openclaw/skills` GitHub repo — which backed every ClawHub listing — was
deleted. The sync script fetched skill files through the GitHub Git Trees API, so
every run ended in a hard 404.

The failure had been silently degrading the site for months:

- **9,252 rows (97% of the 9,562-row `skills` table) were dead links.** Every
  `github_url` pointed into the deleted repo, and the legacy
  `clawhub.com/skills/{author}/{name}` paths returned 404 as well.
- `skill-install-tabs.tsx` derived install commands from `github_url`, so ~7,902
  skill pages (those without an explicit `install_command`) handed users a
  `claude skill add --url https://github.com/openclaw/skills` that could not work.
- The data was low quality independent of the dead links: `stars` held only two
  distinct values across all 9,252 rows (3387 / 4460), `description_zh` was empty
  on every row, and `is_featured` was set on none.
- Nobody noticed for four months, which is itself evidence the pages carried no
  meaningful traffic.

ClawHub still exists and now serves a REST API at `clawhub.ai/api/v1`. Migrating to
it was implemented and measured before being rejected:

- **Catalog size ≥68,000 and not exhausted.** Cursor enumeration was still growing
  linearly (~4,800 unique/50 pages) after 24 minutes and 700 pages. Measured against
  the real sync script, 3,000 skills took 13.6 minutes, so ≥68k extrapolates to
  ~5 hours of detail fetches plus ~24 minutes of enumeration — against a 90-minute
  CI ceiling. This, not the error rate, is the blocking constraint.
- **A material share of detail requests return a permanent 409**, unevenly
  distributed: 9.5% across the first 3,000 skills, but 23–24% in narrower samples
  that happened to land on dense clusters of unservable slugs. Retries recover none
  of them (0/17) — these are moderated-away or broken registry records, not rate
  limiting. Reclassifying 409 as skipped rather than error keeps the failure
  threshold at 0%, so this alone would not have blocked the migration.
- Growing from 9,562 to 68,000+ listings in four months, with a quarter of them
  unservable, indicates a registry optimised for volume rather than curation.

## Decision

Retire the ClawHub source entirely rather than migrate it.

1. Deleted all 9,252 `source = 'clawhub'` rows. Full backup written to
   `data/backups/skills-clawhub-2026-08-23.json` (70MB, includes 2,369 `name_zh`
   translations and 3 `editor_comment_zh` entries) before deletion.
2. Removed the `clawhub` job from `.github/workflows/sync-skills.yml`. The
   `anthropic` job had `needs: clawhub`, so ClawHub's failure had been skipping
   Anthropic syncs too — that coupling is now gone.
3. Reverted the in-progress migration of `scripts/sync-clawhub.mjs`.
4. Added `src/lib/skill-source.ts` so any remaining dead upstream URL is suppressed
   in install commands and link cards instead of being rendered.

The `skills` table now holds 310 curated rows (18 anthropic, 168 curated, 124 other).

## Consequences

**Positive**

- No more weekly CI failures or Slack noise from a source that cannot be fixed.
- Anthropic skill sync is unblocked for the first time since the coupling broke it.
- The catalogue reflects the product's actual position — curated and translated for
  Chinese developers — rather than padding the count with 9k unusable entries.

**Negative**

- 9,252 URLs now 404. These pages were already broken for users; search engines will
  drop them over time. No redirect target exists because the upstream content is gone.
- Visible skill count drops from 9,562 to 310. This is a large optical regression,
  accepted because the removed 97% were non-functional.
- 2,369 machine-translated Chinese names are discarded (preserved in the backup).

**Follow-up**

- Growing the curated set is now a content problem, not a sync problem. Sourcing
  should favour registries that expose stable per-skill URLs.
- If ClawHub later publishes a curated or ranked subset, revisit with a top-N
  strategy rather than full enumeration.
