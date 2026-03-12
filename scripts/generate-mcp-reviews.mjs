#!/usr/bin/env node

/**
 * Generate Chinese editorial reviews for S-tier MCP server candidates.
 *
 * For each candidate:
 *   1. Read description + tools from DB
 *   2. Fetch README from GitHub (if available)
 *   3. Call LLM to generate intro_zh, editor_comment_zh, editor_rating
 *   4. Upsert to DB and set quality_tier = 'S'
 *
 * Modes:
 *   --dry-run      Preview what would be generated (no DB writes, no LLM calls)
 *   --preview N    Generate reviews for first N candidates (print to console, no DB writes)
 *   --apply        Generate and write to DB
 *
 * Options:
 *   --min-stars N  Minimum stars threshold (default: 1000)
 *   --limit N      Process only first N candidates
 *   --skip-existing  Skip servers that already have editor_comment_zh
 *   --slugs a,b,c  Process only specific slugs (comma-separated)
 *
 * Examples:
 *   node scripts/generate-mcp-reviews.mjs --preview 5
 *   node scripts/generate-mcp-reviews.mjs --apply --min-stars 5000
 *   node scripts/generate-mcp-reviews.mjs --apply --slugs fetch,postgres,github
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { createAdminClient } from "./lib/supabase-admin.mjs";
import { createLogger } from "./lib/logger.mjs";
import { validateEnv } from "./lib/validate-env.mjs";
import { callLLM, getProviderInfo } from "./lib/llm.mjs";
import { githubFetchRaw } from "./lib/github.mjs";
import { withRetry } from "./lib/retry.mjs";

const log = createLogger("mcp-review");

// ── CLI args ────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const applyMode = args.includes("--apply");
const previewIdx = args.indexOf("--preview");
const previewCount = previewIdx !== -1 ? parseInt(args[previewIdx + 1], 10) : 0;
const minStarsIdx = args.indexOf("--min-stars");
const minStars = minStarsIdx !== -1 ? parseInt(args[minStarsIdx + 1], 10) : 1000;
const limitIdx = args.indexOf("--limit");
const limitCount = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : 0;
const skipExisting = args.includes("--skip-existing");
const slugsIdx = args.indexOf("--slugs");
const slugFilter = slugsIdx !== -1 ? args[slugsIdx + 1].split(",").map((s) => s.trim()) : null;

if (!dryRun && !applyMode && previewCount === 0) {
  console.log("Usage: node scripts/generate-mcp-reviews.mjs [--dry-run | --preview N | --apply]");
  console.log("  --dry-run        List candidates (no LLM calls, no DB writes)");
  console.log("  --preview N      Generate N reviews, print to console (no DB writes)");
  console.log("  --apply          Generate reviews and write to DB");
  console.log("  --min-stars N    Minimum stars (default: 1000)");
  console.log("  --limit N        Process only first N candidates");
  console.log("  --skip-existing  Skip servers with existing editor_comment_zh");
  console.log("  --slugs a,b,c    Process only specific slugs");
  process.exit(1);
}

// ── Review Prompt ───────────────────────────────────────────────────────

const REVIEW_SYSTEM_PROMPT = `You are a senior Chinese tech editor at SkillNav (skillnav.dev), a curated AI tools directory for Chinese developers. You write editorial reviews for MCP (Model Context Protocol) servers.

Writing style:
- Opinionated and specific — name concrete use cases (e.g. "让 Claude 直接读写你的 Notion 文档" not "用于管理文档")
- Each review must feel unique — NEVER use templates like "这个服务器解决了X的问题，适合Y的开发者"
- Vary your sentence structure — mix short punchy statements with longer explanations
- Honest about trade-offs — but lead with what makes this tool worth using
- Written in natural, conversational Chinese — like a tech blogger recommending a tool to a friend
- For official/verified servers: acknowledge their authority and ecosystem importance

You must respond with valid JSON only, no markdown fences.`;

function buildReviewPrompt(server, readme) {
  const toolsList = server.tools && Array.isArray(server.tools)
    ? server.tools.map((t) => `- ${t.name}: ${t.description || ""}`).join("\n")
    : "No tools data available";

  const readmeSection = readme
    ? `\nREADME (first 3000 chars):\n${readme.slice(0, 3000)}`
    : "";

  return `Write an editorial review for this MCP server. Return JSON with these exact fields:

{
  "introZh": "One-line Chinese introduction (30-60 chars). Format: '[Tool name] 是...' — what it does in one sentence. Be specific, not generic.",
  "editorCommentZh": "Editorial review in Chinese (100-200 chars). Must include: 1) What problem it solves 2) Best use case / who should use it 3) One honest caveat or limitation. Write as a knowledgeable peer recommending a tool, not marketing copy.",
  "editorRating": <1-5 integer rating based on: quality (code/docs), utility (how useful), maturity (production-ready?)>
}

Rating guide:
5 = Best-in-class, production-ready, well-documented, widely adopted (official Anthropic/GitHub/major-company servers with 10K+ stars)
4 = High quality, actively maintained, good docs, clear use case (1K+ stars or verified publisher)
3 = Solid and useful but has rough edges, limited docs, or narrow scope
2 = Early stage or very niche, use with caution
1 = Experimental, not recommended for production

MCP Server info:
- Name: ${server.name}
- Slug: ${server.slug}
- Stars: ${server.stars}
- Category: ${server.category || "uncategorized"}
- Source: ${server.source}
- Verified: ${server.is_verified ? "Yes (official)" : "No"}
- Description: ${server.description || "N/A"}
- Tools (${server.tools_count || 0}):
${toolsList}
${readmeSection}`;
}

// ── GitHub README fetch (with cache for same-repo servers) ──────────────

const readmeCache = new Map();

async function fetchReadme(githubUrl) {
  if (!githubUrl) return null;

  // Normalize URL for cache key
  const normalized = githubUrl.toLowerCase().replace(/\/+$/, "");
  if (readmeCache.has(normalized)) return readmeCache.get(normalized);

  try {
    const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) return null;

    const [, owner, repo] = match;

    for (const path of ["README.md", "readme.md", "README.rst"]) {
      try {
        const content = await githubFetchRaw(owner, repo, path);
        readmeCache.set(normalized, content);
        return content;
      } catch {
        // Try next path
      }
    }
    readmeCache.set(normalized, null);
    return null;
  } catch {
    readmeCache.set(normalized, null);
    return null;
  }
}

// ── DB helpers ──────────────────────────────────────────────────────────

const PAGE_SIZE = 1000;

async function fetchCandidates(supabase) {
  const allRows = [];
  let offset = 0;

  while (true) {
    let query = supabase
      .from("mcp_servers")
      .select("slug, name, stars, tools_count, tools, category, github_url, description, source, is_verified, quality_tier, editor_comment_zh")
      .eq("status", "published")
      .gte("stars", minStars)
      .order("stars", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    const { data, error } = await query;
    if (error) throw new Error(`DB read: ${error.message}`);
    if (!data || data.length === 0) break;
    allRows.push(...data);
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return allRows;
}

// ── Main ────────────────────────────────────────────────────────────────

async function main() {
  validateEnv(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
  const supabase = createAdminClient();

  const mode = dryRun ? "DRY RUN" : previewCount > 0 ? `PREVIEW (${previewCount})` : "APPLY";
  log.info(`MCP Review Generator — ${new Date().toISOString()}`);
  log.info(`Mode: ${mode} | Min stars: ${minStars}`);

  if (!dryRun) {
    const provider = getProviderInfo();
    log.info(`LLM: ${provider.name} (${provider.model})`);
  }

  // ── Fetch candidates ────────────────────────────────────────────────

  log.info("Fetching candidates...");
  let candidates = await fetchCandidates(supabase);
  log.info(`Found ${candidates.length} servers with stars >= ${minStars}`);

  // Filter by slugs if specified
  if (slugFilter) {
    candidates = candidates.filter((s) => slugFilter.includes(s.slug));
    log.info(`Filtered to ${candidates.length} by slug list`);
  }

  // Skip existing reviews
  if (skipExisting) {
    const before = candidates.length;
    candidates = candidates.filter(
      (s) => !s.editor_comment_zh || s.editor_comment_zh.trim().length === 0
    );
    log.info(`Skipped ${before - candidates.length} with existing reviews, ${candidates.length} remaining`);
  }

  // Apply limit
  if (limitCount > 0) {
    candidates = candidates.slice(0, limitCount);
    log.info(`Limited to ${limitCount}`);
  }

  // For preview mode, limit to previewCount
  const processCount = previewCount > 0 ? Math.min(previewCount, candidates.length) : candidates.length;
  const toProcess = candidates.slice(0, processCount);

  // ── Dry run: just list candidates ───────────────────────────────────

  if (dryRun) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`S-tier Candidates (${candidates.length} total)`);
    console.log(`${"=".repeat(60)}\n`);

    for (const s of candidates) {
      const existing = s.editor_comment_zh ? " [HAS REVIEW]" : "";
      console.log(`  ${String(s.stars).padStart(6)} ⭐  ${s.slug}${existing}`);
    }

    const withReview = candidates.filter((s) => s.editor_comment_zh).length;
    console.log(`\nTotal: ${candidates.length} | With review: ${withReview} | Need review: ${candidates.length - withReview}`);
    log.done();
    return;
  }

  // ── Generate reviews ────────────────────────────────────────────────

  log.info(`Generating reviews for ${toProcess.length} servers...`);

  const results = [];
  let errors = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const server = toProcess[i];
    log.progress(i + 1, toProcess.length, errors, server.slug);

    try {
      // Fetch README
      const readme = await fetchReadme(server.github_url);

      // Call LLM
      const prompt = buildReviewPrompt(server, readme);
      const rawResponse = await withRetry(
        () => callLLM(REVIEW_SYSTEM_PROMPT, prompt, 1024),
        { maxRetries: 2, baseDelay: 2000, label: server.slug }
      );

      // Parse response
      const jsonStr = rawResponse
        .replace(/^```json\s*\n?/, "")
        .replace(/\n?```\s*$/, "")
        .trim();

      let review;
      try {
        review = JSON.parse(jsonStr);
      } catch {
        // Try sanitizing
        review = JSON.parse(jsonStr.replace(/\\(?!["\\/bfnrtu])/g, "\\\\"));
      }

      // Validate required fields
      if (!review.introZh || !review.editorCommentZh || review.editorRating === undefined) {
        throw new Error(`Missing fields. Got: ${Object.keys(review).join(", ")}`);
      }

      // Normalize rating
      const rating = Math.max(1, Math.min(5, Math.round(Number(review.editorRating))));

      const result = {
        slug: server.slug,
        intro_zh: review.introZh,
        editor_comment_zh: review.editorCommentZh,
        editor_rating: String(rating),
        quality_tier: "S",
        is_featured: true,
      };

      results.push(result);

      // Preview mode: print to console
      if (previewCount > 0) {
        console.log(`\n${"─".repeat(60)}`);
        console.log(`${server.slug} (⭐ ${server.stars})`);
        console.log(`${"─".repeat(60)}`);
        console.log(`简介: ${review.introZh}`);
        console.log(`评测: ${review.editorCommentZh}`);
        console.log(`评分: ${"⭐".repeat(rating)} (${rating}/5)`);
      }

      // Rate limit: small delay between LLM calls
      if (i < toProcess.length - 1) {
        await new Promise((r) => setTimeout(r, 500));
      }
    } catch (err) {
      errors++;
      log.error(`${server.slug}: ${err.message}`);
    }
  }

  log.progressEnd();

  // ── Apply to DB ─────────────────────────────────────────────────────

  if (applyMode && results.length > 0) {
    log.info(`Writing ${results.length} reviews to DB...`);
    let writeErrors = 0;

    for (let i = 0; i < results.length; i++) {
      const { slug, ...fields } = results[i];
      const { error } = await supabase
        .from("mcp_servers")
        .update(fields)
        .eq("slug", slug);

      if (error) {
        log.error(`Failed to update ${slug}: ${error.message}`);
        writeErrors++;
      }
      if ((i + 1) % 10 === 0 || i === results.length - 1) {
        log.info(`  Write progress: ${i + 1}/${results.length}`);
      }
    }

    if (writeErrors > 0) {
      log.error(`${writeErrors} writes failed`);
    } else {
      log.success(`Wrote ${results.length} reviews to DB`);
    }
  }

  // ── Summary ─────────────────────────────────────────────────────────

  const summaryLines = [
    `\n[${mode}] MCP Review Summary:`,
    `  Candidates: ${candidates.length}`,
    `  Processed: ${toProcess.length}`,
    `  Generated: ${results.length}`,
    `  Errors: ${errors}`,
  ];

  if (results.length > 0) {
    const ratings = results.map((r) => Number(r.editor_rating));
    const avg = (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1);
    summaryLines.push(`  Avg rating: ${avg}/5`);
  }

  log.summary(summaryLines.join("\n"));
  log.done();

  if (errors > 0) process.exit(1);
}

main().catch((err) => {
  log.error(err.message);
  process.exit(1);
});
