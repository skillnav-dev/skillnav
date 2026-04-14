#!/usr/bin/env node

/**
 * Auto-translate checked papers from radar files.
 *
 * Scans ~/Vault/知识库/AI/论文雷达/*.md for `- [x] ... \`ARXIV_ID\`` lines,
 * skips papers already in DB, and runs translate-paper.mjs for each.
 *
 * Usage:
 *   node scripts/auto-translate-radar.mjs              # Translate all checked papers
 *   node scripts/auto-translate-radar.mjs --dry-run    # Preview without translating
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { createAdminClient } from "./lib/supabase-admin.mjs";
import { createLogger } from "./lib/logger.mjs";

const log = createLogger("auto-translate");

const VAULT_RADAR_DIR = path.join(
  process.env.HOME,
  "Vault/知识库/AI/论文雷达"
);

// Match checked items with arXiv ID: - [x] **title** `2604.01234` — ...
const CHECKED_RE = /^- \[x\] .+?`(\d{4}\.\d{4,5})`/;

function scanRadarFiles() {
  const files = fs
    .readdirSync(VAULT_RADAR_DIR)
    .filter((f) => f.endsWith(".md") && /^\d{4}-\d{2}-\d{2}\.md$/.test(f))
    .sort()
    .reverse(); // newest first

  const ids = [];
  for (const file of files) {
    const content = fs.readFileSync(
      path.join(VAULT_RADAR_DIR, file),
      "utf-8"
    );
    for (const line of content.split("\n")) {
      const m = line.match(CHECKED_RE);
      if (m) ids.push({ arxivId: m[1], file });
    }
  }
  return ids;
}

async function getExistingPapers(arxivIds) {
  const supabase = createAdminClient();
  const urls = arxivIds.map((id) => `https://arxiv.org/abs/${id}`);

  // Supabase IN filter, batch by 100
  const existing = new Set();
  for (let i = 0; i < urls.length; i += 100) {
    const batch = urls.slice(i, i + 100);
    const { data } = await supabase
      .from("articles")
      .select("source_url")
      .in("source_url", batch);
    if (data) {
      for (const row of data) {
        // Extract arXiv ID from URL
        const id = row.source_url.replace("https://arxiv.org/abs/", "");
        existing.add(id);
      }
    }
  }
  return existing;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  log.info(`Scanning radar files in ${VAULT_RADAR_DIR}`);
  const checked = scanRadarFiles();

  if (checked.length === 0) {
    log.info("No checked papers found in radar files.");
    return;
  }

  log.info(`Found ${checked.length} checked paper(s):`);
  for (const { arxivId, file } of checked) {
    log.info(`  ${arxivId} (${file})`);
  }

  // Deduplicate by arXiv ID (same paper may appear in multiple radars)
  const unique = [...new Map(checked.map((c) => [c.arxivId, c])).values()];
  if (unique.length < checked.length) {
    log.info(`Deduplicated: ${checked.length} → ${unique.length}`);
  }

  // Check DB for existing translations
  const existing = await getExistingPapers(unique.map((c) => c.arxivId));
  const pending = unique.filter((c) => !existing.has(c.arxivId));

  if (existing.size > 0) {
    log.info(`Already translated: ${existing.size} (${[...existing].join(", ")})`);
  }

  if (pending.length === 0) {
    log.info("All checked papers already translated. Nothing to do.");
    return;
  }

  log.info(`Papers to translate: ${pending.length}`);

  if (dryRun) {
    for (const { arxivId } of pending) {
      log.info(`  [DRY RUN] Would translate: ${arxivId}`);
    }
    return;
  }

  // Translate one by one (sequential to avoid LLM rate limits)
  const scriptPath = path.join(
    path.dirname(new URL(import.meta.url).pathname),
    "translate-paper.mjs"
  );

  let success = 0;
  let failed = 0;
  let needsManual = 0;
  const manualList = [];

  for (const { arxivId } of pending) {
    log.info(`\n${"─".repeat(60)}`);
    log.info(
      `Translating ${arxivId} (${success + failed + needsManual + 1}/${pending.length})`
    );
    log.info("─".repeat(60));

    try {
      execFileSync("node", [scriptPath, arxivId], {
        stdio: "inherit",
        timeout: 15 * 60 * 1000, // 15 min — long papers (20+ chunks) need ~10 min
      });
      success++;
    } catch (err) {
      // Exit code 2 = quality gate failed (translate-paper.mjs).
      // Needs manual MinerU fallback — do NOT count as hard failure.
      if (err.status === 2) {
        log.warn(`Quality gate failed for ${arxivId} — needs manual MinerU fallback`);
        needsManual++;
        manualList.push(arxivId);
      } else {
        log.error(`Failed to translate ${arxivId}: ${err.message}`);
        failed++;
      }
    }
  }

  log.info(`\n${"═".repeat(60)}`);
  log.info(
    `Done. Success: ${success}, Failed: ${failed}, Needs manual: ${needsManual}, Skipped: ${existing.size}`
  );

  if (manualList.length) {
    log.info(`\nManual MinerU fallback needed for ${manualList.length} paper(s):`);
    for (const id of manualList) {
      log.info(
        `  ${id}: run MinerU locally, then node scripts/translate-paper.mjs --source-md <out.md> --arxiv-id ${id} --force`
      );
    }
  }
}

main().catch((err) => {
  log.error(err.message);
  process.exit(1);
});
