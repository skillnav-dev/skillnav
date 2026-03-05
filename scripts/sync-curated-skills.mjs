#!/usr/bin/env node

/**
 * Sync curated skills from multiple GitHub repos to Supabase.
 * Uses adapter pattern — each repo has its own path-finding + slug logic.
 *
 * Usage:
 *   node scripts/sync-curated-skills.mjs                       # Sync all repos
 *   node scripts/sync-curated-skills.mjs --dry-run              # Preview only
 *   node scripts/sync-curated-skills.mjs --repo anthropics/skills  # Single repo
 *   node scripts/sync-curated-skills.mjs --limit 10             # Limit items per repo
 *   node scripts/sync-curated-skills.mjs --skip-existing        # Skip if slug exists
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { createAdminClient } from "./lib/supabase-admin.mjs";
import { githubFetch, githubFetchRaw } from "./lib/github.mjs";
import { createLogger } from "./lib/logger.mjs";
import { categorize } from "./lib/categorize.mjs";
import { validateEnv } from "./lib/validate-env.mjs";
import { withRetry } from "./lib/retry.mjs";
import { CURATED_ADAPTERS, findAdapter } from "./lib/curated-adapters.mjs";

const log = createLogger("curated");

// ─── SKILL.md parser (shared with sync-clawhub.mjs) ─────────────────

function parseSkillMd(content) {
  const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);

  if (!fmMatch) {
    return parseMarkdownOnly(content);
  }

  const yamlStr = fmMatch[1];
  const fields = {};

  for (const line of yamlStr.split("\n")) {
    const match = line.match(/^(\w[\w-]*):\s*(.+)/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      fields[key] = value;
    }
  }

  // Extract tags
  const tagsMatch = yamlStr.match(/tags:\s*\[(.*?)\]/);
  if (tagsMatch) {
    fields.tags = tagsMatch[1]
      .split(",")
      .map((t) => t.trim().replace(/['"]/g, ""))
      .filter(Boolean);
  }
  if (!fields.tags) {
    const nestedTagsMatch = yamlStr.match(/"tags":\s*\[([^\]]*)\]/);
    if (nestedTagsMatch) {
      fields.tags = nestedTagsMatch[1]
        .split(",")
        .map((t) => t.trim().replace(/['"]/g, ""))
        .filter(Boolean);
    }
  }

  // Extract openclaw metadata
  const openclawBlockMatch = yamlStr.match(
    /openclaw:\s*\n((?:[ \t]+.+\n?)*)/
  );
  if (openclawBlockMatch) {
    const blockLines = openclawBlockMatch[1];
    const installMatch = blockLines.match(/[ \t]+install:\s*(.+)/);
    if (installMatch) {
      fields.install = installMatch[1].trim().replace(/^["']|["']$/g, "");
    }

    const envInline = blockLines.match(/[ \t]+env:\s*\[([^\]]*)\]/);
    if (envInline) {
      fields.requiresEnv = envInline[1]
        .split(",")
        .map((v) => v.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    }

    const binsInline = blockLines.match(/[ \t]+bins:\s*\[([^\]]*)\]/);
    if (binsInline) {
      fields.requiresBins = binsInline[1]
        .split(",")
        .map((v) => v.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    }
  }

  const rawBody = content.slice(fmMatch[0].length).trim();
  const body =
    rawBody.length > 50000
      ? rawBody.slice(0, 50000) + "\n\n<!-- truncated -->"
      : rawBody;

  return { ...fields, body };
}

function parseMarkdownOnly(content) {
  const nameMatch = content.match(/^#\s+(.+)/m);
  if (!nameMatch) return null;

  const name = nameMatch[1].trim();
  const afterHeading = content
    .slice(nameMatch.index + nameMatch[0].length)
    .trim();
  const descMatch = afterHeading.match(/^([^\n#][^\n]{0,300})/);
  const description = descMatch
    ? descMatch[1].replace(/\*\*/g, "").trim()
    : "";

  return { name, description, body: afterHeading };
}

// ─── Sync a single adapter ──────────────────────────────────────────

