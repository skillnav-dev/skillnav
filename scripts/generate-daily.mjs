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
import { runPipeline } from "./lib/run-pipeline.mjs";
import { validateEnv } from "./lib/validate-env.mjs";
import { getProviderInfo } from "./lib/llm.mjs";
import { markdownToWechatHtml } from "./lib/publishers/wechat.mjs";
import { formatXThread, threadToText } from "./lib/publishers/twitter.mjs";
import { formatZhihuArticle } from "./lib/publishers/zhihu.mjs";
import { formatXhsCaption } from "./lib/publishers/xiaohongshu.mjs";
import fs from "fs";
import pathMod from "path";

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
  // Dedup: collect article IDs already used in recent briefs (past 3 days)
  const dedupSince = new Date(since);
  dedupSince.setDate(dedupSince.getDate() - 3);
  const { data: recentBriefs } = await supabase
    .from("daily_briefs")
    .select("article_ids")
    .gte("brief_date", formatDate(dedupSince))
    .lt("brief_date", formatDate(since));

  const usedArticleIds = new Set();
  for (const brief of recentBriefs || []) {
    for (const id of brief.article_ids || []) {
      usedArticleIds.add(id);
    }
  }
  if (usedArticleIds.size) {
    log.info(`Dedup: excluding ${usedArticleIds.size} articles from recent briefs`);
  }

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

  // Filter out already-used articles
  const filtered = (data || []).filter((a) => !usedArticleIds.has(a.id));
  if (data && filtered.length < data.length) {
    log.info(`Dedup: ${data.length} -> ${filtered.length} articles after filtering`);
  }
  return filtered;
}

// ── Newsletter Layer ──────────────────────────────────────────────

function loadNewsletters(dateLabel) {
  const dir = pathMod.join(process.cwd(), "data", "daily-newsletters");
  const filePath = pathMod.join(dir, `${dateLabel}.json`);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  }
  // Try previous day (newsletters scraped the evening before)
  const prev = new Date(dateLabel);
  prev.setDate(prev.getDate() - 1);
  const prevPath = pathMod.join(dir, `${formatDate(prev)}.json`);
  if (fs.existsSync(prevPath)) {
    return JSON.parse(fs.readFileSync(prevPath, "utf8"));
  }
  return null;
}

function formatNewsletterContext(newsletters) {
  if (!newsletters?.sources?.length) return "";
  const lines = [];
  for (const src of newsletters.sources) {
    lines.push(`\n### ${src.label} (${src.name})\n`);
    lines.push(src.text);
  }
  return lines.join("\n");
}

// ── HF Daily Papers ─────────────────────────────────────────────────

async function fetchHFDailyPapers(limit = 10) {
  try {
    const res = await fetch("https://huggingface.co/api/daily_papers");
    if (!res.ok) {
      log.warn(`HF Daily Papers API returned ${res.status}`);
      return [];
    }
    const data = await res.json();
    // Sort by upvotes descending, take top N
    return data
      .sort((a, b) => (b.paper?.upvotes || 0) - (a.paper?.upvotes || 0))
      .slice(0, limit)
      .map((item) => ({
        id: item.paper?.id,
        title: item.paper?.title,
        upvotes: item.paper?.upvotes || 0,
        org: item.paper?.organization?.fullname || "",
        url: `https://arxiv.org/abs/${item.paper?.id}`,
        ai_summary: item.paper?.ai_summary || "",
        ai_keywords: item.paper?.ai_keywords || [],
        githubRepo: item.paper?.githubRepo || "",
        githubStars: item.paper?.githubStars ?? null,
      }));
  } catch (e) {
    log.warn(`HF Daily Papers fetch failed: ${e.message}`);
    return [];
  }
}

function formatPapersContext(papers) {
  if (!papers.length) return "";
  return papers
    .map((p, i) => {
      const lines = [`${i + 1}. [${p.id}] ${p.title} (${p.org || "unknown org"}, ${p.upvotes} upvotes)`];
      lines.push(`   URL: ${p.url}`);
      if (p.ai_summary) lines.push(`   AI Summary: ${p.ai_summary}`);
      if (p.ai_keywords?.length) lines.push(`   Keywords: ${p.ai_keywords.join(", ")}`);
      if (p.githubRepo) lines.push(`   GitHub: ${p.githubRepo} (${p.githubStars ?? 0} stars)`);
      return lines.join("\n");
    })
    .join("\n\n");
}

// ── LLM Curation ───────────────────────────────────────────────────

