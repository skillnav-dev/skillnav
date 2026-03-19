#!/usr/bin/env node

/**
 * Generate daily AI brief from recent articles.
 * Queries published articles from last 24h, uses LLM to curate a daily digest,
 * generates 3 output formats (Markdown, WeChat HTML, X thread), upserts to DB.
 *
 * Usage:
 *   node scripts/generate-daily.mjs                      # Generate for today
 *   node scripts/generate-daily.mjs --dry-run             # Preview, don't write to DB
 *   node scripts/generate-daily.mjs --date 2026-03-19     # Specific date
 *   node scripts/generate-daily.mjs --hours 48            # Look back 48h instead of 24h
 *   node scripts/generate-daily.mjs --no-llm              # Skip LLM, use template
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import { createAdminClient } from "./lib/supabase-admin.mjs";
import { createLogger } from "./lib/logger.mjs";
import { validateEnv } from "./lib/validate-env.mjs";
import { getProviderInfo } from "./lib/llm.mjs";
import { markdownToWechatHtml } from "./lib/publishers/wechat.mjs";
import { formatXThread, threadToText } from "./lib/publishers/twitter.mjs";

const log = createLogger("daily");

// ── Source display names ────────────────────────────────────────────
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

// ── Date Helpers ────────────────────────────────────────────────────

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateChinese(date) {
  return `${date.getFullYear()} 年 ${date.getMonth() + 1} 月 ${date.getDate()} 日`;
}

// ── Data Query ──────────────────────────────────────────────────────

async function queryRecentArticles(supabase, since, until, limit = 20) {
  const { data, error } = await supabase
    .from("articles")
    .select("id, slug, title, title_zh, summary, summary_zh, source, source_url, relevance_score, published_at")
    .eq("status", "published")
    .or("series.is.null,series.neq.weekly")
    .gte("published_at", since.toISOString())
    .lte("published_at", until.toISOString())
    .order("relevance_score", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    log.error(`Articles query failed: ${error.message}`);
    return [];
  }
  return data || [];
}

// ── LLM Curation ───────────────────────────────────────────────────

async function generateEditorialBrief(articles) {
  const { callLLM } = await import("./lib/llm.mjs");

  const articleList = articles
    .map((a, i) => `${i + 1}. [${a.slug}] ${a.title_zh || a.title} (来源: ${SOURCE_LABELS[a.source] || a.source})`)
    .join("\n");

  const systemPrompt = `You are the editor of SkillNav Daily Brief, a Chinese-language daily digest of AI agent tools and developer ecosystem news. You write concise, insightful daily summaries for busy developers.`;

  const userPrompt = `Generate a daily brief from these ${articles.length} articles:

${articleList}

Return a JSON object:
{
  "title": "今日标题（中文，10-20字，概括今天最重要的主题）",
  "summary": "编者导语（中文，50-100字，概括今天的关键看点，有判断力）",
  "highlights": [
    { "slug": "article-slug", "oneLiner": "一句话概括这篇文章的价值（中文，20-40字）" }
  ]
}

Rules:
- highlights: pick the top ${Math.min(articles.length, 8)} most important articles, ordered by importance
- Use article slugs from the list above
- title should be catchy but informative, not clickbait
- summary should help a developer decide if today's brief is worth 2 minutes
- Return ONLY valid JSON, no markdown fences`;

  const raw = await callLLM(systemPrompt, userPrompt, 2048);
  const jsonStr = raw.replace(/^```(?:json)?\s*/m, "").replace(/```\s*$/m, "").trim();
  const plan = JSON.parse(jsonStr);

  if (!plan.title || !plan.summary || !Array.isArray(plan.highlights)) {
    throw new Error("LLM returned invalid brief structure");
  }

  // Enforce length limits on LLM output
  plan.title = String(plan.title).slice(0, 100);
  plan.summary = String(plan.summary).slice(0, 500);
  for (const h of plan.highlights) {
    if (h.oneLiner) h.oneLiner = String(h.oneLiner).slice(0, 200);
  }

  // Validate slugs exist
  const validSlugs = new Set(articles.map((a) => a.slug));
  plan.highlights = plan.highlights.filter((h) => validSlugs.has(h.slug));

  return plan;
}

function fallbackBrief(articles) {
  const sourceCount = new Set(articles.map((a) => a.source)).size;
  return {
    title: `AI 日报：${articles.length} 篇精选`,
    summary: `今日精选了 ${articles.length} 篇来自 ${sourceCount} 个信息源的 AI 资讯。`,
    highlights: articles.slice(0, 8).map((a) => ({
      slug: a.slug,
      oneLiner: a.summary_zh?.slice(0, 40) || a.title_zh || a.title,
    })),
  };
}

// ── Markdown Assembly ───────────────────────────────────────────────

function assembleMarkdown(editorialBrief, articles, briefDate) {
  const articleMap = new Map(articles.map((a) => [a.slug, a]));
  const lines = [];

  // Editor's note
  lines.push(`> ${editorialBrief.summary}`);
  lines.push("");

  // Highlights
  lines.push("## 📰 今日精选");
  lines.push("");

  for (const highlight of editorialBrief.highlights) {
    const article = articleMap.get(highlight.slug);
    if (!article) continue;

    const title = article.title_zh || article.title;
    const source = SOURCE_LABELS[article.source] || article.source;

    lines.push(`### [${title}](/articles/${article.slug})`);
    lines.push(`*${source}*`);
    lines.push("");
    lines.push(highlight.oneLiner);
    lines.push("");
  }

  // Footer
  lines.push("---");
  lines.push(`📮 SkillNav AI 日报 · ${formatDateChinese(briefDate)} · skillnav.dev`);

  return lines.join("\n");
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const noLlm = args.includes("--no-llm");
  const dateIdx = args.indexOf("--date");
  const dateStr = dateIdx !== -1 ? args[dateIdx + 1] : null;
  const hoursIdx = args.indexOf("--hours");
  const lookbackHours = hoursIdx !== -1 ? Number(args[hoursIdx + 1]) : 24;

  // Determine date range
  const briefDate = dateStr ? new Date(dateStr) : new Date();
  const until = new Date(briefDate);
  until.setHours(23, 59, 59, 999);
  const since = new Date(until);
  since.setHours(since.getHours() - lookbackHours);

  const dateLabel = formatDate(briefDate);
  log.info(`Daily brief for: ${dateLabel}`);
  log.info(`Lookback: ${lookbackHours}h (${since.toISOString()} ~ ${until.toISOString()})`);
  log.info(`Options: dry-run=${dryRun}, no-llm=${noLlm}`);

  // Validate env
  validateEnv(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
  if (!noLlm && !dryRun) {
    const { name, model } = getProviderInfo();
    log.info(`LLM provider: ${name} (${model})`);
  }

  const supabase = createAdminClient();

  // Check for existing brief on this date
  const { data: existing } = await supabase
    .from("daily_briefs")
    .select("id, status")
    .eq("brief_date", dateLabel)
    .limit(1);

  if (existing?.length && !dryRun) {
    if (existing[0].status !== "draft") {
      log.warn(`Brief for ${dateLabel} is already ${existing[0].status}. Use --force to overwrite.`);
      if (!args.includes("--force")) {
        process.exit(0);
      }
    } else {
      log.warn(`Brief for ${dateLabel} already exists as draft. Updating.`);
    }
  }

  // Query recent articles
  const articles = await queryRecentArticles(supabase, since, until);

  if (!articles.length) {
    log.warn(`No published articles found in the last ${lookbackHours}h.`);
    if (!dryRun) {
      log.info("Skipping brief generation. Run with --hours 48 to extend lookback.");
    }
    process.exit(0);
  }

  log.info(`Found ${articles.length} articles`);

  // Generate editorial brief
  let editorialBrief;
  if (noLlm) {
    editorialBrief = fallbackBrief(articles);
    log.info("Using fallback brief (--no-llm)");
  } else {
    log.info("Generating editorial brief via LLM...");
    try {
      editorialBrief = await generateEditorialBrief(articles);
      log.success(`Brief: "${editorialBrief.title}" with ${editorialBrief.highlights.length} highlights`);
    } catch (e) {
      log.warn(`LLM failed: ${e.message}. Using fallback.`);
      editorialBrief = fallbackBrief(articles);
    }
  }

  // Assemble Markdown
  const contentMd = assembleMarkdown(editorialBrief, articles, briefDate);

  // Generate WeChat HTML
  const contentWechat = markdownToWechatHtml(contentMd, {
    title: editorialBrief.title,
    date: formatDateChinese(briefDate),
    articleCount: editorialBrief.highlights.length,
  });

  // Generate X thread
  const threadItems = editorialBrief.highlights.map((h) => {
    const article = articles.find((a) => a.slug === h.slug);
    return {
      title: article?.title_zh || article?.title || h.slug,
      summary: h.oneLiner,
      url: article?.source_url || `https://skillnav.dev/articles/${h.slug}`,
    };
  });
  const tweets = formatXThread(threadItems, { date: dateLabel });
  const contentX = threadToText(tweets);

  // Collect article IDs
  const articleIds = editorialBrief.highlights
    .map((h) => articles.find((a) => a.slug === h.slug)?.id)
    .filter(Boolean);

  // Build DB record
  const record = {
    brief_date: dateLabel,
    title: editorialBrief.title,
    summary: editorialBrief.summary,
    content_md: contentMd,
    content_wechat: contentWechat,
    content_x: contentX,
    article_ids: articleIds,
    status: "draft",
  };

  if (dryRun) {
    log.info("\n── Markdown Preview ─────────────────────────");
    console.log(contentMd);
    log.info("\n── X Thread Preview ─────────────────────────");
    console.log(contentX);
    log.info("── End Preview ──────────────────────────────\n");
    log.info(`Title: ${record.title}`);
    log.info(`Summary: ${record.summary}`);
    log.info(`Highlights: ${editorialBrief.highlights.length}`);
    log.info(`Articles referenced: ${articleIds.length}`);
    log.info("[DRY RUN] No records written to database.");
  } else {
    // Upsert (idempotent on brief_date)
    const { error: upsertErr } = await supabase
      .from("daily_briefs")
      .upsert(record, { onConflict: "brief_date" });

    if (upsertErr) {
      log.error(`Upsert failed: ${upsertErr.message}`);
      process.exit(1);
    }

    log.success(`Upserted daily brief for ${dateLabel} as draft`);
  }

  log.done();
}

main().catch((e) => {
  log.error(e.message);
  process.exit(1);
});
