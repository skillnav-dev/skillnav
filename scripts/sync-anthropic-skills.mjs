#!/usr/bin/env node

/**
 * Sync skills from Anthropic's official skills repository to Supabase.
 * Source: https://github.com/anthropics/skills
 *
 * Usage:
 *   node scripts/sync-anthropic-skills.mjs             # Full sync
 *   node scripts/sync-anthropic-skills.mjs --dry-run   # Preview only
 *   node scripts/sync-anthropic-skills.mjs --limit 20  # Limit items
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import { createAdminClient } from "./lib/supabase-admin.mjs";
import { githubFetch, githubFetchRaw } from "./lib/github.mjs";
import { createLogger } from "./lib/logger.mjs";
import { validateEnv } from "./lib/validate-env.mjs";

const log = createLogger("anthropic");

const REPO_OWNER = "anthropics";
const REPO_NAME = "skills";

const CATEGORY_MAP = {
  "Creative & Design": "创意",
  "Development & Technical": "开发",
  "Enterprise & Communication": "效率",
  "Data & Analysis": "数据",
  Research: "搜索",
  Productivity: "效率",
  Integration: "集成",
  Security: "安全",
};

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Parse SKILL.md content.
 */
function parseSkillMd(content) {
  const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!fmMatch) return null;

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

  const tagsMatch = yamlStr.match(/tags:\s*\[(.*?)\]/);
  if (tagsMatch) {
    fields.tags = tagsMatch[1]
      .split(",")
      .map((t) => t.trim().replace(/['"]/g, ""))
      .filter(Boolean);
  }

  return fields;
}

/**
 * Infer category from directory path in the repo.
 */
function inferCategory(filePath) {
  for (const [dirName, category] of Object.entries(CATEGORY_MAP)) {
    if (filePath.includes(dirName)) return category;
  }
  return "其他";
}

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

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx !== -1 ? Number(args[limitIdx + 1]) : Infinity;

  let supabase;
  if (!dryRun) {
    validateEnv(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
    supabase = createAdminClient();
  }

  const skillFiles = await fetchSkillFiles();
  const filesToProcess = skillFiles.slice(0, limit);
  const skills = [];
  let errors = 0;

  for (const file of filesToProcess) {
    try {
      const content = await githubFetchRaw(
        REPO_OWNER,
        REPO_NAME,
        file.path
      );

      const parsed = parseSkillMd(content);
      if (!parsed) {
        log.warn(`No frontmatter: ${file.path}`);
        errors++;
        continue;
      }

      const dirParts = file.path.split("/");
      const dirName =
        dirParts.length >= 2 ? dirParts[dirParts.length - 2] : parsed.name;
      const slug = slugify(dirName);
      const tags = Array.isArray(parsed.tags)
        ? parsed.tags
        : typeof parsed.tags === "string"
          ? parsed.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : [];

      skills.push({
        slug: `anthropic-${slug}`,
        name: parsed.name || dirName,
        description: parsed.description || "",
        author: parsed.author || "anthropic",
        category: inferCategory(file.path),
        tags,
        source: "anthropic",
        source_url: `https://github.com/${REPO_OWNER}/${REPO_NAME}/tree/main/${file.path.replace("/SKILL.md", "")}`,
        github_url: `https://github.com/${REPO_OWNER}/${REPO_NAME}`,
        stars: 0,
        downloads: 0,
        security_score: "safe",
        is_verified: true,
      });

      await new Promise((r) => setTimeout(r, 100));
    } catch (e) {
      log.warn(`Error processing ${file.path}: ${e.message}`);
      errors++;
    }
  }

  log.info(`Parsed ${skills.length} skills (${errors} errors)`);

  if (dryRun) {
    log.info("[DRY RUN] Sample skills:");
    for (const s of skills.slice(0, 5)) {
      log.info(
        `  ${s.slug}: ${s.name} [${s.category}] (${s.tags.join(", ")})`
      );
    }
    log.info(`[DRY RUN] Would upsert ${skills.length} skills`);
    log.done();
    return;
  }

  const BATCH_SIZE = 500;
  let upserted = 0;

  for (let i = 0; i < skills.length; i += BATCH_SIZE) {
    const batch = skills.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from("skills")
      .upsert(batch, { onConflict: "slug", ignoreDuplicates: false });

    if (error) {
      log.error(
        `Batch ${Math.floor(i / BATCH_SIZE) + 1} error: ${error.message}`
      );
    } else {
      upserted += batch.length;
    }
  }

  log.success(`Upserted ${upserted} skills, ${errors} errors`);

  const summaryLines = [
    "## Anthropic Skills Sync Summary",
    "",
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Total SKILL.md | ${skillFiles.length} |`,
    `| Parsed | ${skills.length} |`,
    `| Upserted | ${upserted} |`,
    `| Errors | ${errors} |`,
  ];
  log.summary(summaryLines.join("\n"));

  log.done();

  if (errors > 0) process.exit(1);
}

main().catch((e) => {
  log.error(e.message);
  process.exit(1);
});