async function generateEditorialBrief(articles, newsletterContext = "", papersContext = "") {
  const { callLLM } = await import("./lib/llm.mjs");

  const articleList = articles
    .map((a, i) => {
      const title = a.title_zh || a.title;
      const source = SOURCE_LABELS[a.source] || a.source;
      const summary = a.summary_zh || a.summary || "";
      const summaryLine = summary ? `\n   摘要: ${summary.slice(0, 150)}` : "";
      return `${i + 1}. [${a.slug}] ${title} (来源: ${source})${summaryLine}`;
    })
    .join("\n");

  const hasNewsletters = newsletterContext.length > 100;

  const systemPrompt = `You are the chief editor of SkillNav Daily Brief, a Chinese-language daily digest for AI developers.

## Your role
You have two inputs: (1) raw text from today's top AI newsletters, and (2) our article pool.
Your job: cross-reference the newsletters, identify the most important stories, and produce a brief with clear editorial hierarchy.

## Editorial funnel (strict rules)
- HEADLINE (0 or 1): A topic mentioned by 2+ newsletters, OR a genuine industry inflection point. Write "why it matters" with a specific impact statement. If nothing qualifies, set headline to null — do NOT force a headline.
- NOTEWORTHY (3-5): Topics worth a developer's attention. Each gets a one-line editorial comment that adds insight beyond the title.
- SKIP everything else. Most newsletter items are noise. Pushing less = brand trust.

## Cross-referencing
Read ALL newsletter texts carefully. When multiple newsletters cover the same topic (even with different wording), that's a strong signal. Prefer topics validated by 2+ sources.

## Linking to our articles
For each item, check if our article pool covers the topic. If yes, use the article's slug. If not, use slug "signal-{N}" (e.g., "signal-1") — we'll display these as text-only items.

## Writing rules
- All output in Chinese
- Hook: must contain a specific fact, number, or contrast — no vague statements
- whyItMatters: must name WHO benefits and HOW — no "this is important" filler
- comment: must add information not in the title — no title parroting
- Style: sharp tech lead briefing the team. Every word earns its place.

## Paper reading cards (3-5 from HuggingFace Daily Papers)
- Pick 3-5 papers most relevant to AI developer tools/practices from the provided HF papers list. Each paper has AI summary, keywords, and optionally GitHub repo — use ALL of these to write a richer reading card.
- Each paper gets a ~250-300 char reading card with THREE sections:
  1. **what** (做了什么): Problem, method, result in 2-3 sentences. Use specific numbers from the AI summary.
  2. **implication** (对你意味着什么): Can a developer USE this? Name specific tools/frameworks it relates to. Axe test: if swapping the paper title still makes this valid, it's filler — rewrite it.
  3. **trend** (趋势): One sentence placing this in a broader direction.
- **attitude** label (态度标签, MANDATORY, pick exactly one):
  - "可以用了" — has code + docs, ready to integrate
  - "有代码但离生产远" — open-sourced but needs significant adaptation
  - "纯学术" — no near-term application, but direction worth watching
  - "思路有启发" — weak experiments but good design idea
  Use GitHub repo presence + stars as a signal: repo with 100+ stars → likely "可以用了" or "有代码但离生产远". No repo → likely "纯学术" or "思路有启发".
- **title_zh**: Chinese title (concise, 15-25 chars, convey the core idea)
- If fewer than 3 papers are worth recommending, still pick 3 — the bar is "interesting to an AI developer", not "groundbreaking".
- NEVER fabricate paper IDs or URLs — only use papers from the provided list.

## Anti-patterns (NEVER write like this)
- "这标志着AI发展的重要里程碑" ← empty
- "值得关注" / "不可忽视" / "意义重大" ← filler
- comment that restates the title ← useless`;

  const hasPapers = papersContext.length > 0;

  const userPrompt = `${hasNewsletters ? `## Today's AI newsletters (raw text from ${articles.length > 0 ? "multiple" : "5"} sources)\n${newsletterContext}\n` : ""}
## Our article pool (${articles.length} articles)

${articleList}
${hasPapers ? `\n## HuggingFace Daily Papers (Top 10 by upvotes)\n\n${papersContext}\n` : ""}
## Output format

Return a JSON object:
{
  "title": "10-20 chars, today's theme",
  "hook": "15-30 chars, specific fact/number/contrast",
  "headline": ${hasNewsletters ? `{
    "slug": "article-slug or signal-1",
    "title": "topic title in Chinese",
    "summary": "2-3 sentences, 60-100 chars, with specific details",
    "whyItMatters": "20-40 chars, specific impact: who benefits, what changes",
    "sources": ["newsletter names that covered this"]
  } OR null if nothing qualifies` : `{
    "slug": "article-slug",
    "title": "topic title in Chinese",
    "summary": "2-3 sentences with specific details",
    "whyItMatters": "specific impact statement"
  }`},
  "noteworthy": [
    {
      "slug": "article-slug or signal-N",
      "title": "topic title in Chinese",
      "comment": "editorial insight not in the title, 15-30 chars"
    }
  ],
  "papers": [
    {
      "id": "arXiv paper ID from the HF list",
      "title_zh": "Chinese title, 15-25 chars",
      "org": "institution tag",
      "attitude": "可以用了 | 有代码但离生产远 | 纯学术 | 思路有启发",
      "what": "做了什么: 2-3 sentences, specific numbers",
      "implication": "对你意味着什么: name tools/frameworks, actionable",
      "trend": "趋势: one sentence, broader direction",
      "github_url": "GitHub repo URL if available, or null",
      "url": "arXiv URL from the HF list"
    }
  ]
}

Rules:
- noteworthy: 3-5 items max
- papers: 3-5 items. Use EXACT id and url from the HF list. Each paper MUST have attitude label.
- Each slug appears only once
- For our articles, use the exact slug from the list above
- For topics not in our pool, use "signal-1", "signal-2", etc. and provide the title
- Return ONLY valid JSON, no markdown fences`;

  const raw = await callLLM(systemPrompt, userPrompt, 2048);
  const jsonStr = raw.replace(/^```(?:json)?\s*/m, "").replace(/```\s*$/m, "").trim();
  const plan = JSON.parse(jsonStr);

  if (!plan.title || !plan.hook) {
    throw new Error("LLM returned invalid brief structure");
  }

  // Normalize
  plan.title = String(plan.title).slice(0, 100);
  plan.hook = String(plan.hook).slice(0, 200);
  plan.noteworthy = Array.isArray(plan.noteworthy) ? plan.noteworthy : [];

  // Normalize papers
  const VALID_ATTITUDES = ["可以用了", "有代码但离生产远", "纯学术", "思路有启发"];
  plan.papers = Array.isArray(plan.papers) ? plan.papers.slice(0, 5) : [];
  for (const p of plan.papers) {
    p.title_zh = String(p.title_zh || "").slice(0, 80);
    p.org = String(p.org || "");
    p.what = String(p.what || "").slice(0, 300);
    p.implication = String(p.implication || "").slice(0, 300);
    p.trend = String(p.trend || "").slice(0, 200);
    p.github_url = p.github_url || null;
    if (!VALID_ATTITUDES.includes(p.attitude)) p.attitude = "纯学术";
  }
  // Drop papers with missing id, url, or empty content
  plan.papers = plan.papers.filter((p) => p.id && p.url && p.what);

  // Enforce length limits
  if (plan.headline) {
    plan.headline.summary = String(plan.headline.summary || "").slice(0, 500);
    plan.headline.whyItMatters = String(plan.headline.whyItMatters || "").slice(0, 200);
    plan.headline.title = String(plan.headline.title || "").slice(0, 100);
  }
  for (const n of plan.noteworthy) {
    n.comment = String(n.comment || "").slice(0, 200);
    n.title = String(n.title || "").slice(0, 100);
  }

  // Validate slugs: article slugs must exist, signal-N slugs are allowed
  const validSlugs = new Set(articles.map((a) => a.slug));
  const usedSlugs = new Set();

  if (plan.headline) {
    const slug = plan.headline.slug;
    if (slug && !slug.startsWith("signal-") && !validSlugs.has(slug)) {
      plan.headline = null; // invalid slug, drop headline
    } else if (slug) {
      usedSlugs.add(slug);
    }
  }

  plan.noteworthy = plan.noteworthy.filter((n) => {
    const slug = n.slug;
    if (!slug || usedSlugs.has(slug)) return false;
    if (!slug.startsWith("signal-") && !validSlugs.has(slug)) return false;
    usedSlugs.add(slug);
    return true;
  });

  // Build backward-compat structures for downstream consumers
  plan.headlines = plan.headline ? [plan.headline] : [];
  plan.tools = [];
  plan.quickLinks = plan.noteworthy.map((n) => ({
    slug: n.slug,
    oneLiner: n.comment,
  }));
  plan.highlights = [
    ...(plan.headline ? [{ slug: plan.headline.slug, oneLiner: plan.headline.whyItMatters || plan.headline.summary }] : []),
    ...plan.noteworthy.map((n) => ({ slug: n.slug, oneLiner: n.comment })),
  ];

  return plan;
}

function fallbackBrief(articles) {
  const items = articles.slice(0, 6);
  const headline = items[0];
  const rest = items.slice(1);

  const brief = {
    title: `AI 日报：${items.length} 条值得关注的动态`,
    hook: `今日 ${items.length} 条 AI 动态速览。`,
    headline: headline
      ? {
          slug: headline.slug,
          title: headline.title_zh || headline.title,
          summary: headline.summary_zh?.slice(0, 100) || headline.title_zh || headline.title,
          whyItMatters: "",
        }
      : null,
    noteworthy: rest.map((a) => ({
      slug: a.slug,
      title: a.title_zh || a.title,
      comment: a.summary_zh?.slice(0, 40) || a.title_zh || a.title,
    })),
  };

  // Backward compat
  brief.headlines = brief.headline ? [brief.headline] : [];
  brief.tools = [];
  brief.papers = [];
  brief.quickLinks = brief.noteworthy.map((n) => ({ slug: n.slug, oneLiner: n.comment }));
  brief.highlights = [
    ...(brief.headline ? [{ slug: brief.headline.slug, oneLiner: brief.headline.summary }] : []),
    ...brief.noteworthy.map((n) => ({ slug: n.slug, oneLiner: n.comment })),
  ];

  return brief;
}

// ── Markdown Assembly ───────────────────────────────────────────────

function assembleMarkdown(editorialBrief, articles, briefDate) {
  const articleMap = new Map(articles.map((a) => [a.slug, a]));
  const lines = [];

  // Hook
  lines.push(`> ${editorialBrief.hook}`);
  lines.push("");

  // Headline (0 or 1)
  const hl = editorialBrief.headline;
  if (hl) {
    const article = articleMap.get(hl.slug);
    const title = article ? (article.title_zh || article.title) : hl.title;
    const source = article ? (SOURCE_LABELS[article.source] || article.source) : (hl.sources?.join(", ") || "");

    lines.push("## 📌 今日头条");
    lines.push("");
    if (article) {
      lines.push(`### [${title}](/articles/${article.slug})`);
    } else {
      lines.push(`### ${title}`);
    }
    if (source) lines.push(`*${source}*`);
    lines.push("");
    lines.push(hl.summary);
    if (hl.whyItMatters) {
      lines.push("");
      lines.push(`**为什么重要：** ${hl.whyItMatters}`);
    }
    lines.push("");
  }

  // Noteworthy (3-5)
  if (editorialBrief.noteworthy?.length) {
    lines.push("## 📋 值得关注");
    lines.push("");

    for (const item of editorialBrief.noteworthy) {
      const article = articleMap.get(item.slug);
      const title = article ? (article.title_zh || article.title) : item.title;
      if (article) {
        lines.push(`- [${title}](/articles/${article.slug}) — ${item.comment}`);
      } else {
        lines.push(`- ${title} — ${item.comment}`);
      }
    }
    lines.push("");
  }

  // Paper reading cards (3-5)
  if (editorialBrief.papers?.length) {
    lines.push("## 📄 论文速递");
    lines.push("");

    for (const paper of editorialBrief.papers) {
      const orgTag = paper.org ? ` · ${paper.org}` : "";
      const trackedUrl = `https://skillnav.dev/go/paper/${paper.id}`;
      const githubLink = paper.github_url ? ` · [GitHub](${paper.github_url})` : "";

      lines.push(`### ${paper.title_zh}`);
      lines.push(`> ${orgTag ? paper.org : ""}${orgTag ? " · " : ""}${paper.attitude}${githubLink ? " · 代码已开源" : ""}`);
      lines.push("");
      lines.push(`**做了什么**：${paper.what}`);
      lines.push("");
      lines.push(`**对你意味着什么** | ${paper.attitude}`);
      lines.push(paper.implication);
      lines.push("");
      lines.push(`**趋势**：${paper.trend}`);
      lines.push("");
      lines.push(`→ [arXiv](${trackedUrl})${githubLink}`);
      lines.push("");
    }
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

  // Determine date range (use CST = UTC+8, so CI running at UTC 22:30 gets next CST day)
  function todayCST() {
    const now = new Date();
    const cst = new Date(now.getTime() + 8 * 3600 * 1000);
    return new Date(cst.toISOString().slice(0, 10));
  }
  const briefDate = dateStr ? new Date(dateStr) : todayCST();
  const until = new Date(briefDate);
  until.setHours(23, 59, 59, 999);
  const since = new Date(until);
  since.setHours(since.getHours() - lookbackHours);

  // Daily brief is a lightweight task — use a fast provider instead of GPT-5.4
  if (!process.env.LLM_PROVIDER) {
    process.env.LLM_PROVIDER = "deepseek";
  }

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
        return {
          status: "skipped",
          summary: { date: dateLabel, reason: "already_exists" },
          exitCode: 0,
        };
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
    return {
      status: "skipped",
      summary: { date: dateLabel, articles: 0, reason: "no_articles" },
      exitCode: 0,
    };
  }

  log.info(`Found ${articles.length} articles`);

  // Load newsletter data
  const newsletters = loadNewsletters(dateLabel);
  const newsletterContext = formatNewsletterContext(newsletters);
  if (newsletters) {
    log.info(`Newsletters: ${newsletters.sources.length} sources loaded (${newsletterContext.length} chars)`);
  } else {
    log.info("Newsletters: no data available, using articles only");
  }

  // Fetch HF Daily Papers
  const hfPapers = await fetchHFDailyPapers(10);
  const papersContext = formatPapersContext(hfPapers);
  if (hfPapers.length) {
    log.info(`HF Papers: ${hfPapers.length} papers fetched (top upvotes: ${hfPapers[0]?.upvotes})`);
  } else {
    log.info("HF Papers: no data available");
  }

  // Generate editorial brief
  let editorialBrief;
  if (noLlm) {
    editorialBrief = fallbackBrief(articles);
    log.info("Using fallback brief (--no-llm)");
  } else {
    log.info("Generating editorial brief via LLM...");
    try {
      editorialBrief = await generateEditorialBrief(articles, newsletterContext, papersContext);
      const paperCount = editorialBrief.papers?.length || 0;
      log.success(`Brief: "${editorialBrief.title}" with ${editorialBrief.highlights.length} highlights, ${paperCount} papers`);
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

  // Generate Zhihu article
  const contentZhihu = formatZhihuArticle(contentMd, {
    title: editorialBrief.title,
    date: formatDateChinese(briefDate),
    articleCount: editorialBrief.highlights.length,
  });

  // Generate Xiaohongshu caption (pass structured sections)
  const hl = editorialBrief.headline;
  const xhsSections = {
    headlines: hl
      ? [
          {
            title: articles.find((a) => a.slug === hl.slug)?.title_zh || hl.title || hl.slug,
            summary: hl.summary || "",
            whyItMatters: hl.whyItMatters || "",
          },
        ]
      : [],
    tools: [],
    quickLinks: (editorialBrief.noteworthy || []).map((n) => {
      const article = articles.find((a) => a.slug === n.slug);
      return {
        title: article?.title_zh || article?.title || n.title || n.slug,
        oneLiner: n.comment,
      };
    }),
  };
  const totalCount = xhsSections.headlines.length + xhsSections.quickLinks.length;
  const contentXhs = formatXhsCaption(xhsSections, {
    title: editorialBrief.title,
    date: formatDateChinese(briefDate),
    totalCount,
  });

  // Collect article IDs
  const articleIds = editorialBrief.highlights
    .map((h) => articles.find((a) => a.slug === h.slug)?.id)
    .filter(Boolean);

  // Build DB record
  const record = {
    brief_date: dateLabel,
    title: editorialBrief.title,
    summary: editorialBrief.hook,
    content_md: contentMd,
    content_wechat: contentWechat,
    content_x: contentX,
    content_zhihu: contentZhihu,
    content_xhs: contentXhs,
    article_ids: articleIds,
    status: "draft",
  };

  if (dryRun) {
    log.info("\n── Markdown Preview ─────────────────────────");
    console.log(contentMd);
    log.info("\n── X Thread Preview ─────────────────────────");
    console.log(contentX);
    log.info("\n── Xiaohongshu Preview ──────────────────────");
    console.log(contentXhs);
    log.info("\n── Zhihu Preview (first 20 lines) ───────────");
    console.log(contentZhihu.split("\n").slice(0, 20).join("\n"));
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
      return {
        status: "failure",
        summary: { date: dateLabel },
        errorMsg: upsertErr.message,
        exitCode: 1,
      };
    }

    log.success(`Upserted daily brief for ${dateLabel} as draft`);
  }

  return {
    status: "success",
    summary: {
      date: dateLabel,
      articles: articles.length,
      highlights: editorialBrief.highlights.length,
    },
    exitCode: 0,
  };
}

runPipeline(main, { logger: log, defaultPipeline: "generate-daily" });
