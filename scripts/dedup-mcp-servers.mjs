#!/usr/bin/env node

/**
 * Deduplicate MCP servers by github_url.
 *
 * Finds published servers sharing the same github_url, keeps the one with the
 * highest stars (ties broken by earliest created_at), and marks the rest hidden.
 *
 * Modes:
 *   --dry-run    Preview duplicate groups (no DB changes)
 *   --apply      Execute deduplication
 *
 * Examples:
 *   node scripts/dedup-mcp-servers.mjs --dry-run
 *   node scripts/dedup-mcp-servers.mjs --apply
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { createAdminClient } from "./lib/supabase-admin.mjs";
import { createLogger } from "./lib/logger.mjs";
import { validateEnv } from "./lib/validate-env.mjs";

const log = createLogger("dedup-mcp");

// ── CLI args ──────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const applyMode = args.includes("--apply");

if (!dryRun && !applyMode) {
  console.log("Usage: node scripts/dedup-mcp-servers.mjs [--dry-run | --apply]");
  console.log("  --dry-run  Preview duplicate groups (no DB writes)");
  console.log("  --apply    Execute deduplication (hide duplicates)");
  process.exit(1);
}

// ── Constants ─────────────────────────────────────────────────────────

const PAGE_SIZE = 1000;
const BATCH_SIZE = 100;

// ── DB helpers ────────────────────────────────────────────────────────

/**
 * Fetch all published servers with a github_url.
 */
async function fetchPublishedWithGithub(supabase) {
  const allRows = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from("mcp_servers")
      .select("slug, name, github_url, stars, status, created_at")
      .eq("status", "published")
      .not("github_url", "is", null)
      .order("stars", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) throw new Error(`DB read: ${error.message}`);
    if (!data || data.length === 0) break;
    allRows.push(...data);
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return allRows;
}

/**
 * Normalize a name for fuzzy comparison: lowercase, strip common prefixes/suffixes,
 * remove non-alphanumeric characters.
 */
function normalizeName(name) {
  return (name || "")
    .toLowerCase()
    .replace(/^(mcp[-_ ]?server[-_ ]?|mcp[-_ ]?)/i, "")
    .replace(/[-_ ]/g, "")
    .trim();
}

/**
 * Group servers by github_url, then sub-group by similar name.
 * Only servers with the same github_url AND similar name are considered duplicates.
 * This prevents monorepo servers (same repo, different tools) from being deduped.
 *
 * @returns {Map<string, Array>} composite_key → sorted array of servers
 */
function findDuplicateGroups(servers) {
  // Step 1: Group by github_url
  const urlGroups = new Map();
  for (const s of servers) {
    const normalized = s.github_url.replace(/\/+$/, "").toLowerCase();
    if (!urlGroups.has(normalized)) {
      urlGroups.set(normalized, []);
    }
    urlGroups.get(normalized).push(s);
  }

  // Step 2: Within each url group, sub-group by normalized name
  const dupes = new Map();
  for (const [url, members] of urlGroups) {
    if (members.length <= 1) continue;

    const nameGroups = new Map();
    for (const s of members) {
      const nName = normalizeName(s.name);
      // Find existing group with similar name
      let matched = false;
      for (const [key, group] of nameGroups) {
        if (nName === key || nName.includes(key) || key.includes(nName)) {
          group.push(s);
          matched = true;
          break;
        }
      }
      if (!matched) {
        nameGroups.set(nName, [s]);
      }
    }

    // Only keep sub-groups with > 1 member (actual duplicates)
    for (const [nName, subGroup] of nameGroups) {
      if (subGroup.length > 1) {
        subGroup.sort((a, b) => {
          if (b.stars !== a.stars) return b.stars - a.stars;
          return new Date(a.created_at) - new Date(b.created_at);
        });
        const key = `${url} [${nName}]`;
        dupes.set(key, subGroup);
      }
    }
  }

  return dupes;
}

// ── Main ──────────────────────────────────────────────────────────────

async function main() {
  validateEnv(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
  const supabase = createAdminClient();

  log.info(`MCP Server Deduplication — ${new Date().toISOString()}`);
  log.info(`Mode: ${dryRun ? "DRY RUN" : "APPLY"}`);

  // ── Step 1: Fetch published servers with github_url ────────────────

  log.info("Fetching published servers with github_url...");
  const servers = await fetchPublishedWithGithub(supabase);
  log.info(`Loaded ${servers.length} servers`);

  // ── Step 2: Find duplicate groups ──────────────────────────────────

  const dupeGroups = findDuplicateGroups(servers);

  if (dupeGroups.size === 0) {
    log.success("No duplicates found.");
    log.done();
    return;
  }

  log.info(`Found ${dupeGroups.size} duplicate groups`);

  // ── Step 3: Build update list ──────────────────────────────────────

  const updates = []; // slugs to hide
  let totalDupes = 0;

  for (const [url, members] of dupeGroups) {
    const keeper = members[0];
    const toHide = members.slice(1);
    totalDupes += toHide.length;

    // key format: "url [normalizedName]"
    const repoPath = url.replace(/^https?:\/\/github\.com\//, "");

    log.info(`\n  ${repoPath}: ${members.length} entries`);
    log.info(`    KEEP: ${keeper.slug} (stars=${keeper.stars})`);

    for (const dup of toHide) {
      log.info(`    HIDE: ${dup.slug} (stars=${dup.stars})`);
      updates.push({ slug: dup.slug, status: "hidden" });
    }
  }

  // ── Step 4: Apply updates ──────────────────────────────────────────

  if (applyMode && updates.length > 0) {
    log.info(`\nApplying ${updates.length} updates...`);
    let errors = 0;

    for (let i = 0; i < updates.length; i++) {
      const { slug, status } = updates[i];
      const { error } = await supabase
        .from("mcp_servers")
        .update({ status })
        .eq("slug", slug);
      if (error) {
        log.error(`Failed to hide ${slug}: ${error.message}`);
        errors++;
      }
      if ((i + 1) % 50 === 0 || i === updates.length - 1) {
        log.info(`  Progress: ${i + 1}/${updates.length}`);
      }
    }

    if (errors > 0) {
      log.error(`${errors} updates failed`);
    } else {
      log.success(`Hidden ${updates.length} duplicate servers`);
    }
  }

  // ── Summary ────────────────────────────────────────────────────────

  const mode = dryRun ? "[DRY RUN]" : "[APPLIED]";
  const summaryLines = [
    `\n${mode} Deduplication Summary:`,
    `  Duplicate groups: ${dupeGroups.size}`,
    `  Servers to hide: ${totalDupes}`,
    `  Servers kept: ${dupeGroups.size}`,
  ];

  log.summary(summaryLines.join("\n"));
  log.done();
}

main().catch((err) => {
  log.error(err.message);
  process.exit(1);
});
