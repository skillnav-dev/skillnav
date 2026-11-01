#!/usr/bin/env node

/**
 * Draft permission boundaries for published Skills / MCP servers (issue #24).
 * Writes LLM drafts into tool_permissions; nothing is public until an editor
 * approves the entry in /admin/permissions. Reviewed rows are never touched.
 *
 * Usage:
 *   node scripts/generate-permissions.mjs                  # Dry run, all types
 *   node scripts/generate-permissions.mjs --apply          # Write drafts
 *   node scripts/generate-permissions.mjs --type mcp --limit 10 --apply
 *   node scripts/generate-permissions.mjs --slugs a,b --apply --force   # Redo unreviewed drafts
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { createAdminClient } from "./lib/supabase-admin.mjs";
import { createLogger } from "./lib/logger.mjs";
import { validateEnv } from "./lib/validate-env.mjs";
import { callLLM, getProviderInfo } from "./lib/llm.mjs";

const log = createLogger("generate-permissions");

const args = process.argv.slice(2);
const DRY_RUN = !args.includes("--apply");
const FORCE = args.includes("--force");
const argValue = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : null;
};
const TYPE = argValue("--type") ?? "all";
const LIMIT = argValue("--limit") ? Number(argValue("--limit")) : Infinity;
const SLUGS = argValue("--slugs")?.split(",").map((s) => s.trim()).filter(Boolean) ?? null;

const SOURCE_CHARS = 12000;
const RATE_LIMIT_MS = 300;

const SYSTEM_PROMPT = `你是 SkillNav 的安全编辑，为中文开发者评估一个 AI Agent 工具（Claude Code Skill 或 MCP Server）安装后能做什么。
只根据给出的材料判断，材料里没提到的能力不要臆测；拿不准时按更保守（权限更大）的一侧写，并在说明里写「材料未说明」。
返回 JSON，字段：
- files: "none" | "read" | "write"  —— 是否读写本地文件
- files_note: 一句话说明读写哪些文件或目录（中文，≤40 字）
- exec: boolean —— 是否执行 shell 命令或启动本地程序
- exec_note: 一句话说明（≤40 字）
- network: boolean —— 是否访问网络或第三方 API
- network_note: 一句话说明访问哪些服务（≤40 字）
- secrets: string[] —— 需要用户提供的环境变量或密钥名，如 ["GITHUB_TOKEN"]，没有则 []
- risk_zh: 1–2 句中文风险提示和使用建议（≤80 字），例如建议用只读 token、限定目录等`;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseJson(text) {
  return JSON.parse(text.replace(/^```json\s*\n?/, "").replace(/\n?```\s*$/, "").trim());
}

function repoOf(githubUrl) {
  const m = githubUrl?.match(/github\.com\/([^/]+)\/([^/#?]+)/);
  return m ? `${m[1]}/${m[2].replace(/\.git$/, "")}` : null;
}

async function fetchReadme(githubUrl) {
  const repo = repoOf(githubUrl);
  if (!repo) return "";
  const headers = { Accept: "application/vnd.github.raw", "User-Agent": "SkillNav-Sync/1.0" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/readme`, { headers });
    return res.ok ? await res.text() : "";
  } catch {
    return "";
  }
}

async function loadItems(supabase, type) {
  const table = type === "skill" ? "skills" : "mcp_servers";
  const columns =
    type === "skill"
      ? "slug, name, description, content, install_command, github_url, requires_env, requires_bins"
      : "slug, name, description, install_command, install_config, npm_package, tools, github_url";
  let query = supabase.from(table).select(columns);
  query = SLUGS ? query.in("slug", SLUGS) : query.eq("status", "published");
  const { data, error } = await query.order("stars", { ascending: false }).limit(1000);
  if (error) throw new Error(`DB read ${table}: ${error.message}`);
  return data ?? [];
}

async function loadExisting(supabase, type) {
  const { data, error } = await supabase
    .from("tool_permissions")
    .select("slug, reviewed_at")
    .eq("item_type", type);
  if (error) throw new Error(`DB read tool_permissions: ${error.message} (run migration 20261101_tool_permissions.sql first)`);
  return new Map((data ?? []).map((r) => [r.slug, r]));
}

async function buildSource(type, item) {
  const parts = [`名称：${item.name}`, `简介：${item.description ?? ""}`];
  if (item.install_command) parts.push(`安装命令：${item.install_command}`);
  if (type === "skill") {
    if (item.requires_env?.length) parts.push(`需要的环境变量：${item.requires_env.join(", ")}`);
    if (item.requires_bins?.length) parts.push(`需要的命令行工具：${item.requires_bins.join(", ")}`);
    parts.push(`SKILL.md：\n${(item.content ?? "").slice(0, SOURCE_CHARS)}`);
  } else {
    if (item.install_config) parts.push(`配置：${JSON.stringify(item.install_config).slice(0, 1500)}`);
    if (item.tools?.length) {
      const tools = item.tools.map((t) => `- ${t.name}: ${(t.description ?? "").slice(0, 120)}`).join("\n");
      parts.push(`工具列表：\n${tools.slice(0, 4000)}`);
    }
    const readme = await fetchReadme(item.github_url);
    if (readme) parts.push(`README：\n${readme.slice(0, SOURCE_CHARS)}`);
  }
  return parts.join("\n\n");
}

async function main() {
  validateEnv(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
  const supabase = createAdminClient();
  const { name, model } = getProviderInfo();
  log.info(`Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"} | type=${TYPE} | force=${FORCE} | LLM: ${name} (${model})`);

  const stats = { drafted: 0, skipped: 0, errors: 0 };
  const types = TYPE === "all" ? ["skill", "mcp"] : [TYPE];

  for (const type of types) {
    const existing = await loadExisting(supabase, type);
    const items = (await loadItems(supabase, type)).filter((it) => {
      const row = existing.get(it.slug);
      if (row?.reviewed_at) return false; // never overwrite an editor's review
      return FORCE || !row;
    });
    const todo = items.slice(0, LIMIT);
    log.info(`[${type}] ${todo.length} to draft (${existing.size} already in table)`);

    for (const item of todo) {
      try {
        const source = await buildSource(type, item);
        const draft = parseJson(await callLLM(SYSTEM_PROMPT, source, 2048));
        if (DRY_RUN) {
          log.info(`  [dry-run] ${type}/${item.slug}: ${JSON.stringify(draft)}`);
        } else {
          const { error } = await supabase.from("tool_permissions").upsert(
            { item_type: type, slug: item.slug, draft, final: null, reviewed_at: null, generated_at: new Date().toISOString() },
            { onConflict: "item_type,slug" },
          );
          if (error) throw new Error(error.message);
          log.info(`  drafted ${type}/${item.slug}`);
        }
        stats.drafted++;
      } catch (err) {
        log.error(`  ${type}/${item.slug}: ${err.message}`);
        stats.errors++;
      }
      await sleep(RATE_LIMIT_MS);
    }
  }

  log.summary(`${DRY_RUN ? "[DRY RUN] " : ""}Permission drafts: ${stats.drafted} drafted, ${stats.errors} errors`);
  log.setOutput("drafted", stats.drafted);
  log.done();
  if (stats.errors > 0 && stats.drafted === 0) process.exit(1);
}

main().catch((err) => {
  log.error(err.message);
  process.exit(1);
});
