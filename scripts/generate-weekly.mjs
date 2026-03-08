#!/usr/bin/env node

/**
 * Generate weekly newsletter from recently synced articles.
 *
 * Flow: query articles from last 7 days → group by source → LLM editor's note → assemble Markdown → upsert to DB.
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

// ── LLM Editor's Note ───────────────────────────────────────────────

async function generateEditorsNote(articles, weekNumber) {
  // Dynamic import to avoid requiring API key when --no-llm
  const { callLLM } = await import("./lib/llm.mjs");

  const sourceGroups = groupBySource(articles);
  const sourceSummary = Object.entries(sourceGroups)
    .map(([source, items]) => `${SOURCE_LABELS[source] || source}: ${items.length} articles`)
    .join(", ");

  const topTitles = articles
    .slice(0, 10)
    .map((a) => `- ${a.title_zh || a.title}`)
    .join("\n");

  const systemPrompt = `You are the editor of SkillNav Weekly, a Chinese-language newsletter about AI Agent tools, Skills, and MCP ecosystem. Write in natural, professional Chinese.`;

  const userPrompt = `Write a brief editor's note (编者按) for SkillNav Weekly #${weekNumber}. 1-2 paragraphs in Chinese.

This week we have ${articles.length} selected articles from: ${sourceSummary}.

Top articles:
${topTitles}

Requirements:
- Summarize the week's highlights and trends
- Mention notable sources or topics
- Keep it concise (100-200 Chinese characters)
- Do NOT use markdown formatting, just plain text
- Return ONLY the editor's note text, nothing else`;

  const text = await callLLM(systemPrompt, userPrompt, 1024);
  return text.trim();
}

/** Fallback template when --no-llm is used. */
function templateEditorsNote(articles, weekNumber) {
  const sourceCount = new Set(articles.map((a) => a.source)).size;
  return `本期精选了 ${articles.length} 篇来自 ${sourceCount} 个信息源的文章，涵盖 AI Agent 工具生态的最新动态。`;
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

function assembleMarkdown(editorsNote, articles, weekNumber) {
  const lines = [];

  // Editor's note
  lines.push(`> 编者按：${editorsNote}`);
  lines.push("");

  // Group articles by source
  const groups = groupBySource(articles);

  // Sort source groups by SOURCE_LABELS order, then alphabetically
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
    lines.push(`## ${label}`);
    lines.push("");

    for (const article of groups[source]) {
      const title = article.title_zh || article.title;
      const summary = article.summary_zh || article.summary || "";
      lines.push(`### [${title}](/articles/${article.slug})`);
      if (summary) {
        // Take first sentence or first 150 chars
        const shortSummary = summary.length > 150
          ? summary.slice(0, 150) + "…"
          : summary;
        lines.push(`> ${shortSummary}`);
      }
      lines.push("");
    }
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

  // Query published articles in date range (exclude weekly issues themselves)
  const { data: articles, error: queryErr } = await supabase
    .from("articles")
    .select("slug, title, title_zh, summary, summary_zh, source, relevance_score, published_at")
    .eq("status", "published")
    .or("series.is.null,series.neq.weekly")
    .gte("published_at", monday.toISOString())
    .lte("published_at", sunday.toISOString())
    .order("relevance_score", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(limit);

  if (queryErr) {
    log.error(`Query failed: ${queryErr.message}`);
    process.exit(1);
  }

  if (!articles?.length) {
    log.warn(`No published articles found for ${formatDate(monday)} ~ ${formatDate(sunday)}.`);
    log.info("Make sure articles in this date range have status='published'.");
    process.exit(0);
  }

  log.info(`Found ${articles.length} articles for weekly #${weekNumber}`);

  // Generate editor's note
  let editorsNote;
  if (noLlm) {
    editorsNote = templateEditorsNote(articles, weekNumber);
    log.info("Using template editor's note (--no-llm)");
  } else {
    log.info("Generating editor's note via LLM...");
    try {
      editorsNote = await generateEditorsNote(articles, weekNumber);
      log.success("Editor's note generated");
    } catch (e) {
      log.warn(`LLM failed: ${e.message}. Falling back to template.`);
      editorsNote = templateEditorsNote(articles, weekNumber);
    }
  }

  // Assemble markdown
  const markdown = assembleMarkdown(editorsNote, articles, weekNumber);

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
