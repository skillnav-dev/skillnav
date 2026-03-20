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
import { formatZhihuArticle } from "./lib/publishers/zhihu.mjs";
import { formatXhsCaption } from "./lib/publishers/xiaohongshu.mjs";

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
    .map((a, i) => {
      const title = a.title_zh || a.title;
      const source = SOURCE_LABELS[a.source] || a.source;
      const summary = a.summary_zh || a.summary || "";
      // Give LLM enough context to make editorial judgment
      const summaryLine = summary ? `\n   摘要: ${summary.slice(0, 150)}` : "";
      return `${i + 1}. [${a.slug}] ${title} (来源: ${source})${summaryLine}`;
    })
    .join("\n");

  const systemPrompt = `You are the editor of SkillNav Daily Brief, a Chinese-language daily digest of AI agent tools and developer ecosystem news.
Your style: concise, opinionated, no fluff. Like a sharp tech lead briefing the team — every sentence earns its place.
Key principle: don't just report WHAT happened, explain WHY IT MATTERS to developers.

## Anti-patterns (DO NOT write like this)
- hook: "AI智能体不再只是写代码，而是成为可部署、可协作的工程系统" ← 太泛，谁都能说
- whyItMatters: "这是关键一步" / "不可替代" / "值得关注" ← 万能套话，没有信息量
- quickLinks: 复读标题 ← 必须补一个标题里没有的新信息点

## Good examples
- hook: "当教授开始把推导交给 Agent，你的工作流还停留在手写 CRUD？"
- whyItMatters: "推理成本降至 GPT-4 的 1/50，Agent 批量调用从烧钱变成零钱"
- quickLinks: "10 倍效率但 AI 会伪造图表" (not just "哈佛教授用 Claude Code 做物理")`;

  const maxArticles = Math.min(articles.length, 10);

  // Adaptive section sizing
  let headlineCount, toolCount, quickLinkCount;
  if (maxArticles <= 3) {
    headlineCount = maxArticles;
    toolCount = 0;
    quickLinkCount = 0;
  } else if (maxArticles <= 6) {
    headlineCount = 1;
    toolCount = Math.min(maxArticles - 1, 3);
    quickLinkCount = maxArticles - 1 - toolCount;
  } else {
    headlineCount = 2;
    toolCount = Math.min(4, Math.ceil((maxArticles - 2) / 2));
    quickLinkCount = maxArticles - 2 - toolCount;
  }

  const userPrompt = `Generate a structured daily brief from these ${articles.length} articles:

${articleList}

Return a JSON object with THREE sections:
{
  "title": "今日标题（中文，10-20字，概括今天最重要的主题）",
  "hook": "一句金句引题（中文，15-30字）— 必须包含一个具体事实、数字或对比，不要写正确但空洞的概括",
  "headlines": [
    {
      "slug": "article-slug",
      "summary": "2-3句事实摘要（中文，60-100字）— 包含关键数字和具体细节，不要泛泛而谈",
      "whyItMatters": "一句话点评（中文，20-40字）— 必须说出具体影响：谁受益、省多少、改变什么流程"
    }
  ],
  "tools": [
    { "slug": "article-slug", "oneLiner": "一句话概括（中文，20-40字）— 说清楚这个工具解决什么痛点" }
  ],
  "quickLinks": [
    { "slug": "article-slug", "oneLiner": "补充信息点（中文，10-25字）— 必须包含标题里没有的新信息，不要复读标题" }
  ]
}

Rules:
- Pick top ${maxArticles} articles, distribute: headlines ${headlineCount}, tools ~${toolCount}, quickLinks ~${quickLinkCount}
- Each article only appears in ONE section, no duplicates
- Use article slugs from the list above
- Read the 摘要 carefully — your editorial judgment depends on understanding the actual content
- Return ONLY valid JSON, no markdown fences`;

  const raw = await callLLM(systemPrompt, userPrompt, 2048);
  const jsonStr = raw.replace(/^```(?:json)?\s*/m, "").replace(/```\s*$/m, "").trim();
  const plan = JSON.parse(jsonStr);

  if (!plan.title || !plan.hook || !Array.isArray(plan.headlines)) {
    throw new Error("LLM returned invalid brief structure");
  }

  // Ensure arrays exist
  plan.tools = plan.tools || [];
  plan.quickLinks = plan.quickLinks || [];

  // Enforce length limits on LLM output
  plan.title = String(plan.title).slice(0, 100);
  plan.hook = String(plan.hook).slice(0, 200);
  for (const h of plan.headlines) {
    if (h.summary) h.summary = String(h.summary).slice(0, 500);
    if (h.whyItMatters) h.whyItMatters = String(h.whyItMatters).slice(0, 200);
  }
  for (const t of plan.tools) {
    if (t.oneLiner) t.oneLiner = String(t.oneLiner).slice(0, 200);
  }
  for (const q of plan.quickLinks) {
    if (q.oneLiner) q.oneLiner = String(q.oneLiner).slice(0, 200);
  }

  // Validate slugs exist and deduplicate across sections
  const validSlugs = new Set(articles.map((a) => a.slug));
  const usedSlugs = new Set();

  plan.headlines = plan.headlines.filter((h) => {
    if (!validSlugs.has(h.slug) || usedSlugs.has(h.slug)) return false;
    usedSlugs.add(h.slug);
    return true;
  });
  plan.tools = plan.tools.filter((t) => {
    if (!validSlugs.has(t.slug) || usedSlugs.has(t.slug)) return false;
    usedSlugs.add(t.slug);
    return true;
  });
  plan.quickLinks = plan.quickLinks.filter((q) => {
    if (!validSlugs.has(q.slug) || usedSlugs.has(q.slug)) return false;
    usedSlugs.add(q.slug);
    return true;
  });

  // Backward compat: assemble highlights for downstream consumers (X thread, XHS, etc.)
  plan.highlights = [
    ...plan.headlines.map((h) => ({ slug: h.slug, oneLiner: h.whyItMatters || h.summary })),
    ...plan.tools.map((t) => ({ slug: t.slug, oneLiner: t.oneLiner })),
    ...plan.quickLinks.map((q) => ({ slug: q.slug, oneLiner: q.oneLiner })),
  ];

  return plan;
}

