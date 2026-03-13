#!/usr/bin/env node

/**
 * Backfill `editor_comment_zh` for top Skills and MCP servers using LLM.
 * Generates Wirecutter-style one-liner recommendations in Chinese.
 *
 * Usage:
 *   node scripts/backfill-editor-comments.mjs --dry-run          # Preview only (default)
 *   node scripts/backfill-editor-comments.mjs                    # Live update all
 *   node scripts/backfill-editor-comments.mjs --type skills      # Skills only
 *   node scripts/backfill-editor-comments.mjs --type mcp         # MCP servers only
 *   node scripts/backfill-editor-comments.mjs --limit 10         # Override default count
 *   node scripts/backfill-editor-comments.mjs --force            # Overwrite existing comments
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { createAdminClient } from "./lib/supabase-admin.mjs";
import { createLogger } from "./lib/logger.mjs";
import { validateEnv } from "./lib/validate-env.mjs";
import { callLLM, getProviderInfo } from "./lib/llm.mjs";

const log = createLogger("editor-comments");

const DEFAULT_SKILLS_LIMIT = 30;
const DEFAULT_MCP_LIMIT = 50;
const RATE_LIMIT_MS = 500;

const SYSTEM_PROMPT = `你是一位资深科技编辑，为 AI 开发工具撰写一句话编辑推荐语。

要求：
- 30-80 字中文
- 说明工具解决什么核心问题
- 如果有明显差异化优势，点出来
- 语气：专业但不冷冰冰，像朋友推荐
- 不要用"这是一个..."开头

返回纯文本推荐语，不要加引号或其他格式。`;

// ── CLI args ────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const FORCE = args.includes("--force");

const typeIdx = args.indexOf("--type");
const TYPE = typeIdx !== -1 ? args[typeIdx + 1] : "all";

const limitIdx = args.indexOf("--limit");
const CUSTOM_LIMIT = limitIdx !== -1 ? Number(args[limitIdx + 1]) : null;

if (!["skills", "mcp", "all"].includes(TYPE)) {
  console.error(`Invalid --type: "${TYPE}". Must be one of: skills, mcp, all`);
  process.exit(1);
}

// ── Helpers ─────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function buildUserPrompt({ name, description, category, tags, stars }) {
  return `工具信息：
名称：${name || "N/A"}
描述：${description || "N/A"}
分类：${category || "N/A"}
标签：${Array.isArray(tags) ? tags.join(", ") : tags || "N/A"}
Stars：${stars || 0}`;
}

function cleanLLMResponse(text) {
  // Strip markdown fences, quotes, leading/trailing whitespace
  return text
    .replace(/^```\w*\s*\n?/, "")
    .replace(/\n?```\s*$/, "")
    .replace(/^["「]/, "")
    .replace(/["」]$/, "")
    .trim();
}

// ── DB helpers ──────────────────────────────────────────────────────

async function fetchSkills(supabase, limit) {
  let query = supabase
    .from("skills")
    .select("slug, name, name_zh, description, category, tags, stars, editor_comment_zh")
    .eq("status", "published")
    .order("stars", { ascending: false })
    .limit(limit);

  if (!FORCE) {
    query = query.is("editor_comment_zh", null);
  }

  const { data, error } = await query;
  if (error) throw new Error(`DB read skills: ${error.message}`);
  return data || [];
}

async function fetchMcpServers(supabase, limit) {
  let query = supabase
    .from("mcp_servers")
    .select("slug, name, description, description_zh, category, tags, stars, editor_comment_zh")
    .eq("status", "published")
    .order("stars", { ascending: false })
    .limit(limit);

  if (!FORCE) {
    query = query.is("editor_comment_zh", null);
  }

  const { data, error } = await query;
  if (error) throw new Error(`DB read mcp_servers: ${error.message}`);
  return data || [];
}

// ── Process a single item ───────────────────────────────────────────

async function generateComment(item, type) {
  const prompt = buildUserPrompt({
    name: item.name_zh || item.name || item.slug,
    description: item.description_zh || item.description || "",
    category: item.category,
    tags: item.tags,
    stars: item.stars,
  });

  const text = await callLLM(SYSTEM_PROMPT, prompt, 256);
  return cleanLLMResponse(text);
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  validateEnv(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);

  const supabase = createAdminClient();
  const provider = getProviderInfo();

  log.info(`Backfill editor comments -- ${new Date().toISOString()}`);
  log.info(`Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"} | Type: ${TYPE} | Force: ${FORCE}`);
  log.info(`LLM provider: ${provider.name} (${provider.model})`);

  const stats = { skills: 0, mcp: 0, updated: 0, skipped: 0, errors: 0 };

  // ── Skills ──────────────────────────────────────────────────────

  if (TYPE === "skills" || TYPE === "all") {
    const limit = CUSTOM_LIMIT || DEFAULT_SKILLS_LIMIT;
    log.info(`\nFetching top ${limit} skills${FORCE ? " (force mode)" : " where editor_comment_zh IS NULL"}...`);

    const skills = await fetchSkills(supabase, limit);
    stats.skills = skills.length;
    log.info(`Found ${skills.length} skills to process`);

    for (let i = 0; i < skills.length; i++) {
      const skill = skills[i];
      const label = skill.name_zh || skill.name || skill.slug;

      try {
        const comment = await generateComment(skill, "skill");

        if (!comment || comment.length < 10) {
          log.warn(`  [${i + 1}/${skills.length}] ${label}: comment too short, skipping`);
          stats.skipped++;
          continue;
        }

        if (DRY_RUN) {
          log.info(`  [${i + 1}/${skills.length}] ${label} (★${skill.stars || 0})`);
          log.info(`    -> ${comment}`);
        } else {
          const { error } = await supabase
            .from("skills")
            .update({ editor_comment_zh: comment })
            .eq("slug", skill.slug);

          if (error) {
            log.error(`  [${i + 1}/${skills.length}] Failed to update ${skill.slug}: ${error.message}`);
            stats.errors++;
            continue;
          }

          log.success(`  [${i + 1}/${skills.length}] ${label} -> ${comment}`);
        }

        stats.updated++;
      } catch (err) {
        log.error(`  [${i + 1}/${skills.length}] ${label}: ${err.message}`);
        stats.errors++;
      }

      await sleep(RATE_LIMIT_MS);
    }
  }

  // ── MCP Servers ─────────────────────────────────────────────────

  if (TYPE === "mcp" || TYPE === "all") {
    const limit = CUSTOM_LIMIT || DEFAULT_MCP_LIMIT;
    log.info(`\nFetching top ${limit} MCP servers${FORCE ? " (force mode)" : " where editor_comment_zh IS NULL"}...`);

    const servers = await fetchMcpServers(supabase, limit);
    stats.mcp = servers.length;
    log.info(`Found ${servers.length} MCP servers to process`);

    for (let i = 0; i < servers.length; i++) {
      const server = servers[i];
      const label = server.name || server.slug;

      try {
        const comment = await generateComment(server, "mcp");

        if (!comment || comment.length < 10) {
          log.warn(`  [${i + 1}/${servers.length}] ${label}: comment too short, skipping`);
          stats.skipped++;
          continue;
        }

        if (DRY_RUN) {
          log.info(`  [${i + 1}/${servers.length}] ${label} (★${server.stars || 0})`);
          log.info(`    -> ${comment}`);
        } else {
          const { error } = await supabase
            .from("mcp_servers")
            .update({ editor_comment_zh: comment })
            .eq("slug", server.slug);

          if (error) {
            log.error(`  [${i + 1}/${servers.length}] Failed to update ${server.slug}: ${error.message}`);
            stats.errors++;
            continue;
          }

          log.success(`  [${i + 1}/${servers.length}] ${label} -> ${comment}`);
        }

        stats.updated++;
      } catch (err) {
        log.error(`  [${i + 1}/${servers.length}] ${label}: ${err.message}`);
        stats.errors++;
      }

      await sleep(RATE_LIMIT_MS);
    }
  }

  // ── Summary ───────────────────────────────────────────────────────

  const mode = DRY_RUN ? "[DRY RUN] " : "";
  const total = stats.skills + stats.mcp;
  const summaryLines = [
    `\n${mode}Backfill Editor Comments Summary:`,
    `  Skills processed: ${stats.skills}`,
    `  MCP servers processed: ${stats.mcp}`,
    `  Total: ${total}`,
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