async function syncAdapter(adapter, { limit, skipExisting, existingSlugs }) {
  const repoLabel = `${adapter.owner}/${adapter.repo}`;
  log.info(`\n${"═".repeat(60)}`);
  log.info(`Syncing: ${repoLabel} (platform: ${adapter.platform.join(", ")})`);

  // Fetch repo tree
  const tree = await withRetry(
    () =>
      githubFetch(
        `/repos/${adapter.owner}/${adapter.repo}/git/trees/${adapter.ref}?recursive=1`
      ),
    { label: `tree:${repoLabel}` }
  );

  // Find SKILL.md paths via adapter
  let paths = adapter.findSkillPaths(tree.tree);
  log.info(`Found ${paths.length} SKILL.md files`);

  // Apply adapter-level filter (e.g. pick list)
  if (adapter.shouldInclude) {
    const before = paths.length;
    paths = paths.filter((p) => adapter.shouldInclude(p));
    log.info(`Filtered: ${before} → ${paths.length} (adapter pick list)`);
  }

  // Skip existing slugs
  if (skipExisting && existingSlugs) {
    const before = paths.length;
    paths = paths.filter((p) => !existingSlugs.has(adapter.makeSlug(p)));
    if (before !== paths.length) {
      log.info(`Skipped ${before - paths.length} existing, ${paths.length} remaining`);
    }
  }

  // Apply limit
  if (limit !== Infinity) {
    paths = paths.slice(0, limit);
  }

  const total = paths.length;
  if (total === 0) {
    log.info(`No skills to process for ${repoLabel}`);
    return { skills: [], errors: 0 };
  }

  const skills = [];
  let errors = 0;
  const CONCURRENCY = process.env.CI ? 10 : 3;

  for (let idx = 0; idx < paths.length; idx += CONCURRENCY) {
    const chunk = paths.slice(idx, idx + CONCURRENCY);

    const results = await Promise.allSettled(
      chunk.map(async (path) => {
        const content = await withRetry(
          () => githubFetchRaw(adapter.owner, adapter.repo, path, adapter.ref),
          { label: path, maxRetries: 2 }
        );
        return { path, content };
      })
    );

    for (const result of results) {
      if (result.status === "rejected") {
        log.warn(`Fetch error: ${result.reason.message}`);
        errors++;
        continue;
      }

      const { path, content } = result.value;
      try {
        const parsed = parseSkillMd(content);
        if (!parsed) {
          log.warn(`Failed to parse: ${path}`);
          errors++;
          continue;
        }

        const slug = adapter.makeSlug(path);
        const tags = Array.isArray(parsed.tags)
          ? parsed.tags
          : typeof parsed.tags === "string"
            ? parsed.tags.split(",").map((t) => t.trim()).filter(Boolean)
            : [];

        // Extract author from parsed data or path
        const dirParts = path.split("/");
        const dirName = dirParts[dirParts.length - 2];
        const author = parsed.author || adapter.owner;

        skills.push({
          slug,
          name: parsed.name || dirName,
          description: parsed.description || "",
          author,
          category: categorize(
            parsed.name || dirName,
            tags,
            parsed.description || ""
          ),
          tags,
          source: "curated",
          repo_source: repoLabel,
          source_url: `https://github.com/${repoLabel}/tree/${adapter.ref}/${path.replace("/SKILL.md", "")}`,
          github_url: `https://github.com/${repoLabel}/tree/${adapter.ref}/${path.replace("/SKILL.md", "")}`,
          stars: 0,
          downloads: 0,
          security_score: "unscanned",
          platform: adapter.platform,
          content: parsed.body || "",
          install_command: parsed.install || null,
          requires_env: parsed.requiresEnv || [],
          requires_bins: parsed.requiresBins || [],
          is_hidden: false,
        });
      } catch (e) {
        log.warn(`Parse error ${path}: ${e.message}`);
        errors++;
      }
    }

    // Rate limit between batches
    await new Promise((r) => setTimeout(r, process.env.CI ? 20 : 50));

    const processed = Math.min(idx + CONCURRENCY, paths.length);
    log.progress(processed, total, errors, chunk[chunk.length - 1]);
  }

  log.progressEnd();
  log.info(`${repoLabel}: parsed ${skills.length} skills (${errors} errors)`);

  return { skills, errors };
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const skipExisting = args.includes("--skip-existing");
  const repoIdx = args.indexOf("--repo");
  const repoFilter = repoIdx !== -1 ? args[repoIdx + 1] : null;
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx !== -1 ? Number(args[limitIdx + 1]) : Infinity;

  log.info(`Curated Skills Sync — ${new Date().toISOString()}`);
  log.info(`Mode: ${dryRun ? "DRY RUN" : "LIVE"} | Limit: ${limit === Infinity ? "none" : limit}`);

  let supabase;
  if (!dryRun) {
    validateEnv(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
    supabase = createAdminClient();
  }

  // Determine which adapters to run
  let adapters = CURATED_ADAPTERS;
  if (repoFilter) {
    const adapter = findAdapter(repoFilter);
    if (!adapter) {
      log.error(`Unknown repo: ${repoFilter}. Available: ${CURATED_ADAPTERS.map((a) => `${a.owner}/${a.repo}`).join(", ")}`);
      process.exit(1);
    }
    adapters = [adapter];
  }

  // Pre-fetch existing slugs if needed
  let existingSlugs = null;
  if (skipExisting && supabase) {
    log.info("Fetching existing curated slugs...");
    const { data, error } = await supabase
      .from("skills")
      .select("slug")
      .eq("source", "curated");
    if (error) throw error;
    existingSlugs = new Set(data.map((r) => r.slug));
    log.info(`Found ${existingSlugs.size} existing curated skills`);
  }

  // Sync each adapter
  const allSkills = [];
  let totalErrors = 0;

  for (const adapter of adapters) {
    const { skills, errors } = await syncAdapter(adapter, {
      dryRun,
      limit,
      skipExisting,
      existingSlugs,
    });
    allSkills.push(...skills);
    totalErrors += errors;
  }

  log.info(`\n${"═".repeat(60)}`);
  log.info(`Total: ${allSkills.length} skills from ${adapters.length} repos (${totalErrors} errors)`);

  if (dryRun) {
    log.info("\n[DRY RUN] Sample skills:");
    for (const s of allSkills.slice(0, 10)) {
      log.info(`  ${s.slug}: ${s.name} [${s.category}] (${s.repo_source}) platform=${s.platform}`);
    }
    log.info(`[DRY RUN] Would upsert ${allSkills.length} skills`);
    log.done();
    return;
  }

  if (allSkills.length === 0) {
    log.info("No skills to upsert");
    log.done();
    return;
  }

  // Deduplicate by slug
  const slugMap = new Map();
  const dedupedSkills = [];
  for (const skill of allSkills) {
    if (slugMap.has(skill.slug)) {
      log.warn(`Duplicate slug: ${skill.slug} (keeping first)`);
      continue;
    }
    slugMap.set(skill.slug, true);
    dedupedSkills.push(skill);
  }

  const dupeCount = allSkills.length - dedupedSkills.length;
  if (dupeCount > 0) {
    log.info(`Deduplicated: ${allSkills.length} → ${dedupedSkills.length}`);
  }

  // Batch upsert
  const BATCH_SIZE = 100;
  let upserted = 0;

  for (let i = 0; i < dedupedSkills.length; i += BATCH_SIZE) {
    const batch = dedupedSkills.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from("skills")
      .upsert(batch, { onConflict: "slug" });

    if (error) {
      log.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} error: ${error.message}`);
    } else {
      upserted += batch.length;
      log.info(`Upsert batch ${Math.floor(i / BATCH_SIZE) + 1}: +${batch.length} (total: ${upserted})`);
    }
  }

  // Summary
  const summaryLines = [
    "## Curated Skills Sync Summary",
    "",
    "| Metric | Value |",
    "|--------|-------|",
    `| Repos | ${adapters.length} |`,
    `| Total parsed | ${allSkills.length} |`,
    `| Deduplicated | ${dedupedSkills.length} |`,
    `| Upserted | ${upserted} |`,
    `| Errors | ${totalErrors} |`,
    "",
    "### By Repo",
    "",
    "| Repo | Platform | Skills |",
    "|------|----------|--------|",
    ...adapters.map((a) => {
      const count = allSkills.filter(
        (s) => s.repo_source === `${a.owner}/${a.repo}`
      ).length;
      return `| ${a.owner}/${a.repo} | ${a.platform.join(", ")} | ${count} |`;
    }),
  ];
  log.summary(summaryLines.join("\n"));
  log.done();

  if (totalErrors > allSkills.length * 0.2) process.exit(1);
}

main().catch((e) => {
  log.error(e.message);
  process.exit(1);
});
