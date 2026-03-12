#!/usr/bin/env node

/**
 * Generate Chinese descriptions for skills that lack description_zh.
 *
 * Uses callLLM() to produce a concise Chinese introduction (50-100 chars)
 * for each skill, written from an editorial perspective.
 *
 * Modes:
 *   --dry-run      List skills missing description_zh (no LLM calls, no DB writes)
 *   --preview N    Generate N descriptions, print to console (no DB writes)
 *   --apply        Generate and write to DB
 *
 * Options:
 *   --limit N      Process only first N candidates
 *   --slugs a,b,c  Process only specific slugs (comma-separated)
 *
 * Examples:
 *   node scripts/generate-skill-descriptions.mjs --dry-run
 *   node scripts/generate-skill-descriptions.mjs --preview 5
 *   node scripts/generate-skill-descriptions.mjs --apply --limit 20
 *   node scripts/generate-skill-descriptions.mjs --apply --slugs my-skill,another
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { createAdminClient } from "./lib/supabase-admin.mjs";
import { createLogger } from "./lib/logger.mjs";
import { validateEnv } from "./lib/validate-env.mjs";
import { callLLM, getProviderInfo } from "./lib/llm.mjs";
import { withRetry } from "./lib/retry.mjs";

// Default to GPT provider unless explicitly overridden
if (!process.env.LLM_PROVIDER) {
  process.env.LLM_PROVIDER = "gpt";
}

const log = createLogger("skill-desc");

// ── CLI args ────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const applyMode = args.includes("--apply");
const previewIdx = args.indexOf("--preview");
const previewCount = previewIdx !== -1 ? parseInt(args[previewIdx + 1], 10) : 0;
const limitIdx = args.indexOf("--limit");
const limitCount = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : 0;
const slugsIdx = args.indexOf("--slugs");
const slugFilter = slugsIdx !== -1 ? args[slugsIdx + 1].split(",").map((s) => s.trim()) : null;

if (!dryRun && !applyMode && previewCount === 0) {
  console.log("Usage: node scripts/generate-skill-descriptions.mjs [--dry-run | --preview N | --apply]");
  console.log("  --dry-run      List skills missing description_zh (no LLM calls, no DB writes)");
  console.log("  --preview N    Generate N descriptions, print to console (no DB writes)");
  console.log("  --apply        Generate descriptions and write to DB");
  console.log("  --limit N      Process only first N candidates");
  console.log("  --slugs a,b,c  Process only specific slugs");
  process.exit(1);
}

// ── Prompt ──────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `你是 SkillNav (skillnav.dev) 的中文技术编辑，负责为 Claude Code 自定义 Skill 工具撰写一句话中文介绍。

写作风格：
- 简洁精炼，50-100 字
- 突出核心功能和使用场景，让开发者一眼看懂这个 Skill 能帮他做什么
- 不要翻译腔（不要"这是一个...的工具"之类的机械句式）
- 专有名词保留英文：Claude Code、Skill、MCP、API、SDK、Git、Docker 等
- 不要用"帮助您"、"让您"等敬语，用"帮你"、"让你"或直接描述功能
- 不要加引号、书名号包裹工具名

You must respond with valid JSON only, no markdown fences.`;

function buildUserPrompt(skill) {
  const contentSection = skill.content
    ? `\nSKILL.md content (first 3000 chars):\n${skill.content.slice(0, 3000)}`
    : "";

  return `基于以下 Skill 的实际定义内容，写一句话中文介绍（50-100 字）。返回 JSON：

{ "descriptionZh": "中文介绍文本" }

Name: ${skill.name}
Category: ${skill.category || "uncategorized"}
Tags: ${skill.tags ? skill.tags.join(", ") : "N/A"}
Description: ${skill.description || "N/A"}
${contentSection}`;
}

// ── DB helpers ──────────────────────────────────────────────────────────

const PAGE_SIZE = 1000;

async function fetchCandidates(supabase) {
  const allRows = [];
  let offset = 0;

  while (true) {
    let query = supabase
      .from("skills")
      .select("slug, name, description, description_zh, category, tags, content")
      .eq("status", "published")
      .is("description_zh", null)
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
  log.info(`Skill Description Generator — ${new Date().toISOString()}`);
  log.info(`Mode: ${mode}`);

  if (!dryRun) {
    const provider = getProviderInfo();
    log.info(`LLM: ${provider.name} (${provider.model})`);
  }

  // ── Fetch candidates ────────────────────────────────────────────────

  log.info("Fetching skills missing description_zh...");
  let candidates = await fetchCandidates(supabase);
  log.info(`Found ${candidates.length} skills without description_zh`);

  // Filter by slugs if specified
  if (slugFilter) {
    candidates = candidates.filter((s) => slugFilter.includes(s.slug));
    log.info(`Filtered to ${candidates.length} by slug list`);
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
    console.log(`Skills missing description_zh (${candidates.length} total)`);
    console.log(`${"=".repeat(60)}\n`);

    for (const s of candidates) {
      const desc = s.description ? s.description.slice(0, 60) : "(no description)";
      console.log(`  ${s.slug.padEnd(40)} ${desc}`);
    }

    console.log(`\nTotal: ${candidates.length}`);
    log.done();
    return;
  }

  // ── Generate descriptions ──────────────────────────────────────────

  log.info(`Generating descriptions for ${toProcess.length} skills...`);

  const results = [];
  let errors = 0;
  let writeErrors = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const skill = toProcess[i];
    log.progress(i + 1, toProcess.length, errors, skill.slug);

    try {
      const prompt = buildUserPrompt(skill);
      const rawResponse = await withRetry(
        () => callLLM(SYSTEM_PROMPT, prompt, 256),
        { maxRetries: 2, baseDelay: 2000, label: skill.slug }
      );

      // Parse JSON response
      const jsonStr = rawResponse
        .replace(/^```json\s*\n?/, "")
        .replace(/\n?```\s*$/, "")
        .trim();

      let parsed;
      try {
        parsed = JSON.parse(jsonStr);
      } catch {
        parsed = JSON.parse(jsonStr.replace(/\\(?!["\\/bfnrtu])/g, "\\\\"));
      }

      const descriptionZh = (parsed.descriptionZh || parsed.description_zh || "").trim();

      if (!descriptionZh || descriptionZh.length < 10) {
        throw new Error(`Generated text too short: "${descriptionZh}"`);
      }

      results.push({ slug: skill.slug, description_zh: descriptionZh });

      // Apply mode: write to DB immediately (resumable on interrupt)
      if (applyMode) {
        const { error: writeErr } = await supabase
          .from("skills")
          .update({ description_zh: descriptionZh })
          .eq("slug", skill.slug);

        if (writeErr) {
          log.error(`DB write failed for ${skill.slug}: ${writeErr.message}`);
          writeErrors++;
        }
      }

      // Preview mode: print to console
      if (previewCount > 0) {
        console.log(`\n${"─".repeat(60)}`);
        console.log(`${skill.slug}`);
        console.log(`  EN: ${skill.description || "(none)"}`);
        console.log(`  ZH: ${descriptionZh}`);
      }

      // Rate limit: 500ms delay between LLM calls
      if (i < toProcess.length - 1) {
        await new Promise((r) => setTimeout(r, 500));
      }
    } catch (err) {
      errors++;
      log.error(`${skill.slug}: ${err.message}`);
    }
  }

  log.progressEnd();

  // ── Summary ─────────────────────────────────────────────────────────

  const summaryLines = [
    `\n[${mode}] Skill Description Summary:`,
    `  Candidates: ${candidates.length}`,
    `  Processed: ${toProcess.length}`,
    `  Generated: ${results.length}`,
    `  LLM errors: ${errors}`,
    `  DB write errors: ${writeErrors}`,
  ];

  log.summary(summaryLines.join("\n"));
  log.done();

  if (errors > 0) process.exit(1);
}

main().catch((err) => {
  log.error(err.message);
  process.exit(1);
});
