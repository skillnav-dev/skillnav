#!/usr/bin/env node

/**
 * Fix platform field for Anthropic official skills.
 * Sets platform to ["universal"] for all skills where source = 'anthropic'
 * and platform is empty or null.
 *
 * No LLM needed — simple DB update.
 *
 * Usage:
 *   node scripts/fix-anthropic-platform.mjs              # Dry run (default)
 *   node scripts/fix-anthropic-platform.mjs --apply       # Live update
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { createAdminClient } from "./lib/supabase-admin.mjs";
import { createLogger } from "./lib/logger.mjs";
import { validateEnv } from "./lib/validate-env.mjs";

const log = createLogger("fix-platform");

const PAGE_SIZE = 1000;

// ── CLI args ────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN = !args.includes("--apply");

// ── DB helpers ──────────────────────────────────────────────────────

async function fetchAnthropicSkillsMissingPlatform(supabase) {
  const allRows = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from("skills")
      .select("slug, name, platform, source")
      .eq("source", "anthropic")
      .or("platform.is.null,platform.eq.{}")
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

  log.info(`Fix Anthropic Platform -- ${new Date().toISOString()}`);
  log.info(`Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"}`);

  // ── Step 1: Fetch Anthropic skills with empty/null platform ────

  log.info("Fetching Anthropic skills where platform IS NULL or empty...");
  const skills = await fetchAnthropicSkillsMissingPlatform(supabase);
  log.info(`Found ${skills.length} Anthropic skills needing platform fix`);

  if (skills.length === 0) {
    log.info("No skills to fix. Exiting.");
    log.done();
    return;
  }

  stats.total = skills.length;

  // ── Step 2: Update each skill's platform to ["universal"] ─────

  for (let i = 0; i < skills.length; i++) {
    const skill = skills[i];

    if (i > 0 && i % 50 === 0) {
      log.info(`Progress: ${i}/${skills.length} processed, ${stats.updated} updated, ${stats.errors} errors`);
    }

    if (DRY_RUN) {
      log.info(`  [dry-run] ${skill.slug} (${skill.name}) -> platform: ["universal"]`);
    } else {
      const { error } = await supabase
        .from("skills")
        .update({ platform: ["universal"] })
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
    `\n${mode}Fix Anthropic Platform Summary:`,
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
