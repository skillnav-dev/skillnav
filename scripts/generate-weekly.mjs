#!/usr/bin/env node

/**
 * Generate weekly newsletter integrating three pillars: Articles + Skills + MCP.
 *
 * Flow:
 *   1. Query articles, new/trending skills, new/trending MCP servers from last 7 days
 *   2. Query freshness changes (stale/archived tools)
 *   3. LLM editor's note with full context
 *   4. Assemble three-pillar Markdown
 *   5. Upsert to DB
 *
 * Usage:
 *   node scripts/generate-weekly.mjs                       # Generate for last week
 *   node scripts/generate-weekly.mjs --dry-run             # Preview, don't write to DB
 *   node scripts/generate-weekly.mjs --week-of 2026-03-03  # Specify week (Monday date)
 *   node scripts/generate-weekly.mjs --limit 20            # Max articles to include
 *   node scripts/generate-weekly.mjs --no-llm              # Skip LLM, use template intro
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import { createAdminClient } from "./lib/supabase-admin.mjs";
import { createLogger } from "./lib/logger.mjs";
import { validateEnv } from "./lib/validate-env.mjs";
import { getProviderInfo } from "./lib/llm.mjs";

const log = createLogger("weekly");

// ── Source display names (ordered for newsletter) ────────────────────
const SOURCE_LABELS = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  langchain: "LangChain",
  github: "GitHub",
  huggingface: "Hugging Face",
  crewai: "CrewAI",
  simonw: "Simon Willison",
  "latent-space": "Latent Space",
  "ai-coding-daily": "AI Coding Daily",
  thenewstack: "The New Stack",
};

// ── Date Helpers ─────────────────────────────────────────────────────

/** Get the Monday of the week containing `date`. */
function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Sunday → -6, else 1-day
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Get the previous Monday (start of last week). */
function getPreviousMonday() {
  const today = new Date();
  const thisMonday = getMonday(today);
  thisMonday.setDate(thisMonday.getDate() - 7);
  return thisMonday;
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ── Data Queries ─────────────────────────────────────────────────────

/**
 * Query new skills discovered this week.
 * @returns {Promise<Array>}
 */
async function queryNewSkills(supabase, monday, sunday) {
  const { data, error } = await supabase
    .from("skills")
    .select("slug, name, name_zh, description_zh, stars")
    .eq("status", "published")
    .gte("discovered_at", monday.toISOString())
    .lte("discovered_at", sunday.toISOString())
    .order("stars", { ascending: false })
    .limit(10);

  if (error) {
    log.warn(`Skills query failed: ${error.message}`);
    return [];
  }
  return data || [];
}

/**
 * Query trending skills this week.
 * @returns {Promise<Array>}
 */
async function queryTrendingSkills(supabase) {
  const { data, error } = await supabase
    .from("skills")
    .select("slug, name, name_zh, stars, weekly_stars_delta")
    .eq("status", "published")
    .eq("is_trending", true)
    .order("weekly_stars_delta", { ascending: false })
    .limit(10);

  if (error) {
    log.warn(`Trending skills query failed: ${error.message}`);
    return [];
  }
  return data || [];
}

/**
 * Query new MCP servers discovered this week.
 * @returns {Promise<Array>}
 */
async function queryNewMcp(supabase, monday, sunday) {
  const { data, error } = await supabase
    .from("mcp_servers")
    .select("slug, name, name_zh, description_zh, stars")
    .eq("status", "published")
    .gte("discovered_at", monday.toISOString())
    .lte("discovered_at", sunday.toISOString())
    .order("stars", { ascending: false })
    .limit(10);

  if (error) {
    log.warn(`MCP servers query failed: ${error.message}`);
    return [];
  }
  return data || [];
}

/**
 * Query trending MCP servers this week.
 * @returns {Promise<Array>}
 */
async function queryTrendingMcp(supabase) {
  const { data, error } = await supabase
    .from("mcp_servers")
    .select("slug, name, name_zh, stars, weekly_stars_delta")
    .eq("status", "published")
    .eq("is_trending", true)
    .order("weekly_stars_delta", { ascending: false })
    .limit(10);

  if (error) {
    log.warn(`Trending MCP query failed: ${error.message}`);
    return [];
  }
  return data || [];
}

/**
 * Query tools with freshness changes (stale or archived).
 * Checks both skills and mcp_servers tables.
 * @returns {Promise<{ stale: Array, archived: Array }>}
 */
async function queryFreshnessChanges(supabase) {
  const stale = [];
  const archived = [];

  // Stale skills
  const { data: staleSkills } = await supabase
    .from("skills")
    .select("slug, name, name_zh, freshness")
    .eq("freshness", "stale")
    .eq("status", "published")
    .limit(10);

  if (staleSkills?.length) {
    for (const s of staleSkills) {
      stale.push({ ...s, type: "skills" });
    }
  }

  // Stale MCP
  const { data: staleMcp } = await supabase
    .from("mcp_servers")
    .select("slug, name, name_zh, freshness")
    .eq("freshness", "stale")
    .eq("status", "published")
    .limit(10);

  if (staleMcp?.length) {
    for (const s of staleMcp) {
      stale.push({ ...s, type: "mcp" });
    }
  }

  // Archived skills
  const { data: archivedSkills } = await supabase
    .from("skills")
    .select("slug, name, name_zh, freshness")
    .eq("freshness", "archived")
    .limit(10);

  if (archivedSkills?.length) {
    for (const s of archivedSkills) {
      archived.push({ ...s, type: "skills" });
    }
  }

  // Archived MCP
  const { data: archivedMcp } = await supabase
    .from("mcp_servers")
    .select("slug, name, name_zh, freshness")
    .eq("freshness", "archived")
    .limit(10);

  if (archivedMcp?.length) {
    for (const s of archivedMcp) {
      archived.push({ ...s, type: "mcp" });
    }
  }

  return { stale, archived };
}

// ── LLM Editor's Note ───────────────────────────────────────────────

async function generateEditorsNote(context, weekNumber) {
  // Dynamic import to avoid requiring API key when --no-llm
  const { callLLM } = await import("./lib/llm.mjs");

  const { articles, newSkills, newMcp, trendingSkills, trendingMcp } = context;

  const sourceGroups = groupBySource(articles);
  const sourceSummary = Object.entries(sourceGroups)
    .map(([source, items]) => `${SOURCE_LABELS[source] || source}: ${items.length} articles`)
    .join(", ");

  const topTitles = articles
    .slice(0, 8)
    .map((a) => `- ${a.title_zh || a.title}`)
    .join("\n");

  // Build tools context for LLM
  const toolsContext = [];
  if (newSkills.length) {
    toolsContext.push(
      `New Skills this week (${newSkills.length}): ${newSkills.map((s) => s.name).join(", ")}`
    );
  }
  if (newMcp.length) {
    toolsContext.push(
      `New MCP Servers this week (${newMcp.length}): ${newMcp.map((s) => s.name).join(", ")}`
    );
  }
  if (trendingSkills.length) {
    toolsContext.push(
      `Trending Skills: ${trendingSkills.map((s) => `${s.name} (+${s.weekly_stars_delta || 0})`).join(", ")}`
    );
  }
  if (trendingMcp.length) {
    toolsContext.push(
      `Trending MCP: ${trendingMcp.map((s) => `${s.name} (+${s.weekly_stars_delta || 0})`).join(", ")}`
    );
  }

  const toolsSummary = toolsContext.length
    ? `\n\nTools ecosystem updates:\n${toolsContext.join("\n")}`
    : "";

  const systemPrompt = `You are the editor of SkillNav Weekly, a Chinese-language newsletter about AI Agent tools, Skills, and MCP ecosystem. Write in natural, professional Chinese.`;

  const userPrompt = `Write a brief editor's note (编者按) for SkillNav Weekly #${weekNumber}. 1-2 paragraphs in Chinese.

This week we have ${articles.length} selected articles from: ${sourceSummary}.

Top articles:
${topTitles}
${toolsSummary}

Requirements:
- Summarize the week's highlights and trends
- If there are new Skills or MCP servers, mention them briefly as ecosystem highlights
- Mention notable sources or topics
- Keep it concise (100-250 Chinese characters)
- Do NOT use markdown formatting, just plain text
- Return ONLY the editor's note text, nothing else`;

  const text = await callLLM(systemPrompt, userPrompt, 1024);
  return text.trim();
}

/** Fallback template when --no-llm is used. */
function templateEditorsNote(context, weekNumber) {
  const { articles, newSkills, newMcp } = context;
  const sourceCount = new Set(articles.map((a) => a.source)).size;

  const parts = [`本期精选了 ${articles.length} 篇来自 ${sourceCount} 个信息源的文章`];
  if (newSkills.length) {
    parts.push(`${newSkills.length} 个新 Skill`);
  }
  if (newMcp.length) {
    parts.push(`${newMcp.length} 个新 MCP Server`);
  }
  return parts.join("、") + "，涵盖 AI Agent 工具生态的最新动态。";
}

// ── Markdown Assembly ────────────────────────────────────────────────

function groupBySource(articles) {
  const groups = {};
  for (const article of articles) {
    const source = article.source || "other";
    if (!groups[source]) groups[source] = [];
    groups[source].push(article);
  }
  return groups;
}

/** Format a tool's display name, preferring Chinese. */
function toolDisplayName(item) {
  return item.name_zh || item.name;
}

/** Format a short description for a tool, truncated. */
function toolDescription(item) {
  const desc = item.description_zh || "";
  if (!desc) return "";
  return desc.length > 60 ? desc.slice(0, 60) + "..." : desc;
}

/** Build the route path for a tool item. */
function toolPath(item, type) {
  const prefix = type === "mcp" ? "/mcp" : "/skills";
  return `${prefix}/${item.slug}`;
}

function assembleMarkdown(editorsNote, context, weekNumber) {
  const {
    articles,
    newSkills,
    newMcp,
    trendingSkills,
    trendingMcp,
    freshnessChanges,
  } = context;

  const lines = [];

  // Editor's note
  lines.push(`> 编者按：${editorsNote}`);
  lines.push("");

  // ── Highlights section (only if there's content) ──
  const hasNewSkills = newSkills.length > 0;
  const hasNewMcp = newMcp.length > 0;
  const hasTrending = trendingSkills.length > 0 || trendingMcp.length > 0;

  if (hasNewSkills || hasNewMcp || hasTrending) {
    lines.push("## 🔥 本周亮点");
    lines.push("");

    if (hasNewSkills) {
      lines.push("### 新 Skills");
      lines.push("");
      for (const skill of newSkills) {
        const desc = toolDescription(skill);
        const descPart = desc ? ` — ${desc}` : "";
        const stars = skill.stars ? ` ⭐ ${skill.stars}` : "";
        lines.push(
          `- [${toolDisplayName(skill)}](${toolPath(skill, "skills")})${descPart}${stars}`
        );
      }
      lines.push("");
    }

    if (hasNewMcp) {
      lines.push("### 新 MCP Server");
      lines.push("");
      for (const mcp of newMcp) {
        const desc = toolDescription(mcp);
        const descPart = desc ? ` — ${desc}` : "";
        const stars = mcp.stars ? ` ⭐ ${mcp.stars}` : "";
        lines.push(
          `- [${toolDisplayName(mcp)}](${toolPath(mcp, "mcp")})${descPart}${stars}`
        );
      }
      lines.push("");
    }

    if (hasTrending) {
      lines.push("### Trending");
      lines.push("");
      // Merge trending skills and MCP, sort by weekly_stars_delta desc
      const allTrending = [
        ...trendingSkills.map((s) => ({ ...s, _type: "skills" })),
        ...trendingMcp.map((s) => ({ ...s, _type: "mcp" })),
      ].sort((a, b) => (b.weekly_stars_delta || 0) - (a.weekly_stars_delta || 0));

      for (const item of allTrending) {
        const delta = item.weekly_stars_delta || 0;
        lines.push(
          `- [${toolDisplayName(item)}](${toolPath(item, item._type)}) — ⭐ +${delta} 本周`
        );
      }
      lines.push("");
    }
  }

  // ── Articles section ──
  lines.push("## 📰 精选文章");
  lines.push("");

  const groups = groupBySource(articles);
  const sourceOrder = Object.keys(SOURCE_LABELS);
  const sortedSources = Object.keys(groups).sort((a, b) => {
    const idxA = sourceOrder.indexOf(a);
    const idxB = sourceOrder.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

  for (const source of sortedSources) {
    const label = SOURCE_LABELS[source] || source;
    lines.push(`### ${label}`);
    lines.push("");

    for (const article of groups[source]) {
      const title = article.title_zh || article.title;
      const summary = article.summary_zh || article.summary || "";
      lines.push(`#### [${title}](/articles/${article.slug})`);
      if (summary) {
        const shortSummary =
          summary.length > 150 ? summary.slice(0, 150) + "…" : summary;
        lines.push(`> ${shortSummary}`);
      }
      lines.push("");
    }
  }

  // ── Ecosystem dynamics section (only if there are changes) ──
  const { stale, archived } = freshnessChanges;
  if (stale.length > 0 || archived.length > 0) {
    lines.push("## ⚠️ 生态动态");
    lines.push("");

    for (const item of stale) {
      lines.push(
        `- **停更提醒**: [${toolDisplayName(item)}](${toolPath(item, item.type)}) 超过 6 个月未更新`
      );
    }
    for (const item of archived) {
      lines.push(
        `- **归档**: [${toolDisplayName(item)}](${toolPath(item, item.type)}) 已归档`
      );
    }
    lines.push("");
  }

  // Footer
  lines.push("---");
  lines.push(`📮 这是 SkillNav 周刊第 ${weekNumber} 期，每周一发布。`);

  return lines.join("\n");
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const noLlm = args.includes("--no-llm");
  const weekOfIdx = args.indexOf("--week-of");
  const weekOfStr = weekOfIdx !== -1 ? args[weekOfIdx + 1] : null;
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx !== -1 ? Number(args[limitIdx + 1]) : 15;

  // Determine date range
  const monday = weekOfStr ? getMonday(new Date(weekOfStr)) : getPreviousMonday();
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  log.info(`Weekly range: ${formatDate(monday)} ~ ${formatDate(sunday)}`);
  log.info(`Options: limit=${limit}, dry-run=${dryRun}, no-llm=${noLlm}`);

  // Validate env
  validateEnv(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
  if (!noLlm && !dryRun) {
    const { name, model } = getProviderInfo();
    log.info(`LLM provider: ${name} (${model})`);
  }

  const supabase = createAdminClient();

  // Determine series_number: max existing + 1
  const { data: lastWeekly } = await supabase
    .from("articles")
    .select("series_number")
    .eq("series", "weekly")
    .order("series_number", { ascending: false })
    .limit(1);

  const weekNumber = (lastWeekly?.[0]?.series_number || 0) + 1;
  const slug = `weekly-${weekNumber}`;

  // Check for duplicate
  const { data: existing } = await supabase
    .from("articles")
    .select("id, slug")
    .eq("slug", slug)
    .limit(1);

  if (existing?.length) {
    log.warn(`Weekly #${weekNumber} (slug: ${slug}) already exists. Use --week-of to specify a different week, or delete the existing entry first.`);
    process.exit(1);
  }

  // ── Query all three pillars in parallel ──
  log.info("Querying articles, skills, and MCP servers...");

  const [articlesResult, newSkills, trendingSkills, newMcp, trendingMcp, freshnessChanges] =
    await Promise.all([
      // Articles
      supabase
        .from("articles")
        .select("slug, title, title_zh, summary, summary_zh, source, relevance_score, published_at")
        .eq("status", "published")
        .or("series.is.null,series.neq.weekly")
        .gte("published_at", monday.toISOString())
        .lte("published_at", sunday.toISOString())
        .order("relevance_score", { ascending: false })
        .order("published_at", { ascending: false })
        .limit(limit),
      // New skills
      queryNewSkills(supabase, monday, sunday),
      // Trending skills
      queryTrendingSkills(supabase),
      // New MCP
      queryNewMcp(supabase, monday, sunday),
      // Trending MCP
      queryTrendingMcp(supabase),
      // Freshness changes
      queryFreshnessChanges(supabase),
    ]);

  const { data: articles, error: queryErr } = articlesResult;

  if (queryErr) {
    log.error(`Articles query failed: ${queryErr.message}`);
    process.exit(1);
  }

  if (!articles?.length) {
    log.warn(`No published articles found for ${formatDate(monday)} ~ ${formatDate(sunday)}.`);
    log.info("Make sure articles in this date range have status='published'.");
    process.exit(0);
  }

  log.info(`Found ${articles.length} articles for weekly #${weekNumber}`);
  if (newSkills.length) log.info(`Found ${newSkills.length} new skills`);
  if (trendingSkills.length) log.info(`Found ${trendingSkills.length} trending skills`);
  if (newMcp.length) log.info(`Found ${newMcp.length} new MCP servers`);
  if (trendingMcp.length) log.info(`Found ${trendingMcp.length} trending MCP servers`);
  const { stale, archived } = freshnessChanges;
  if (stale.length || archived.length) {
    log.info(`Found ${stale.length} stale + ${archived.length} archived tools`);
  }

  // Build context object for assembly functions
  const context = {
    articles,
    newSkills,
    trendingSkills,
    newMcp,
    trendingMcp,
    freshnessChanges,
  };

  // Generate editor's note
  let editorsNote;
  if (noLlm) {
    editorsNote = templateEditorsNote(context, weekNumber);
    log.info("Using template editor's note (--no-llm)");
  } else {
    log.info("Generating editor's note via LLM...");
    try {
      editorsNote = await generateEditorsNote(context, weekNumber);
      log.success("Editor's note generated");
    } catch (e) {
      log.warn(`LLM failed: ${e.message}. Falling back to template.`);
      editorsNote = templateEditorsNote(context, weekNumber);
    }
  }

  // Assemble markdown
  const markdown = assembleMarkdown(editorsNote, context, weekNumber);

  // Extract first sentence of editor's note for summary
  const summaryZh = editorsNote.split(/[。！？]/)[0] + "。";

  // Build DB record
  const record = {
    slug,
    title: `SkillNav Weekly #${weekNumber}`,
    title_zh: `SkillNav 周刊第 ${weekNumber} 期`,
    summary_zh: summaryZh,
    content: markdown,
    content_zh: markdown,
    article_type: "guide",
    content_tier: "editorial",
    series: "weekly",
    series_number: weekNumber,
    source: "manual",
    status: "draft",
    reading_time: Math.max(1, Math.round(articles.length * 0.5)),
    published_at: monday.toISOString(),
  };

  if (dryRun) {
    log.info("\n── Preview ──────────────────────────────────");
    console.log(markdown);
    log.info("── End Preview ──────────────────────────────\n");
    log.info(`Slug: ${record.slug}`);
    log.info(`Title: ${record.title_zh}`);
    log.info(`Summary: ${record.summary_zh}`);
    log.info(`Articles: ${articles.length}`);
    log.info(`New Skills: ${newSkills.length}`);
    log.info(`New MCP: ${newMcp.length}`);
    log.info(`Trending: ${trendingSkills.length} skills, ${trendingMcp.length} MCP`);
    log.info(`Stale/Archived: ${stale.length}/${archived.length}`);
    log.info(`Reading time: ${record.reading_time} min`);
    log.info(`Published at: ${formatDate(monday)}`);
    log.info("[DRY RUN] No records written to database.");
  } else {
    const { error: insertErr } = await supabase
      .from("articles")
      .insert(record);

    if (insertErr) {
      log.error(`Insert failed: ${insertErr.message}`);
      process.exit(1);
    }

    log.success(`Inserted weekly #${weekNumber} as draft`);
  }

  // Summary for GitHub Actions
  const summaryLines = [
    "## Weekly Newsletter Generated",
    "",
    `| Field | Value |`,
    `|-------|-------|`,
    `| Issue | #${weekNumber} |`,
    `| Slug | \`${slug}\` |`,
    `| Date Range | ${formatDate(monday)} ~ ${formatDate(sunday)} |`,
    `| Articles | ${articles.length} |`,
    `| New Skills | ${newSkills.length} |`,
    `| New MCP | ${newMcp.length} |`,
    `| Trending | ${trendingSkills.length} skills, ${trendingMcp.length} MCP |`,
    `| Stale/Archived | ${stale.length}/${archived.length} |`,
    `| Status | draft |`,
    dryRun ? "\n> **DRY RUN** — no records written" : "",
  ];
  log.summary(summaryLines.join("\n"));

  log.done();
}

main().catch((e) => {
  log.error(e.message);
  process.exit(1);
});
