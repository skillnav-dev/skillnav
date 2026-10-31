# ADR-009: Unpublish and Rebuild the Skills / MCP Catalog (Quality over Quantity)

Date: 2026-10-31
Status: accepted
Supersedes: the B-tier long-tail part of ADR-001

## Context

An audit on 2026-10-31 found the catalog had quietly gone stale (issues #8–#11):

- `mcp_servers` held ~55,300 rows; ~4,200 were published, most of them B-tier
  auto-published under ADR-001's "full index + long tail" strategy.
- Refresh Tool Metadata had not succeeded since 2026-08-04, so stars and
  freshness on every published page were ~3 months old.
- Govern MCP Servers had never succeeded (partial-column upsert vs. NOT NULL),
  so the tiering that was supposed to keep the long tail clean never ran.
- Timeouts surface as `cancelled`, which skipped every `if: failure()` alert.

The product owner decided to clear the catalog and rebuild it with strict
inclusion criteria ("宁缺毋滥"), accepting the SEO loss of the long-tail pages.

## Decision

1. **Unpublish, don't delete.** Every published Skill / MCP row is set to
   `status = hidden`, except editor picks (`quality_tier = 'S'`), which stay
   live until re-reviewed. `scripts/unpublish-catalog.mjs` writes a snapshot
   of the hidden slugs first; `--restore` replays it. Run through the
   `Unpublish Catalog` workflow, which keeps the snapshot as an artifact for
   90 days. Full row data is covered by the nightly `Database Backup` (ADR-008);
   trigger it manually right before `apply`.
2. **Hidden / draft detail pages return 404.** `getSkillBySlug` and
   `getMcpServerBySlug` now only return published rows. Previously MCP drafts
   rendered (noindex) at any slug.
3. **No auto-publishing.** Sync jobs only insert drafts (already true). The
   Govern MCP schedule is removed; it may only be run manually in audit mode.
   Rows are published from a reviewed whitelist.
4. **Inclusion criteria** (all must hold):
   - MCP: official / vendor-maintained, or ≥ 500 GitHub stars; pushed within
     6 months and not archived; documented install/config; reviewed Chinese
     intro. Target 100–200.
   - Skills: official repos (anthropics, openai, …) or a known vendor/author
     repo with ≥ 200 stars; SKILL.md parses and install command works; updated
     within 6 months; reviewed Chinese name and description. Target 50–100.
5. Physical deletion of the remaining draft / hidden rows is a separate,
   later decision after 2–4 weeks of the new catalog running.

## Consequences

- ~4,000 MCP and ~250 Skills URLs go 404 (within the 24h ISR window). Google
  will drop them; we accept that. No mass 301s — they would be treated as
  soft 404s anyway.
- Metadata refresh (#8) can be limited to published rows, shrinking it from
  ~55k repos to a few hundred and fixing the timeouts.
- Follow-up work: candidate-list script against the criteria, whitelist
  publish, pipeline fixes in #8, #10, #11.
