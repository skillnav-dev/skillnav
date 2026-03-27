#!/usr/bin/env node

/**
 * Sync skills from OpenClaw/ClawHub ecosystem to Supabase.
 * Fetches SKILL.md files from the openclaw/skills GitHub repo.
 *
 * Usage:
 *   node scripts/sync-clawhub.mjs                          # Full sync
 *   node scripts/sync-clawhub.mjs --dry-run                # Preview only
 *   node scripts/sync-clawhub.mjs --limit 50               # Limit items
 *   node scripts/sync-clawhub.mjs --offset 2000 --limit 2000  # Stage sync (2001-4000)
 *   node scripts/sync-clawhub.mjs --offset 6000 --limit 2367 --skip-existing  # Retry failed only
 *   node scripts/sync-clawhub.mjs --backfill-content                         # Fill NULL content from GitHub
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import { createAdminClient } from "./lib/supabase-admin.mjs";
import { githubFetch, githubFetchRaw } from "./lib/github.mjs";
import { createLogger } from "./lib/logger.mjs";
import { categorize } from "./lib/categorize.mjs";
import { validateEnv } from "./lib/validate-env.mjs";

const log = createLogger("clawhub");

const REPO_OWNER = "openclaw";
const REPO_NAME = "skills";

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Parse SKILL.md content into structured data.
 * Handles both flat YAML fields and nested metadata blocks.
 */
