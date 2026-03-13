#!/usr/bin/env node

/**
 * Sync curated skills from multiple GitHub repos to Supabase.
 * Uses adapter pattern — each repo has its own path-finding + slug logic.
 * Supports incremental sync and multiple discovery sources.
 *
 * Usage:
 *   node scripts/sync-curated-skills.mjs                         # Sync all sources
 *   node scripts/sync-curated-skills.mjs --dry-run                # Preview only
 *   node scripts/sync-curated-skills.mjs --repo anthropics/skills # Single curated repo
 *   node scripts/sync-curated-skills.mjs --limit 10               # Limit items per source
 *   node scripts/sync-curated-skills.mjs --skip-existing          # Skip if slug exists
 *   node scripts/sync-curated-skills.mjs --incremental            # Only sync new skills (by github_url + slug)
 *   node scripts/sync-curated-skills.mjs --source awesome-list    # Only run specific source
 *   node scripts/sync-curated-skills.mjs --source curated         # Only run curated adapters
 *   node scripts/sync-curated-skills.mjs --source skills-sh       # Only run skills.sh
 *   node scripts/sync-curated-skills.mjs --evaluate               # Run LLM evaluation on new skills
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
import { fetchAwesomeSkills, normalizeGithubUrl } from "./lib/sources/awesome-skills.mjs";
import { fetchSkillsShSkills } from "./lib/sources/skills-sh.mjs";

const log = createLogger("curated");

// Valid source types for --source flag
const VALID_SOURCES = ["curated", "awesome-list", "skills-sh"];

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

// ─── Slug generation ─────────────────────────────────────────────────

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Generate a slug for awesome-list / skills-sh entries.
 * Uses the GitHub repo owner/name as slug base.
 */
function makeDiscoverySlug(githubUrl, name) {
  if (githubUrl) {
    try {
      const u = new URL(githubUrl);
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts.length >= 2) {
        return `${slugify(parts[0])}--${slugify(parts[1])}`;
      }
    } catch {
      // Fall through
    }
  }
  return `disc--${slugify(name)}`;
}

// ─── Sync a single curated adapter ──────────────────────────────────