function fallbackBrief(articles) {
  const total = Math.min(articles.length, 10);
  const items = articles.slice(0, total);
  const headlines = items.slice(0, 2);
  const tools = items.slice(2, 6);
  const quickLinks = items.slice(6);

  const brief = {
    title: `AI 日报：${total} 条值得关注的动态`,
    hook: `今日 ${total} 条 AI 动态速览。`,
    headlines: headlines.map((a) => ({
      slug: a.slug,
      summary: a.summary_zh?.slice(0, 100) || a.title_zh || a.title,
      whyItMatters: "",
    })),
    tools: tools.map((a) => ({
      slug: a.slug,
      oneLiner: a.summary_zh?.slice(0, 40) || a.title_zh || a.title,
    })),
    quickLinks: quickLinks.map((a) => ({
      slug: a.slug,
      oneLiner: a.summary_zh?.slice(0, 20) || a.title_zh || a.title,
    })),
  };

  // Backward compat
  brief.highlights = [
    ...brief.headlines.map((h) => ({ slug: h.slug, oneLiner: h.summary })),
    ...brief.tools.map((t) => ({ slug: t.slug, oneLiner: t.oneLiner })),
    ...brief.quickLinks.map((q) => ({ slug: q.slug, oneLiner: q.oneLiner })),
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

  // Headlines
  if (editorialBrief.headlines?.length) {
    lines.push("## 🚀 头条");
    lines.push("");

    for (const headline of editorialBrief.headlines) {
      const article = articleMap.get(headline.slug);
      if (!article) continue;

      const title = article.title_zh || article.title;
      const source = SOURCE_LABELS[article.source] || article.source;

      lines.push(`### [${title}](/articles/${article.slug})`);
      lines.push(`*${source}*`);
      lines.push("");
      lines.push(headline.summary);
      if (headline.whyItMatters) {
        lines.push("");
        lines.push(`**为什么重要：** ${headline.whyItMatters}`);
      }
      lines.push("");
    }
  }

  // Tools & Releases
  if (editorialBrief.tools?.length) {
    lines.push("## 🛠️ 工具与发布");
    lines.push("");

    for (const tool of editorialBrief.tools) {
      const article = articleMap.get(tool.slug);
      if (!article) continue;

      const title = article.title_zh || article.title;
      lines.push(`- [${title}](/articles/${article.slug}) — ${tool.oneLiner}`);
    }
    lines.push("");
  }

  // Quick Links
  if (editorialBrief.quickLinks?.length) {
    lines.push("## ⚡ 快讯");
    lines.push("");

    for (const link of editorialBrief.quickLinks) {
      const article = articleMap.get(link.slug);
      if (!article) continue;

      const title = article.title_zh || article.title;
      lines.push(`- [${title}](/articles/${article.slug}) — ${link.oneLiner}`);
    }
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

  // Generate Zhihu article
  const contentZhihu = formatZhihuArticle(contentMd, {
    title: editorialBrief.title,
    date: formatDateChinese(briefDate),
    articleCount: editorialBrief.highlights.length,
  });

  // Generate Xiaohongshu caption (pass structured sections)
  const xhsSections = {
    headlines: (editorialBrief.headlines || []).map((h) => {
      const article = articles.find((a) => a.slug === h.slug);
      return {
        title: article?.title_zh || article?.title || h.slug,
        summary: h.summary || "",
        whyItMatters: h.whyItMatters || "",
      };
    }),
    tools: (editorialBrief.tools || []).map((t) => {
      const article = articles.find((a) => a.slug === t.slug);
      return {
        title: article?.title_zh || article?.title || t.slug,
        oneLiner: t.oneLiner,
      };
    }),
    quickLinks: (editorialBrief.quickLinks || []).map((q) => {
      const article = articles.find((a) => a.slug === q.slug);
      return {
        title: article?.title_zh || article?.title || q.slug,
        oneLiner: q.oneLiner,
      };
    }),
  };
  const totalCount = xhsSections.headlines.length + xhsSections.tools.length + xhsSections.quickLinks.length;
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
