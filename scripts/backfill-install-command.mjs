#!/usr/bin/env node

/**
 * Backfill `install_command` for skills from their github_url.
 * Pure rule-based — no LLM needed. Generates: claude skill add --url github.com/{owner}/{repo}
 *
 * Usage:
 *   node scripts/backfill-install-command.mjs              # Dry run (default)
 *   node scripts/backfill-install-command.mjs --apply       # Live update
 *   node scripts/backfill-install-command.mjs --limit 20    # Process first N skills
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { createAdminClient } from "./lib/supabase-admin.mjs";
import { createLogger } from "./lib/logger.mjs";
import { validateEnv } from "./lib/validate-env.mjs";

const log = createLogger("backfill-install");

const PAGE_SIZE = 1000;

// ── CLI args ────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN = !args.includes("--apply");
const limitIdx = args.indexOf("--limit");
const LIMIT = limitIdx !== -1 ? Number(args[limitIdx + 1]) : Infinity;

// ── Helpers ─────────────────────────────────────────────────────────

/**
 * Extract owner/repo from a GitHub URL.
 * @param {string} url
 * @returns {{ owner: string, repo: string } | null}
 */
function extractOwnerRepo(url) {
  if (!url) return null;
  const match = url.match(
    /github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)/
  );
  if (!match) return null;
  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/, ""),
  };
}

// ── DB helpers ──────────────────────────────────────────────────────

async function fetchSkillsMissingInstallCommand(supabase) {
  const allRows = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from("skills")
      .select("slug, github_url")
      .eq("status", "published")
      .is("install_command", null)
      .not("github_url", "is", null)
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) throw new Error(`DB read skills: ${error.message}`);
    if (!data || data.length === 0) break;
    allRows.push(...data);
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return allRows;
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  validateEnv(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);

  const supabase = createAdminClient();
  const stats = { total: 0, updated: 0, skipped: 0, errors: 0 };

  log.info(`Backfill Install Command -- ${new Date().toISOString()}`);
  log.info(`Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"} | Limit: ${LIMIT === Infinity ? "none" : LIMIT}`);

  // ── Step 1: Fetch skills missing install_command ────────────────

  log.info("Fetching published skills where install_command IS NULL and github_url IS NOT NULL...");
  let skills = await fetchSkillsMissingInstallCommand(supabase);
  log.info(`Found ${skills.length} skills needing install_command`);

  if (LIMIT !== Infinity) {
    skills = skills.slice(0, LIMIT);
    log.info(`Limited to ${skills.length} skills`);
  }

  if (skills.length === 0) {
    log.info("No skills to process. Exiting.");
    log.done();
    return;
  }

  stats.total = skills.length;

  // ── Step 2: Generate and update install commands ────────────────

  for (let i = 0; i < skills.length; i++) {
    const skill = skills[i];

    if (i > 0 && i % 50 === 0) {
      log.info(`Progress: ${i}/${skills.length} processed, ${stats.updated} updated, ${stats.errors} errors`);
    }

    const parsed = extractOwnerRepo(skill.github_url);
    if (!parsed) {
      log.warn(`  Skip ${skill.slug}: cannot extract owner/repo from "${skill.github_url}"`);
      stats.skipped++;
      continue;
    }

    const installCommand = `claude skill add --url github.com/${parsed.owner}/${parsed.repo}`;

    if (DRY_RUN) {
      log.info(`  [dry-run] ${skill.slug} -> ${installCommand}`);
    } else {
      const { error } = await supabase
        .from("skills")
        .update({ install_command: installCommand })
        .eq("slug", skill.slug);

      if (error) {
        log.error(`  Failed to update ${skill.slug}: ${error.message}`);
        stats.errors++;
        continue;
      }
    }

    stats.updated++;
  }

  // ── Summary ──────────────────────────────────────────────────────

  const mode = DRY_RUN ? "[DRY RUN] " : "";
  const summaryLines = [
    `\n${mode}Backfill Install Command Summary:`,
    `  Total: ${stats.total}`,
    `  Updated: ${stats.updated}`,
    `  Skipped: ${stats.skipped}`,
    `  Errors: ${stats.errors}`,
  ];

  log.summary(summaryLines.join("\n"));
  log.setOutput("updated", stats.updated);
  log.setOutput("errors", stats.errors);
  log.done();

  if (stats.errors > 0) process.exit(1);
}

main().catch((err) => {
  log.error(err.message);
  process.exit(1);
});
