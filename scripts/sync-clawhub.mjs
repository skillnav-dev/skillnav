#!/usr/bin/env node

/**
 * Sync skills from OpenClaw/ClawHub ecosystem to Supabase.
 * Fetches SKILL.md files from the openclaw/skills GitHub repo.
 *
 * Usage:
 *   node scripts/sync-clawhub.mjs                 # Full sync
 *   node scripts/sync-clawhub.mjs --dry-run       # Preview only
 *   node scripts/sync-clawhub.mjs --limit 50      # Limit items
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import { createAdminClient } from "./lib/supabase-admin.mjs";
import { githubFetch, githubFetchRaw } from "./lib/github.mjs";
import { createLogger } from "./lib/logger.mjs";

const log = createLogger("clawhub");

const REPO_OWNER = "openclaw";
const REPO_NAME = "skills";

// Category inference from tags/keywords
const CATEGORY_MAP = {
  search: "搜索",
  web: "搜索",
  code: "开发",
  coding: "开发",
  development: "开发",
  debug: "开发",
  test: "开发",
  data: "数据",
  analysis: "数据",
  database: "数据",
  file: "效率",
  productivity: "效率",
  email: "效率",
  document: "效率",
  api: "集成",
  integration: "集成",
  connect: "集成",
  image: "创意",
  design: "创意",
  creative: "创意",
  memory: "基础",
  context: "基础",
  security: "安全",
};

function inferCategory(name, tags) {
  const words = [
    ...tags.map((t) => t.toLowerCase()),
    ...name.toLowerCase().split(/[\s-_]+/),
  ];
  for (const word of words) {
    if (CATEGORY_MAP[word]) return CATEGORY_MAP[word];
  }
  return "其他";
}

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

  const body = content.slice(fmMatch[0].length).trim();

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

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx !== -1 ? Number(args[limitIdx + 1]) : Infinity;

  let supabase;
  if (!dryRun) {
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

      // Path: skills/<author>/<skill-name>/SKILL.md
      const dirParts = file.path.split("/");
      const pathAuthor = dirParts.length >= 3 ? dirParts[1] : null;
      const dirName = dirParts.length >= 3 ? dirParts[2] : dirParts[dirParts.length - 2];
      const slug = slugify(dirName);
      const tags = Array.isArray(parsed.tags)
        ? parsed.tags
        : typeof parsed.tags === "string"
          ? parsed.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : [];

      skills.push({
        slug,
        name: parsed.name || dirName,
        description: parsed.description || "",
        author: parsed.author || pathAuthor || "unknown",
        category: inferCategory(parsed.name || dirName, tags),
        tags,
        source: "clawhub",
        source_url: `https://clawhub.com/skills/${pathAuthor || "unknown"}/${dirName}`,
        github_url: `https://github.com/${REPO_OWNER}/${REPO_NAME}/tree/main/${file.path.replace("/SKILL.md", "")}`,
        stars: 0,
        downloads: 0,
        security_score: "unscanned",
      });

      // Rate limit between fetches
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
      log.info(`  ${s.slug}: ${s.name} [${s.category}] (${s.tags.join(", ")})`);
    }
    log.info(`[DRY RUN] Would upsert ${skills.length} skills`);
    log.done();
    return;
  }

  // Batch upsert in chunks
  const BATCH_SIZE = 500;
  let upserted = 0;

  for (let i = 0; i < skills.length; i += BATCH_SIZE) {
    const batch = skills.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from("skills")
      .upsert(batch, { onConflict: "slug", ignoreDuplicates: false });

    if (error) {
      log.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} error: ${error.message}`);
    } else {
      upserted += batch.length;
    }
  }

  log.success(`Upserted ${upserted} skills, ${errors} errors`);
  log.done();
}

main().catch((e) => {
  log.error(e.message);
  process.exit(1);
});