function parseSkillMd(content) {
  const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);

  // Fallback: parse pure Markdown (no YAML frontmatter)
  if (!fmMatch) {
    return parseMarkdownOnly(content);
  }

  const yamlStr = fmMatch[1];
  const fields = {};

  // Simple YAML parser for top-level key-value pairs
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

  // Extract tags from top-level: tags: [a, b, c]
  const tagsMatch = yamlStr.match(/tags:\s*\[(.*?)\]/);
  if (tagsMatch) {
    fields.tags = tagsMatch[1]
      .split(",")
      .map((t) => t.trim().replace(/['"]/g, ""))
      .filter(Boolean);
  }

  // Extract tags from nested metadata (openclaw/clawdbot blocks)
  if (!fields.tags) {
    const nestedTagsMatch = yamlStr.match(/"tags":\s*\[([^\]]*)\]/);
    if (nestedTagsMatch) {
      fields.tags = nestedTagsMatch[1]
        .split(",")
        .map((t) => t.trim().replace(/['"]/g, ""))
        .filter(Boolean);
    }
  }

  // Extract openclaw metadata block (nested YAML under metadata > openclaw)
  // Handles: requires.env, requires.bins, install
  const openclawBlockMatch = yamlStr.match(/openclaw:\s*\n((?:[ \t]+.+\n?)*)/);
  if (openclawBlockMatch) {
    const blockLines = openclawBlockMatch[1];

    // Extract install command (scalar value only, skip YAML list items)
    const installMatch = blockLines.match(/[ \t]+install:\s*(?![-\[])(.+)/);
    if (installMatch) {
      fields.install = installMatch[1].trim().replace(/^["']|["']$/g, "");
    }

    // Extract requires.env array (inline or multiline)
    const requiresEnvInlineMatch = blockLines.match(/[ \t]+env:\s*\[([^\]]*)\]/);
    if (requiresEnvInlineMatch) {
      fields.requiresEnv = requiresEnvInlineMatch[1]
        .split(",")
        .map((v) => v.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    } else {
      // Multiline list items under env:
      const requiresEnvSectionMatch = blockLines.match(/[ \t]+env:\s*\n((?:[ \t]+-[ \t]+.+\n?)*)/);
      if (requiresEnvSectionMatch) {
        fields.requiresEnv = requiresEnvSectionMatch[1]
          .split("\n")
          .map((l) => l.replace(/^[ \t]+-[ \t]+/, "").trim().replace(/^["']|["']$/g, ""))
          .filter(Boolean);
      }
    }

    // Extract requires.bins array (inline or multiline)
    const requiresBinsInlineMatch = blockLines.match(/[ \t]+bins:\s*\[([^\]]*)\]/);
    if (requiresBinsInlineMatch) {
      fields.requiresBins = requiresBinsInlineMatch[1]
        .split(",")
        .map((v) => v.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    } else {
      // Multiline list items under bins:
      const requiresBinsSectionMatch = blockLines.match(/[ \t]+bins:\s*\n((?:[ \t]+-[ \t]+.+\n?)*)/);
      if (requiresBinsSectionMatch) {
        fields.requiresBins = requiresBinsSectionMatch[1]
          .split("\n")
          .map((l) => l.replace(/^[ \t]+-[ \t]+/, "").trim().replace(/^["']|["']$/g, ""))
          .filter(Boolean);
      }
    }
  }

  const rawBody = content.slice(fmMatch[0].length).trim();

  // Truncate body if it exceeds 50000 characters to avoid DB payload limits
  const body =
    rawBody.length > 50000
      ? rawBody.slice(0, 50000) + "\n\n<!-- truncated -->"
      : rawBody;

  return { ...fields, body };
}

/**
 * Fallback parser for SKILL.md without YAML frontmatter.
 * Extracts name from first heading and description from first paragraph.
 */
function parseMarkdownOnly(content) {
  const nameMatch = content.match(/^#\s+(.+)/m);
  if (!nameMatch) return null;

  const name = nameMatch[1].trim();

  // First non-empty paragraph after the heading
  const afterHeading = content.slice(nameMatch.index + nameMatch[0].length).trim();
  const descMatch = afterHeading.match(/^([^\n#][^\n]{0,300})/);
  const description = descMatch ? descMatch[1].replace(/\*\*/g, "").trim() : "";

  return { name, description, body: afterHeading };
}

/**
 * Fetch repo tree and find all SKILL.md files.
 */
async function fetchSkillFiles() {
  log.info(`Fetching repo tree from ${REPO_OWNER}/${REPO_NAME}...`);

  const tree = await githubFetch(
    `/repos/${REPO_OWNER}/${REPO_NAME}/git/trees/main?recursive=1`
  );

  const skillFiles = tree.tree.filter(
    (item) => item.type === "blob" && item.path.endsWith("SKILL.md")
  );

  log.info(`Found ${skillFiles.length} SKILL.md files`);
  return skillFiles;
}

/**
 * Backfill NULL content by querying DB for github_url, fetching SKILL.md,
 * and updating only content-related fields. Avoids slug mismatch issues.
 */
async function backfillContentFromDb(supabase, { dryRun, limit }) {
  if (!supabase) {
    log.info("[DRY RUN] Backfill requires DB connection, skipping");
    log.done();
    return;
  }

  // Fetch all NULL-content clawhub skills with github_url
  log.info("Fetching NULL-content skills with github_url from DB...");
  const skillsToBackfill = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data: rows, error } = await supabase
      .from("skills")
      .select("slug, github_url")
      .is("content", null)
      .eq("source", "clawhub")
      .not("github_url", "is", null)
      .range(from, from + pageSize - 1);
    if (error) throw error;
    skillsToBackfill.push(...rows);
    if (rows.length < pageSize) break;
    from += pageSize;
  }

  let toProcess = skillsToBackfill;
  if (limit !== Infinity) toProcess = toProcess.slice(0, limit);
  const total = toProcess.length;
  log.info(`Found ${skillsToBackfill.length} skills to backfill, processing ${total}`);

  const CONCURRENCY = process.env.CI ? 10 : 3;
  let updated = 0;
  let errors = 0;

  for (let idx = 0; idx < toProcess.length; idx += CONCURRENCY) {
    const chunk = toProcess.slice(idx, idx + CONCURRENCY);
    const results = await Promise.allSettled(
      chunk.map(async ({ slug, github_url }) => {
        // Extract path: .../tree/main/skills/author/name → skills/author/name/SKILL.md
        const pathMatch = github_url.match(/tree\/main\/(.+)/);
        if (!pathMatch) throw new Error(`Bad github_url: ${github_url}`);
        const filePath = `${pathMatch[1]}/SKILL.md`;

        const content = await githubFetchRaw("openclaw", "skills", filePath);
        const parsed = parseSkillMd(content);
        if (!parsed) throw new Error(`Failed to parse ${filePath}`);

        return {
          slug,
          content: parsed.body || "",
          install_command: parsed.install || null,
          requires_env: parsed.requiresEnv || [],
          requires_bins: parsed.requiresBins || [],
        };
      })
    );

    for (const result of results) {
      if (result.status === "rejected") {
        log.warn(`Fetch error: ${result.reason.message}`);
        errors++;
        continue;
      }

      const { slug, ...contentFields } = result.value;
      if (dryRun) {
        updated++;
        continue;
      }

      const { error } = await supabase
        .from("skills")
        .update(contentFields)
        .eq("slug", slug);

      if (error) {
        log.warn(`Update error for ${slug}: ${error.message}`);
        errors++;
      } else {
        updated++;
      }
    }

    await new Promise((r) => setTimeout(r, process.env.CI ? 20 : 50));
    const processed = Math.min(idx + CONCURRENCY, toProcess.length);
    log.progress(processed, total, errors, chunk[chunk.length - 1].slug);
  }

  log.progressEnd();

  const summaryLines = [
    "## Content Backfill Summary",
    "",
    "| Metric | Value |",
    "|--------|-------|",
    `| Candidates | ${skillsToBackfill.length} |`,
    `| Processed | ${total} |`,
    `| Updated | ${updated} |`,
    `| Errors | ${errors} |`,
  ];
  log.summary(summaryLines.join("\n"));
  log.success(`Updated: ${updated} | Errors: ${errors}`);
  log.done();

  if (errors > total * 0.1) process.exit(1);
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const skipExisting = args.includes("--skip-existing");
  const backfillContent = args.includes("--backfill-content");
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx !== -1 ? Number(args[limitIdx + 1]) : Infinity;
  const offsetIdx = args.indexOf("--offset");
  const offset = offsetIdx !== -1 ? Number(args[offsetIdx + 1]) : 0;

  let supabase;
  if (!dryRun) {
    validateEnv(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
    supabase = createAdminClient();
  }

  // Backfill mode: query DB for NULL-content skills with github_url,
  // fetch SKILL.md by path, and UPDATE only content fields
  if (backfillContent) {
    await backfillContentFromDb(supabase, { dryRun, limit });
    return;
  }

  const allSkillFiles = await fetchSkillFiles();
  let filesToProcess = allSkillFiles.slice(offset, offset + limit);

  // Skip files whose slugs already exist in DB
  if (skipExisting && supabase) {
    log.info("Fetching existing slugs from DB...");
    const { data: rows, error } = await supabase.from("skills").select("slug");
    if (error) throw error;
    const existingSlugs = new Set(rows.map((r) => r.slug));
    const before = filesToProcess.length;
    filesToProcess = filesToProcess.filter((file) => {
      const dirParts = file.path.split("/");
      const pathAuthor = dirParts.length >= 3 ? dirParts[1] : null;
      const dirName = dirParts.length >= 3 ? dirParts[2] : dirParts[dirParts.length - 2];
      const slug = slugify(`${pathAuthor || "unknown"}--${dirName}`);
      return !existingSlugs.has(slug);
    });
    log.info(`Skipped ${before - filesToProcess.length} existing, ${filesToProcess.length} remaining`);
  }

  const total = filesToProcess.length;
  log.info(`Processing range: ${offset} → ${offset + Math.min(limit, allSkillFiles.length - offset)} (of ${allSkillFiles.length} total)`);

  const skills = [];
  let errors = 0;

  // Concurrent fetch for faster processing (especially in CI)
  const CONCURRENCY = process.env.CI ? 10 : 3;

  for (let idx = 0; idx < filesToProcess.length; idx += CONCURRENCY) {
    const chunk = filesToProcess.slice(idx, idx + CONCURRENCY);
    const results = await Promise.allSettled(
      chunk.map(async (file) => {
        const content = await githubFetchRaw(
          REPO_OWNER,
          REPO_NAME,
          file.path
        );
        return { file, content };
      })
    );

    for (const result of results) {
      if (result.status === "rejected") {
        log.warn(`Error fetching: ${result.reason.message}`);
        errors++;
        continue;
      }

      const { file, content } = result.value;
      try {
        const parsed = parseSkillMd(content);
        if (!parsed) {
          errors++;
          continue;
        }

        // Path: skills/<author>/<skill-name>/SKILL.md
        const dirParts = file.path.split("/");
        const pathAuthor = dirParts.length >= 3 ? dirParts[1] : null;
        const dirName = dirParts.length >= 3 ? dirParts[2] : dirParts[dirParts.length - 2];
        const author = parsed.author || pathAuthor || "unknown";
        const slug = slugify(`${author}--${dirName}`);
        const tags = Array.isArray(parsed.tags)
          ? parsed.tags
          : typeof parsed.tags === "string"
            ? parsed.tags.split(",").map((t) => t.trim()).filter(Boolean)
            : [];

        skills.push({
          slug,
          name: parsed.name || dirName,
          description: parsed.description || "",
          author,
          category: categorize(parsed.name || dirName, tags, parsed.description || ""),
          tags,
          source: "clawhub",
          source_url: `https://clawhub.com/skills/${pathAuthor || "unknown"}/${dirName}`,
          github_url: `https://github.com/${REPO_OWNER}/${REPO_NAME}/tree/main/${file.path.replace("/SKILL.md", "")}`,
          stars: 0,
          downloads: 0,
          security_score: "unscanned",
          // Content fields extracted from SKILL.md body and openclaw metadata
          content: parsed.body || "",
          install_command: parsed.install || null,
          requires_env: parsed.requiresEnv || [],
          requires_bins: parsed.requiresBins || [],
        });
      } catch (e) {
        log.warn(`Error processing ${file.path}: ${e.message}`);
        errors++;
      }
    }

    // Rate limit between batches
    await new Promise((r) => setTimeout(r, process.env.CI ? 20 : 50));

    const processed = Math.min(idx + CONCURRENCY, filesToProcess.length);
    const lastFile = chunk[chunk.length - 1];
    log.progress(processed, total, errors, lastFile.path.split("/").slice(1, 3).join("/"));
  }

  log.progressEnd();
  log.info(`Parsed ${skills.length} skills (${errors} errors)`);

  if (dryRun) {
    log.info("[DRY RUN] Sample skills:");
    for (const s of skills.slice(0, 5)) {
      log.info(`  ${s.slug}: ${s.name} [${s.category}] (${s.tags.join(", ")})`);
    }
    log.info(`[DRY RUN] Would upsert ${skills.length} skills`);
    log.done();
    return;
  }

  // Deduplicate by slug AND (name, author) to satisfy both unique constraints
  const slugMap = new Map();
  const dedupMap = new Map();
  const dedupedSkills = [];
  for (const skill of skills) {
    const dedupKey = `${skill.name.toLowerCase()}|${skill.author.toLowerCase()}|${skill.source}`;
    if (slugMap.has(skill.slug) || dedupMap.has(dedupKey)) continue;
    slugMap.set(skill.slug, true);
    dedupMap.set(dedupKey, true);
    dedupedSkills.push(skill);
  }
  const dupeCount = skills.length - dedupedSkills.length;
  if (dupeCount > 0) {
    log.info(`Deduplicated: ${skills.length} → ${dedupedSkills.length} (${dupeCount} duplicates removed)`);
  }

  // Batch upsert in chunks (ignoreDuplicates for cross-batch dedup conflicts)
  const BATCH_SIZE = 500;
  let upserted = 0;

  for (let i = 0; i < dedupedSkills.length; i += BATCH_SIZE) {
    const batch = dedupedSkills.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from("skills")
      .upsert(batch, { onConflict: "slug", ignoreDuplicates: !backfillContent });

    if (error) {
      log.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} error: ${error.message}`);
    } else {
      upserted += batch.length;
      log.info(`Upsert batch ${Math.floor(i / BATCH_SIZE) + 1}: +${batch.length} (total: ${upserted})`);
    }
  }

  // Summary report
  log.success("=== Sync Summary ===");
  log.success(`Range: ${offset} → ${offset + total} of ${allSkillFiles.length}`);
  log.success(`Parsed: ${skills.length} | Deduped: ${dedupedSkills.length} | Upserted: ${upserted} | Errors: ${errors}`);

  const summaryLines = [
    "## ClawHub Skills Sync Summary",
    "",
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Total SKILL.md | ${allSkillFiles.length} |`,
    `| Range | ${offset} → ${offset + total} |`,
    `| Parsed | ${skills.length} |`,
    `| Deduplicated | ${dedupedSkills.length} |`,
    `| Upserted | ${upserted} |`,
    `| Errors | ${errors} |`,
  ];
  log.summary(summaryLines.join("\n"));

  log.done();

  // Only fail if >10% errors (parse errors on a few entries are expected)
  if (errors > dedupedSkills.length * 0.1) process.exit(1);
}

main().catch((e) => {
  log.error(e.message);
  process.exit(1);
});