async function syncAdapter(adapter, { limit, skipExisting, existingSlugs, incremental, existingUrls }) {
  const repoLabel = `${adapter.owner}/${adapter.repo}`;
  log.info(`\n${"=".repeat(60)}`);
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
    log.info(`Filtered: ${before} -> ${paths.length} (adapter pick list)`);
  }

  // Skip existing slugs
  if (skipExisting && existingSlugs) {
    const before = paths.length;
    paths = paths.filter((p) => !existingSlugs.has(adapter.makeSlug(p)));
    if (before !== paths.length) {
      log.info(`Skipped ${before - paths.length} existing, ${paths.length} remaining`);
    }
  }

  // Incremental: skip by both slug and github_url
  if (incremental && existingSlugs && existingUrls) {
    const before = paths.length;
    paths = paths.filter((p) => {
      const slug = adapter.makeSlug(p);
      if (existingSlugs.has(slug)) return false;
      const url = normalizeGithubUrl(
        `https://github.com/${repoLabel}/tree/${adapter.ref}/${p.replace("/SKILL.md", "")}`
      );
      if (url && existingUrls.has(url)) return false;
      return true;
    });
    if (before !== paths.length) {
      log.info(`Incremental: skipped ${before - paths.length}, ${paths.length} new`);
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

        // Clean up description: skip "Tier:" prefix (e.g. alirezarezvani)
        let description = parsed.description || "";
        const tierMatch = description.match(/^Tier:\s*\w+\s*[-–—]?\s*/i);
        if (tierMatch) {
          description = description.slice(tierMatch[0].length).trim();
        }
        // If description is now empty or still just a tier label, use name instead
        if (!description || /^tier:\s*\w+$/i.test(description)) {
          description = "";
        }

        // Extract author from parsed data or path
        const dirParts = path.split("/");
        const dirName = dirParts[dirParts.length - 2];
        const author = parsed.author || adapter.owner;

        skills.push({
          slug,
          name: parsed.name || dirName,
          description,
          author,
          category: categorize(
            parsed.name || dirName,
            tags,
            description
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
          last_synced_at: new Date().toISOString(),
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

// ─── Sync awesome-list sources ──────────────────────────────────────

async function syncAwesomeList({ limit, incremental, existingSlugs, existingUrls }) {
  log.info(`\n${"=".repeat(60)}`);
  log.info("Syncing: awesome-list sources");

  let entries = await fetchAwesomeSkills();

  // Incremental: filter out already-known skills
  if (incremental && existingSlugs && existingUrls) {
    const before = entries.length;
    entries = entries.filter((e) => {
      const slug = makeDiscoverySlug(e.githubUrl, e.name);
      if (existingSlugs.has(slug)) return false;
      const normUrl = normalizeGithubUrl(e.githubUrl);
      if (normUrl && existingUrls.has(normUrl)) return false;
      return true;
    });
    log.info(`Incremental: ${before} -> ${entries.length} new entries`);
  }

  if (limit !== Infinity) {
    entries = entries.slice(0, limit);
  }

  const skills = entries.map((e) => ({
    slug: makeDiscoverySlug(e.githubUrl, e.name),
    name: e.name,
    description: e.description,
    author: extractOwnerFromUrl(e.githubUrl),
    category: categorize(e.name, e.tags, e.description),
    tags: e.tags,
    source: "awesome-list",
    repo_source: e.repoSource || "awesome-list",
    source_url: e.githubUrl,
    github_url: e.githubUrl,
    stars: 0,
    downloads: 0,
    security_score: "unscanned",
    platform: ["claude"],
    content: "",
    install_command: null,
    requires_env: [],
    requires_bins: [],
    is_hidden: false,
    // New skills from discovery sources enter as draft
    status: "draft",
    discovered_at: new Date().toISOString(),
    last_synced_at: new Date().toISOString(),
  }));

  log.info(`awesome-list: prepared ${skills.length} skills`);
  return { skills, errors: 0 };
}

// ─── Sync skills.sh source ──────────────────────────────────────────

async function syncSkillsSh({ limit, incremental, existingSlugs, existingUrls }) {
  log.info(`\n${"=".repeat(60)}`);
  log.info("Syncing: skills.sh source");

  let entries = await fetchSkillsShSkills();

  // Incremental: filter out already-known skills
  if (incremental && existingSlugs && existingUrls) {
    const before = entries.length;
    entries = entries.filter((e) => {
      const slug = makeDiscoverySlug(e.githubUrl, e.name);
      if (existingSlugs.has(slug)) return false;
      if (e.githubUrl) {
        const normUrl = normalizeGithubUrl(e.githubUrl);
        if (normUrl && existingUrls.has(normUrl)) return false;
      }
      return true;
    });
    log.info(`Incremental: ${before} -> ${entries.length} new entries`);
  }

  if (limit !== Infinity) {
    entries = entries.slice(0, limit);
  }

  const skills = entries.map((e) => ({
    slug: makeDiscoverySlug(e.githubUrl, e.name),
    name: e.name,
    description: e.description,
    author: extractOwnerFromUrl(e.githubUrl),
    category: categorize(e.name, e.tags, e.description),
    tags: e.tags,
    source: "skills-sh",
    repo_source: "skills-sh",
    source_url: e.githubUrl || "",
    github_url: e.githubUrl || "",
    stars: 0,
    downloads: 0,
    install_count: e.installCount || 0,
    security_score: "unscanned",
    platform: ["claude"],
    content: "",
    install_command: null,
    requires_env: [],
    requires_bins: [],
    is_hidden: false,
    // New skills from discovery sources enter as draft
    status: "draft",
    discovered_at: new Date().toISOString(),
    last_synced_at: new Date().toISOString(),
  }));

  log.info(`skills.sh: prepared ${skills.length} skills`);
  return { skills, errors: 0 };
}

// ─── LLM evaluation ────────────────────────────────────────────────

/**
 * Run LLM evaluation on newly discovered skills.
 * Produces: nameZh, descriptionZh, introZh, category, qualityScore, qualityReason, editorCommentZh
 */
async function evaluateSkillsWithLLM(skills) {
  let callLLM;
  try {
    const llmModule = await import("./lib/llm.mjs");
    callLLM = llmModule.callLLM;
  } catch (err) {
    log.warn(`Cannot load LLM module: ${err.message}. Skipping evaluation.`);
    return skills;
  }

  log.info(`Running LLM evaluation on ${skills.length} skills...`);

  const SYSTEM_PROMPT = `You are a senior AI tools curator for SkillNav (skillnav.dev), a Chinese developer tool site focused on AI Agent Skills. Your job is to evaluate and localize skill entries.

Respond with valid JSON only, no markdown fences.`;

  let evaluated = 0;
  let errors = 0;

  for (const skill of skills) {
    try {
      const userPrompt = `Evaluate this AI Agent Skill and provide Chinese localization.

Skill Info:
- Name: ${skill.name}
- Description: ${skill.description || "N/A"}
- GitHub URL: ${skill.github_url || "N/A"}
- Tags: ${(skill.tags || []).join(", ") || "N/A"}
- Source: ${skill.source}

Return JSON:
{
  "nameZh": "Chinese name (keep English technical terms)",
  "descriptionZh": "Chinese description (1-2 sentences, concise)",
  "introZh": "Brief Chinese intro explaining what this skill does and why it's useful (2-3 sentences)",
  "category": "One of: 编码与调试, AI 与智能体, 数据与存储, 搜索与获取, DevOps, 内容与创意, 效率与工作流, 安全与合规, 平台与服务, 行业场景, 其他",
  "qualityScore": <1-5 integer: 5=production-ready, 4=solid, 3=usable, 2=early, 1=minimal>,
  "qualityReason": "Brief English explanation of score",
  "editorCommentZh": "One-line Chinese editor's pick comment (why this skill is worth trying)"
}`;

      const text = await callLLM(SYSTEM_PROMPT, userPrompt, 2048);
      const jsonStr = text.replace(/^```json\s*\n?/, "").replace(/\n?```\s*$/, "").trim();
      const result = JSON.parse(jsonStr);

      // Apply LLM results to skill
      if (result.nameZh) skill.name_zh = result.nameZh;
      if (result.descriptionZh) skill.description_zh = result.descriptionZh;
      if (result.introZh) skill.intro_zh = result.introZh;
      if (result.category) skill.category = result.category;
      if (typeof result.qualityScore === "number") {
        skill.quality_score = Math.max(1, Math.min(5, Math.round(result.qualityScore)));
      }
      if (result.qualityReason) skill.quality_reason = result.qualityReason;
      if (result.editorCommentZh) skill.editor_comment_zh = result.editorCommentZh;

      evaluated++;
    } catch (err) {
      log.warn(`LLM evaluation failed for ${skill.slug}: ${err.message}`);
      errors++;
    }

    // Rate limit LLM calls
    await new Promise((r) => setTimeout(r, 200));

    if ((evaluated + errors) % 10 === 0) {
      log.info(`  LLM evaluation: ${evaluated} done, ${errors} errors, ${skills.length - evaluated - errors} remaining`);
    }
  }

  log.info(`LLM evaluation complete: ${evaluated} evaluated, ${errors} errors`);
  return skills;
}

// ─── Helpers ────────────────────────────────────────────────────────

function extractOwnerFromUrl(githubUrl) {
  if (!githubUrl) return "unknown";
  try {
    const parts = new URL(githubUrl).pathname.split("/").filter(Boolean);
    return parts[0] || "unknown";
  } catch {
    return "unknown";
  }
}

/**
 * Fetch existing skills from DB for deduplication.
 * Returns { slugs: Set<string>, urls: Set<string> }
 */
async function fetchExistingSkills(supabase) {
  log.info("Fetching existing skills for deduplication...");

  const allSlugs = new Set();
  const allUrls = new Set();
  let from = 0;
  const PAGE_SIZE = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("skills")
      .select("slug, github_url")
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    for (const row of data) {
      allSlugs.add(row.slug);
      if (row.github_url) {
        const normalized = normalizeGithubUrl(row.github_url);
        if (normalized) allUrls.add(normalized);
      }
    }

    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  log.info(`Found ${allSlugs.size} existing slugs, ${allUrls.size} existing URLs`);
  return { slugs: allSlugs, urls: allUrls };
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const skipExisting = args.includes("--skip-existing");
  const incremental = args.includes("--incremental");
  const evaluate = args.includes("--evaluate");
  const repoIdx = args.indexOf("--repo");
  const repoFilter = repoIdx !== -1 ? args[repoIdx + 1] : null;
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx !== -1 ? Number(args[limitIdx + 1]) : Infinity;
  const sourceIdx = args.indexOf("--source");
  const sourceFilter = sourceIdx !== -1 ? args[sourceIdx + 1] : null;

  // Validate --source flag
  if (sourceFilter && !VALID_SOURCES.includes(sourceFilter)) {
    log.error(`Unknown source: ${sourceFilter}. Available: ${VALID_SOURCES.join(", ")}`);
    process.exit(1);
  }

  log.info(`Curated Skills Sync -- ${new Date().toISOString()}`);
  log.info(`Mode: ${dryRun ? "DRY RUN" : "LIVE"} | Limit: ${limit === Infinity ? "none" : limit} | Incremental: ${incremental} | Evaluate: ${evaluate}`);
  if (sourceFilter) log.info(`Source filter: ${sourceFilter}`);

  let supabase;
  if (!dryRun) {
    validateEnv(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
    supabase = createAdminClient();
  }

  // Determine which curated adapters to run
  let adapters = CURATED_ADAPTERS;
  if (repoFilter) {
    const adapter = findAdapter(repoFilter);
    if (!adapter) {
      log.error(`Unknown repo: ${repoFilter}. Available: ${CURATED_ADAPTERS.map((a) => `${a.owner}/${a.repo}`).join(", ")}`);
      process.exit(1);
    }
    adapters = [adapter];
  }

  // Pre-fetch existing skills for dedup (needed for skip-existing, incremental, or non-dry-run)
  let existingSlugs = null;
  let existingUrls = null;

  if ((skipExisting || incremental) && supabase) {
    const existing = await fetchExistingSkills(supabase);
    existingSlugs = existing.slugs;
    existingUrls = existing.urls;
  } else if (skipExisting && !supabase) {
    // dry-run with skip-existing: fetch slugs only for curated compatibility
    existingSlugs = new Set();
    existingUrls = new Set();
  }

  // ── Run sources ──────────────────────────────────────────────────

  const allSkills = [];
  let totalErrors = 0;
  const sourceCounts = {};

  // 1. Curated adapters (original 7 repos)
  if (!sourceFilter || sourceFilter === "curated") {
    for (const adapter of adapters) {
      const { skills, errors } = await syncAdapter(adapter, {
        dryRun,
        limit,
        skipExisting,
        existingSlugs,
        incremental,
        existingUrls,
      });
      allSkills.push(...skills);
      totalErrors += errors;
    }
    sourceCounts["curated"] = allSkills.length;
  }

  // 2. Awesome-list sources
  if (!sourceFilter || sourceFilter === "awesome-list") {
    const prevCount = allSkills.length;
    const { skills, errors } = await syncAwesomeList({
      limit,
      incremental,
      existingSlugs,
      existingUrls,
    });
    allSkills.push(...skills);
    totalErrors += errors;
    sourceCounts["awesome-list"] = allSkills.length - prevCount;
  }

  // 3. skills.sh source
  if (!sourceFilter || sourceFilter === "skills-sh") {
    const prevCount = allSkills.length;
    const { skills, errors } = await syncSkillsSh({
      limit,
      incremental,
      existingSlugs,
      existingUrls,
    });
    allSkills.push(...skills);
    totalErrors += errors;
    sourceCounts["skills-sh"] = allSkills.length - prevCount;
  }

  log.info(`\n${"=".repeat(60)}`);
  log.info(`Total: ${allSkills.length} skills from ${Object.keys(sourceCounts).length} sources (${totalErrors} errors)`);
  for (const [src, count] of Object.entries(sourceCounts)) {
    log.info(`  ${src}: ${count} skills`);
  }

  if (dryRun) {
    log.info("\n[DRY RUN] Sample skills:");
    for (const s of allSkills.slice(0, 15)) {
      log.info(`  ${s.slug}: ${s.name} [${s.category}] (${s.source}) ${s.github_url || ""}`);
    }
    log.info(`[DRY RUN] Would upsert ${allSkills.length} skills`);
    log.done();
    return;
  }

  if (allSkills.length === 0) {
    log.info("No skills to upsert");

    // Update last_synced_at for existing skills if not incremental
    if (!incremental && supabase) {
      await updateLastSyncedAt(supabase);
    }

    log.done();
    return;
  }

  // ── LLM evaluation (optional) ────────────────────────────────────

  // Only evaluate new discovery skills (not curated ones that already have content)
  if (evaluate) {
    const discoverySkills = allSkills.filter(
      (s) => s.source === "awesome-list" || s.source === "skills-sh"
    );
    if (discoverySkills.length > 0) {
      await evaluateSkillsWithLLM(discoverySkills);
    } else {
      log.info("No discovery skills to evaluate");
    }
  }

  // ── Deduplicate ──────────────────────────────────────────────────

  // Deduplicate by slug (primary) and github_url (secondary)
  const slugMap = new Map();
  const urlMap = new Map();
  const dedupedSkills = [];

  for (const skill of allSkills) {
    // Check slug dedup
    if (slugMap.has(skill.slug)) {
      log.warn(`Duplicate slug: ${skill.slug} (keeping first)`);
      continue;
    }

    // Check github_url dedup
    if (skill.github_url) {
      const normUrl = normalizeGithubUrl(skill.github_url);
      if (normUrl && urlMap.has(normUrl)) {
        log.warn(`Duplicate github_url: ${skill.github_url} (slug: ${skill.slug}, keeping first)`);
        continue;
      }
      if (normUrl) urlMap.set(normUrl, true);
    }

    slugMap.set(skill.slug, true);
    dedupedSkills.push(skill);
  }

  const dupeCount = allSkills.length - dedupedSkills.length;
  if (dupeCount > 0) {
    log.info(`Deduplicated: ${allSkills.length} -> ${dedupedSkills.length}`);
  }

  // ── Batch upsert ─────────────────────────────────────────────────

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

  // ── Update last_synced_at for existing skills ────────────────────

  if (!incremental && supabase) {
    await updateLastSyncedAt(supabase);
  }

  // ── Summary ──────────────────────────────────────────────────────

  const summaryLines = [
    "## Curated Skills Sync Summary",
    "",
    "| Metric | Value |",
    "|--------|-------|",
    `| Sources | ${Object.keys(sourceCounts).join(", ")} |`,
    `| Total parsed | ${allSkills.length} |`,
    `| Deduplicated | ${dedupedSkills.length} |`,
    `| Upserted | ${upserted} |`,
    `| Errors | ${totalErrors} |`,
    `| Incremental | ${incremental ? "Yes" : "No"} |`,
    `| LLM Evaluated | ${evaluate ? "Yes" : "No"} |`,
    "",
    "### By Source",
    "",
    "| Source | Skills |",
    "|--------|--------|",
    ...Object.entries(sourceCounts).map(
      ([src, count]) => `| ${src} | ${count} |`
    ),
  ];

  // Add curated repo breakdown if applicable
  if (!sourceFilter || sourceFilter === "curated") {
    summaryLines.push(
      "",
      "### Curated Repos",
      "",
      "| Repo | Platform | Skills |",
      "|------|----------|--------|",
      ...adapters.map((a) => {
        const count = allSkills.filter(
          (s) => s.repo_source === `${a.owner}/${a.repo}`
        ).length;
        return `| ${a.owner}/${a.repo} | ${a.platform.join(", ")} | ${count} |`;
      })
    );
  }

  log.summary(summaryLines.join("\n"));
  log.done();

  if (totalErrors > allSkills.length * 0.2) process.exit(1);
}

/**
 * Update last_synced_at timestamp for all existing skills.
 */
async function updateLastSyncedAt(supabase) {
  log.info("Updating last_synced_at for existing skills...");
  const { error } = await supabase
    .from("skills")
    .update({ last_synced_at: new Date().toISOString() })
    .not("slug", "is", null);

  if (error) {
    log.warn(`Failed to update last_synced_at: ${error.message}`);
  } else {
    log.info("Updated last_synced_at for all existing skills");
  }
}

main().catch((e) => {
  log.error(e.message);
  process.exit(1);
});
