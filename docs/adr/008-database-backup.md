# ADR-008: Nightly Off-site Database Backup

Date: 2026-10-09
Status: accepted

## Context

SkillNav runs on the Supabase **Free** plan, which includes no platform backups and no
point-in-time recovery. Supabase's own docs tell Free projects to export their data
themselves. Until now the only copies of production data were ad-hoc local files
(for example the ClawHub export in ADR-007), so a bad migration, a buggy backfill or
an admin mistake would have been unrecoverable.

Options considered (evaluated in the ai-colab capability repository, decision record
`edl/decisions/2026-10-09-infra-gaps.md`):

| Option | Verdict |
|---|---|
| Upgrade to Supabase Pro (7 days of daily backups) | $25/month; still no copy outside Supabase. Revisit when the project moves to Pro for other reasons |
| PITR add-on | Needs Pro plus at least Small compute, roughly $100/month for 7 days |
| `supabase db dump` | Needs Docker; meant for migrations |
| `pg_dump` + restic to R2, from GitHub Actions | Free, encrypted, off-site, tested end to end on a Supabase-shaped database |

## Decision

`.github/workflows/db-backup.yml` runs nightly at 03:17 CST:

1. `pg_dump -Fc -n public` over the Supabase session pooler. Only `public` is dumped:
   SkillNav keeps all of its data there and does not use Supabase Auth or Storage.
2. `pg_restore -f /dev/null` decodes the whole dump, so a truncated or corrupt file
   fails the job (`pg_restore --list` alone would not notice).
3. restic encrypts and uploads it to a dedicated R2 bucket, keeps 7 daily snapshots
   and checks 10% of the stored data on every run.
4. Failures notify Slack like the other workflows.

A manual run with `restore_drill = true` also restores the new snapshot into a
throwaway Postgres 17 container and compares per-table row counts with the live
database (`scripts/db/restore-drill.sh`). Tolerance is 5% or 50 rows per table,
since the sync jobs keep writing.

## Consequences

**Positive**

- Up to 7 days of encrypted copies outside Supabase, at no cost on the R2 free tier.
- The drill proves a backup can be restored, not only that it was written.

**Negative**

- Up to 24 hours of writes can be lost; there is no point-in-time recovery.
- Losing `RESTIC_PASSWORD` makes every snapshot unreadable. It must also live in a
  password manager.
- Roles, Auth and Storage are not backed up (none are in use today). Revisit if any
  of them start holding data.
- About 90 extra Actions minutes per month (one ~3-minute run a night).
