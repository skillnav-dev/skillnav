#!/usr/bin/env node

/**
 * Sync articles from RSS feeds to Supabase.
 * Fetches RSS → extracts full content → translates via LLM → upserts to DB.
 *
 * Usage:
 *   node scripts/sync-articles.mjs                           # Full sync (all sources)
 *   node scripts/sync-articles.mjs --dry-run                  # Preview only
 *   node scripts/sync-articles.mjs --limit 5                  # Limit items per source
 *   node scripts/sync-articles.mjs --source anthropic         # Single source only
 *   node scripts/sync-articles.mjs --retranslate-truncated    # Re-translate truncated articles
 *   node scripts/sync-articles.mjs --retranslate-drafts       # Re-compile all draft articles with upgraded prompt
 *
 * NOTE: The `articles.source_url` column must have a UNIQUE constraint
 *       for the upsert (onConflict: "source_url") to work correctly.
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import RssParser from "rss-parser";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import TurndownService from "turndown";
import { createAdminClient } from "./lib/supabase-admin.mjs";
import { createLogger } from "./lib/logger.mjs";
import { runPipeline } from "./lib/run-pipeline.mjs";
import { translateArticle, getProviderInfo } from "./lib/llm.mjs";
import { scoreArticle } from "./lib/quality.mjs";
import { withRetry } from "./lib/retry.mjs";
import { validateEnv } from "./lib/validate-env.mjs";

const log = createLogger("articles");

// ── RSS Sources ──────────────────────────────────────────────────────
// Relevance keywords for general sources
const RELEVANCE_KEYWORDS = [
  "claude", "anthropic", "mcp", "skill", "agent", "agentic",
  "tool-use", "function-calling",
  "computer-use", "model-context", "rag", "embedding",
  "cursor", "copilot", "codex", "gemini", "openai",
  "a2a", "agent-to-agent", "multi-agent", "crewai", "autogen",
  "langchain", "langgraph",
  "claude-code", "ai-coding", "ai-programming", "vibe-coding",
  "agentic-engineering", "model-context-protocol", "code-execution",
  "smolagents", "openai-agents-sdk", "claude-md", "context-engineering",
  "gen ai", "generative ai", "llm", "large language model", "foundation model",
  "chatgpt", "deepseek", "perplexity", "midjourney", "sora",
];

const SOURCES = [
  {
    name: "anthropic",
    label: "Anthropic News",
    type: "sanity", // Direct Sanity CMS API (293+ posts vs 13 in third-party RSS)
    sanityProjectId: "4zrzovbb",
    sanityDataset: "website",
    defaultType: "analysis",
    relevanceFilter: [
      // Product & technical (core)
      "claude", "sonnet", "opus", "haiku", "agent", "mcp", "skill",
      "code", "sdk", "api", "model", "tool", "computer-use", "prompt",
      // Research & safety
      "safety", "alignment", "research", "benchmark", "eval",
      "vulnerability", "jailbreak", "red-team", "scaling",
      "distill", "蒸馏", "autonomy", "自主性",
      "science", "科学", "研究所",
      // Developer ecosystem
      "developer", "partner", "integration",
    ],
  },
  {
    name: "openai",
    label: "OpenAI Blog",
    feedUrl: "https://openai.com/news/rss.xml",
    defaultType: "analysis",
    relevanceFilter: RELEVANCE_KEYWORDS,
  },
  {
    name: "langchain",
    label: "LangChain Blog",
    feedUrl: "https://blog.langchain.dev/rss/",
    defaultType: "tutorial",
    relevanceFilter: RELEVANCE_KEYWORDS,
  },
  {
    name: "simonw",
    label: "Simon Willison's Weblog",
    feedUrl: "https://simonwillison.net/atom/everything/",
    defaultType: "analysis",
    relevanceFilter: RELEVANCE_KEYWORDS,
  },
  {
    name: "github",
    label: "GitHub Blog",
    feedUrl: "https://github.blog/feed/",
    defaultType: "analysis",
    relevanceFilter: RELEVANCE_KEYWORDS,
  },
  {
    name: "huggingface",
    label: "Hugging Face Blog",
    feedUrl: "https://huggingface.co/blog/feed.xml",
    defaultType: "tutorial",
    relevanceFilter: RELEVANCE_KEYWORDS,
  },
  {
    name: "crewai",
    label: "CrewAI Blog",
    feedUrl: "https://blog.crewai.com/rss/",
    defaultType: "tutorial",
    relevanceFilter: null, // Accept all — Agent framework is core topic
  },
  {
    name: "latent-space",
    label: "Latent Space",
    feedUrl: "https://www.latent.space/feed",
    defaultType: "analysis",
    relevanceFilter: RELEVANCE_KEYWORDS, // Filter out AI News daily roundups
  },
  {
    name: "ai-coding-daily",
    label: "AI Coding Daily",
    feedUrl: "https://aicodingdaily.substack.com/feed",
    defaultType: "tutorial",
    relevanceFilter: null, // Accept all — core topic
  },
  // NOTE: PulseMCP (pulsemcp.com) has no RSS feed available
  {
    name: "thenewstack",
    label: "The New Stack",
    feedUrl: "https://thenewstack.io/feed/",
    defaultType: "analysis",
    relevanceFilter: RELEVANCE_KEYWORDS,
  },
  {
    name: "google-ai",
    label: "Google AI Blog",
    feedUrl: "https://blog.google/technology/ai/rss/",
    defaultType: "analysis",
    relevanceFilter: RELEVANCE_KEYWORDS,
  },
  {
    name: "together-ai",
    label: "Together AI",
    feedUrl: "https://www.together.ai/blog/rss.xml",
    defaultType: "analysis",
    relevanceFilter: RELEVANCE_KEYWORDS,
  },
  {
    name: "lobsters",
    label: "Lobsters AI",
    feedUrl: "https://lobste.rs/t/ai.rss",
    defaultType: "analysis",
    relevanceFilter: RELEVANCE_KEYWORDS,
  },
  {
    name: "cloudflare",
    label: "Cloudflare Blog",
    feedUrl: "https://blog.cloudflare.com/rss/",
    defaultType: "analysis",
    relevanceFilter: RELEVANCE_KEYWORDS,
  },
  {
    name: "a16z",
    label: "a16z News",
    feedUrl: "https://www.a16z.news/feed",
    defaultType: "analysis",
    relevanceFilter: RELEVANCE_KEYWORDS,
  },
];

/**
 * Check if an RSS item is relevant to our site's focus.
 * Returns true if no filter is set (e.g. Anthropic) or if title/snippet
 * contains at least one relevance keyword.
 */
function isRelevant(item, source) {
  if (!source.relevanceFilter) return true;
  const text = `${item.title || ""} ${item.contentSnippet || ""}`.toLowerCase();
  return source.relevanceFilter.some((kw) => text.includes(kw));
}

// ── Helpers ──────────────────────────────────────────────────────────
const rssParser = new RssParser();
const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Simple rate limiter: ensures minimum interval between calls.
 * Accounts for time already spent (e.g. in the LLM call itself).
 */
function createRateLimiter(maxPerMinute) {
  const minInterval = 60_000 / maxPerMinute;
  let lastCallTime = 0;
  return async function throttle() {
    const elapsed = Date.now() - lastCallTime;
    if (lastCallTime && elapsed < minInterval) {
      await delay(minInterval - elapsed);
    }
    lastCallTime = Date.now();
  };
}

const llmThrottle = createRateLimiter(10); // 10 req/min max

/**
 * Fetch recent posts from Anthropic's Sanity CMS API.
 * Returns items in the same shape as RSS parser output.
 */
async function fetchAnthropicFromSanity(source, maxItems = 50) {
  const query = encodeURIComponent(
    `*[_type=="post"] | order(_createdAt desc) [0..${maxItems - 1}] { title, slug, _createdAt }`
  );
  const url = `https://${source.sanityProjectId}.api.sanity.io/v2021-10-21/data/query/${source.sanityDataset}?query=${query}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "SkillNav-Bot/1.0 (+https://skillnav.dev)" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Sanity API ${res.status}: ${res.statusText}`);
  const data = await res.json();
  return (data.result || []).map((post) => ({
    title: post.title,
    link: `https://www.anthropic.com/news/${post.slug?.current || post.slug}`,
    pubDate: post._createdAt,
    contentSnippet: "",
  }));
}

/**
 * Extract cover image from HTML document.
 * Priority: og:image → twitter:image → first wide image in article/main.
 */
function extractCoverImage(doc, baseUrl) {
  // og:image
  const ogImage = doc.querySelector('meta[property="og:image"]');
  if (ogImage?.content) return resolveUrl(ogImage.content, baseUrl);

  // twitter:image
  const twImage = doc.querySelector('meta[name="twitter:image"]');
  if (twImage?.content) return resolveUrl(twImage.content, baseUrl);

  // First image in article/main content
  const container = doc.querySelector("article") || doc.querySelector("main") || doc.body;
  if (container) {
    const imgs = container.querySelectorAll("img[src]");
    for (const img of imgs) {
      const w = parseInt(img.getAttribute("width") || "0", 10);
      // Accept if width >= 400 or no width attribute (likely a content image)
      if (w >= 400 || !img.getAttribute("width")) {
        const src = img.getAttribute("src");
        if (src && !src.includes("avatar") && !src.includes("icon") && !src.includes("logo")) {
          return resolveUrl(src, baseUrl);
        }
      }
    }
  }
  return null;
}

function resolveUrl(url, baseUrl) {
  try {
    return new URL(url, baseUrl).href;
  } catch {
    return url;
  }
}

/**
 * Extract full article content from a URL using Readability + Turndown.
 * Returns Markdown content, excerpt, and cover image, or null on failure.
 */
async function extractContent(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "SkillNav-Bot/1.0 (+https://skillnav.dev)" },
    signal: AbortSignal.timeout(15000),
  });
  const html = await res.text();
  const dom = new JSDOM(html, { url });
  const doc = dom.window.document;

  // Extract cover image before Readability modifies the DOM
  const coverImage = extractCoverImage(doc, url);

  const reader = new Readability(doc);
  const article = reader.parse();
  if (!article) return null;
  return {
    content: turndown.turndown(article.content),
    excerpt: article.excerpt,
    coverImage,
  };
}

/**
 * Convert raw HTML string to Markdown (fallback when Readability fails).
 */
function htmlToMarkdown(html) {
  if (!html) return "";
  try {
    return turndown.turndown(html);
  } catch {
    // If turndown fails, strip tags as last resort
    return html.replace(/<[^>]+>/g, "").trim();
  }
}

// ── Main pipeline ────────────────────────────────────────────────────
async function main() {
  // Parse CLI args (same pattern as sync-clawhub.mjs)
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const retranslateTruncated = args.includes("--retranslate-truncated");
  const retranslateDrafts = args.includes("--retranslate-drafts");
  const retranslatePublished = args.includes("--retranslate-published");
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx !== -1 ? Number(args[limitIdx + 1]) : Infinity;
  const sourceIdx = args.indexOf("--source");
  const sourceFilter = sourceIdx !== -1 ? args[sourceIdx + 1] : null;

  if (!dryRun) {
    validateEnv(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
    const { name, model } = getProviderInfo();
    log.info(`LLM provider: ${name} (${model})`);
  }

  let supabase;
  if (!dryRun) {
    supabase = createAdminClient();
  }

  // Filter sources if --source flag is provided
  const sources = sourceFilter
    ? SOURCES.filter((s) => s.name === sourceFilter)
    : SOURCES;

  if (sources.length === 0) {
    log.error(`Unknown source: "${sourceFilter}". Available: ${SOURCES.map((s) => s.name).join(", ")}`);
    return { status: "failure", summary: {}, errorMsg: `Unknown source: "${sourceFilter}"`, exitCode: 1 };
  }

  // ── Retranslate truncated articles mode ───────────────────────────
  if (retranslateTruncated) {
    validateEnv(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
    const { name, model } = getProviderInfo();
    log.info(`LLM provider: ${name} (${model})`);
    const sb = createAdminClient();

    // Find articles with truncation markers in content_zh
    const { data: truncated, error: queryErr } = await sb
      .from("articles")
      .select("id, slug, title, summary, content, content_zh")
      .or("content_zh.ilike.%truncated%,content_zh.ilike.%截断%,content_zh.ilike.%content truncated%")
      .order("published_at", { ascending: false });

    if (queryErr) {
      log.error(`Query failed: ${queryErr.message}`);
      return { pipeline: "sync-articles:retranslate", status: "failure", summary: { mode: "retranslate-truncated" }, errorMsg: queryErr.message, exitCode: 1 };
    }

    // Filter to articles that actually have English content to retranslate
    const candidates = (truncated || []).filter((a) => a.content && a.content.length > 100);
    log.info(`Found ${candidates.length} truncated articles to retranslate`);

    if (candidates.length === 0) {
      log.success("No truncated articles found. All good!");
      log.done();
      return;
    }

    let retranslated = 0;
    let failed = 0;

    for (let i = 0; i < candidates.length; i++) {
      const article = candidates[i];
      const label = (article.title || article.slug).slice(0, 60);
      const strategy = article.content.length > 50000 ? "summarize"
        : article.content.length > 15000 ? "chunked" : "single";

      if (dryRun) {
        log.info(`[DRY RUN] Would retranslate (${strategy}, ${Math.round(article.content.length / 1000)}K): ${label}`);
        retranslated++;
      } else {
        try {
          await llmThrottle();
          log.info(`Retranslating (${strategy}, ${Math.round(article.content.length / 1000)}K): ${label}`);
          const result = await withRetry(
            () => translateArticle({
              title: article.title || "",
              summary: article.summary || "",
              content: article.content,
            }),
            { label }
          );

          const { error: updateErr } = await sb
            .from("articles")
            .update({
              title_zh: result.titleZh,
              intro_zh: result.introZh || null,
              summary_zh: result.summaryZh,
              content_zh: result.contentZh,
              article_type: result.articleType,
              reading_time: result.readingTime,
            })
            .eq("id", article.id);

          if (updateErr) {
            log.error(`Update failed for "${label}": ${updateErr.message}`);
            failed++;
          } else {
            log.success(`Retranslated: ${result.titleZh}`);
            retranslated++;
          }
        } catch (e) {
          log.error(`Retranslation failed for "${label}": ${e.message}`);
          failed++;
        }
      }
      log.progress(i + 1, candidates.length, failed, label);
    }

    log.progressEnd();
    log.success(`\n=== Retranslation Summary ===`);
    log.success(`Total: ${candidates.length} | Retranslated: ${retranslated} | Failed: ${failed}`);
    if (dryRun) log.info("[DRY RUN] No records were updated.");
    return {
      pipeline: "sync-articles:retranslate",
      status: failed > 0 ? "partial" : "success",
      summary: { mode: "retranslate-truncated", total: candidates.length, retranslated, failed },
      errorMsg: failed > 0 ? `${failed} retranslations failed` : null,
      exitCode: failed > 0 ? 1 : 0,
    };
  }

  // ── Re-compile all draft articles with upgraded prompt ─────────────
  if (retranslateDrafts) {
    validateEnv(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
    const { name, model } = getProviderInfo();
    log.info(`LLM provider: ${name} (${model})`);
    const sb = createAdminClient();

    // Query all draft articles that have English content
    let query = sb
      .from("articles")
      .select("id, slug, title, summary, content, content_zh, source")
      .eq("status", "draft")
      .not("content", "is", null)
      .order("relevance_score", { ascending: false });

    // Respect --source filter
    if (sourceFilter) {
      query = query.eq("source", sourceFilter);
    }

    const { data: drafts, error: queryErr } = await query;

    if (queryErr) {
      log.error(`Query failed: ${queryErr.message}`);
      return { pipeline: "sync-articles:retranslate", status: "failure", summary: { mode: "retranslate-drafts" }, errorMsg: queryErr.message, exitCode: 1 };
    }

    const candidates = (drafts || []).filter((a) => a.content && a.content.length > 100);
    const batch = limit !== Infinity ? candidates.slice(0, limit) : candidates;
    log.info(`Found ${candidates.length} draft articles, processing ${batch.length}`);

    if (batch.length === 0) {
      log.success("No draft articles to re-compile.");
      log.done();
      return;
    }

    let recompiled = 0;
    let failed = 0;

    for (let i = 0; i < batch.length; i++) {
      const article = batch[i];
      const label = (article.title || article.slug).slice(0, 60);
      const strategy = article.content.length > 50000 ? "summarize"
        : article.content.length > 15000 ? "chunked" : "single";

      if (dryRun) {
        log.info(`[DRY RUN] Would re-compile (${strategy}, ${Math.round(article.content.length / 1000)}K): ${label}`);
        recompiled++;
      } else {
        try {
          await llmThrottle();
          log.info(`Re-compiling (${strategy}, ${Math.round(article.content.length / 1000)}K): ${label}`);
          const result = await withRetry(
            () => translateArticle({
              title: article.title || "",
              summary: article.summary || "",
              content: article.content,
            }),
            { label }
          );

          const { error: updateErr } = await sb
            .from("articles")
            .update({
              title_zh: result.titleZh,
              intro_zh: result.introZh || null,
              summary_zh: result.summaryZh,
              content_zh: result.contentZh,
              article_type: result.articleType,
              reading_time: result.readingTime,
            })
            .eq("id", article.id);

          if (updateErr) {
            log.error(`Update failed for "${label}": ${updateErr.message}`);
            failed++;
          } else {
            log.success(`Re-compiled: ${result.titleZh}`);
            recompiled++;
          }
        } catch (e) {
          log.error(`Re-compilation failed for "${label}": ${e.message}`);
          failed++;
        }
      }
      log.progress(i + 1, batch.length, failed, label);
    }

    log.progressEnd();
    log.success(`\n=== Re-compilation Summary ===`);
    log.success(`Total: ${batch.length} | Re-compiled: ${recompiled} | Failed: ${failed}`);
    if (dryRun) log.info("[DRY RUN] No records were updated.");
    return {
      pipeline: "sync-articles:retranslate",
      status: failed > 0 ? "partial" : "success",
      summary: { mode: "retranslate-drafts", total: batch.length, recompiled, failed },
      errorMsg: failed > 0 ? `${failed} re-compilations failed` : null,
      exitCode: failed > 0 ? 1 : 0,
    };
  }

  // ── Re-compile published articles with upgraded prompt ──────────────
  if (retranslatePublished) {
    validateEnv(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
    const { name, model } = getProviderInfo();
    log.info(`LLM provider: ${name} (${model})`);
    const sb = createAdminClient();

    let query = sb
      .from("articles")
      .select("id, slug, title, summary, content, content_zh, source")
      .eq("status", "published")
      .not("content", "is", null)
      .order("published_at", { ascending: false });

    if (sourceFilter) {
      query = query.eq("source", sourceFilter);
    }

    const { data: articles, error: queryErr } = await query;

    if (queryErr) {
      log.error(`Query failed: ${queryErr.message}`);
      return { pipeline: "sync-articles:retranslate", status: "failure", summary: { mode: "retranslate-published" }, errorMsg: queryErr.message, exitCode: 1 };
    }

    const candidates = (articles || []).filter((a) => a.content && a.content.length > 100);
    const batch = limit !== Infinity ? candidates.slice(0, limit) : candidates;
    log.info(`Found ${candidates.length} published articles, processing ${batch.length}`);

    if (batch.length === 0) {
      log.success("No published articles to re-compile.");
      log.done();
      return;
    }

    let recompiled = 0;
    let failed = 0;

    for (let i = 0; i < batch.length; i++) {
      const article = batch[i];
      const label = (article.title || article.slug).slice(0, 60);
      const strategy = article.content.length > 50000 ? "summarize"
        : article.content.length > 15000 ? "chunked" : "single";

      if (dryRun) {
        log.info(`[DRY RUN] Would re-compile (${strategy}, ${Math.round(article.content.length / 1000)}K): ${label}`);
        recompiled++;
      } else {
        try {
          await llmThrottle();
          log.info(`Re-compiling (${strategy}, ${Math.round(article.content.length / 1000)}K): ${label}`);
          const result = await withRetry(
            () => translateArticle({
              title: article.title || "",
              summary: article.summary || "",
              content: article.content,
            }),
            { label }
          );

          const { error: updateErr } = await sb
            .from("articles")
            .update({
              title_zh: result.titleZh,
              intro_zh: result.introZh || null,
              summary_zh: result.summaryZh,
              content_zh: result.contentZh,
              article_type: result.articleType,
              reading_time: result.readingTime,
            })
            .eq("id", article.id);

          if (updateErr) {
            log.error(`Update failed for "${label}": ${updateErr.message}`);
            failed++;
          } else {
            log.success(`Re-compiled: ${result.titleZh}`);
            recompiled++;
          }
        } catch (e) {
          log.error(`Re-compilation failed for "${label}": ${e.message}`);
          failed++;
        }
      }
      log.progress(i + 1, batch.length, failed, label);
    }

    log.progressEnd();
    log.success(`\n=== Re-compilation (Published) Summary ===`);
    log.success(`Total: ${batch.length} | Re-compiled: ${recompiled} | Failed: ${failed}`);
    if (dryRun) log.info("[DRY RUN] No records were updated.");
    return {
      pipeline: "sync-articles:retranslate",
      status: failed > 0 ? "partial" : "success",
      summary: { mode: "retranslate-published", total: batch.length, recompiled, failed },
      errorMsg: failed > 0 ? `${failed} re-compilations failed` : null,
      exitCode: failed > 0 ? 1 : 0,
    };
  }

  // Summary counters
  let totalFetched = 0;
  let totalSkipped = 0;
  let totalFiltered = 0;
  let totalInserted = 0;
  let totalFailed = 0;

  for (const source of sources) {
    log.info(`\n── ${source.label} (${source.name}) ──`);

    // Step 1: Fetch items (Sanity API or RSS feed)
    let items;
    try {
      if (source.type === "sanity") {
        items = await fetchAnthropicFromSanity(source);
        log.info(`Fetched ${items.length} items from Sanity API`);
      } else {
        // Some feeds have malformed XML (unescaped &, invalid dates).
        // Fetch raw text first, sanitize, then parse as string.
        const feedRes = await fetch(source.feedUrl, {
          headers: { "User-Agent": "SkillNav-Bot/1.0 (+https://skillnav.dev)" },
          signal: AbortSignal.timeout(15000),
        });
        let feedText = await feedRes.text();
        // Fix unescaped ampersands in XML (e.g. Cursor changelog)
        feedText = feedText.replace(/&(?!amp;|lt;|gt;|quot;|apos;|#)/g, "&amp;");
        // Truncate massive feeds to first 100 items to avoid date parsing errors and excessive backfill
        const entryCount = (feedText.match(/<entry>/g) || []).length;
        const itemCount = (feedText.match(/<item>/g) || []).length;
        if (entryCount > 100) {
          let kept = 0;
          feedText = feedText.replace(/<entry>[\s\S]*?<\/entry>/g, (match) =>
            kept++ < 100 ? match : ""
          );
          log.info(`Truncated Atom feed from ${entryCount} to 100 entries`);
        } else if (itemCount > 100) {
          let kept = 0;
          feedText = feedText.replace(/<item>[\s\S]*?<\/item>/g, (match) =>
            kept++ < 100 ? match : ""
          );
          log.info(`Truncated RSS feed from ${itemCount} to 100 items`);
        }
        const feed = await rssParser.parseString(feedText);
        items = feed.items || [];
        log.info(`Fetched ${items.length} items from RSS`);
      }
    } catch (e) {
      log.warn(`Failed to fetch from ${source.type === "sanity" ? "Sanity API" : source.feedUrl}: ${e.message}`);
      continue;
    }
    if (limit !== Infinity) {
      items = items.slice(0, limit);
    }
    totalFetched += items.length;

    if (items.length === 0) continue;

    // Step 2: Deduplicate against existing articles in DB
    let newItems = items;
    if (!dryRun && supabase) {
      const urls = items.map((i) => i.link).filter(Boolean);
      const { data: existing } = await supabase
        .from("articles")
        .select("source_url")
        .in("source_url", urls);
      const existingUrls = new Set(existing?.map((a) => a.source_url) || []);
      newItems = items.filter((i) => !existingUrls.has(i.link));
      const skipped = items.length - newItems.length;
      totalSkipped += skipped;
      if (skipped > 0) {
        log.info(`Skipped ${skipped} existing articles`);
      }
    }

    // Step 2.5: Relevance filter (non-Anthropic sources)
    const beforeFilter = newItems.length;
    newItems = newItems.filter((item) => isRelevant(item, source));
    const filtered = beforeFilter - newItems.length;
    if (filtered > 0) {
      totalFiltered += filtered;
      log.info(`Filtered ${filtered} irrelevant articles`);
    }

    log.info(`Processing ${newItems.length} new articles...`);

    // Step 3: Process each new item sequentially
    for (let idx = 0; idx < newItems.length; idx++) {
      const item = newItems[idx];
      const itemLabel = (item.title || item.link || "unknown").slice(0, 60);

      try {
        // 3a: Extract full content from source URL
        let contentMd = "";
        let excerpt = "";
        let coverImage = null;

        if (item.link) {
          try {
            const extracted = await withRetry(
              () => extractContent(item.link),
              { label: itemLabel }
            );
            if (extracted) {
              contentMd = extracted.content;
              excerpt = extracted.excerpt || "";
              coverImage = extracted.coverImage || null;
            }
            await delay(500); // polite delay between fetches
          } catch (e) {
            log.warn(`Content extraction failed for "${itemLabel}": ${e.message}`);
          }
        }

        // Fallback: use RSS content/snippet if extraction failed
        if (!contentMd) {
          contentMd = htmlToMarkdown(item.content || "") || item.contentSnippet || "";
          log.info(`Using RSS fallback content for "${itemLabel}"`);
        }
        if (!excerpt) {
          excerpt = item.contentSnippet || "";
        }

        // Content length gate: skip articles shorter than 500 chars
        if (contentMd.length < 500) {
          log.info(`Skipped (too short: ${contentMd.length} chars): "${itemLabel}"`);
          totalSkipped++;
          continue;
        }

        // 3b: Translate via LLM (skip in dry-run to avoid requiring API key)
        let translation;
        if (dryRun) {
          translation = {
            titleZh: `[待翻译] ${item.title || ""}`,
            summaryZh: excerpt,
            contentZh: contentMd,
            articleType: source.defaultType,
            readingTime: Math.max(1, Math.ceil(contentMd.length / 1500)),
          };
        } else {
          try {
            await llmThrottle(); // enforce 10 req/min limit
            translation = await withRetry(
              () => translateArticle({
                title: item.title || "",
                summary: excerpt,
                content: contentMd,
              }),
              { label: itemLabel }
            );
          } catch (e) {
            log.error(`Translation failed for "${itemLabel}": ${e.message}`);
            totalFailed++;
            continue;
          }
        }

        // Normalize articleType to DB-valid values
        const validDbTypes = ["tutorial", "analysis", "guide"];
        const articleType = validDbTypes.includes(translation.articleType)
          ? translation.articleType
          : (source.defaultType || "analysis");

        // Extract relevance score + advertorial flag from LLM response
        const relevanceScore = translation.relevanceScore || 3;
        const isAdvertorial = !!translation.isAdvertorial;

        // Fallback: RSS enclosure as cover image (e.g. GitHub Blog)
        if (!coverImage && item.enclosure?.url) {
          coverImage = item.enclosure.url;
        }

        // 3c: Build DB record
        const record = {
          slug: generateSlug(item.title || "untitled"),
          title: item.title || "",
          title_zh: translation.titleZh,
          intro_zh: translation.introZh || null,
          summary: excerpt,
          summary_zh: translation.summaryZh,
          content: contentMd,
          content_zh: translation.contentZh,
          source_url: item.link,
          cover_image: coverImage,
          source: source.name,
          article_type: articleType,
          reading_time: translation.readingTime,
          relevance_score: relevanceScore,
          content_tier: "translated",
          status: isAdvertorial ? "hidden" : "draft",
          published_at: item.pubDate
            ? new Date(item.pubDate).toISOString()
            : new Date().toISOString(),
        };

        // 3d: Quality gate — rule-based checks before insert
        if (record.status !== "hidden") {
          const contentLen = (record.content_zh || "").length;

          if (contentLen < 200) {
            record.status = "draft"; // translation too short or failed
            log.warn(`Quality gate: content_zh < 200 chars → draft: ${record.title_zh || record.title}`);
          }
        }

        // 3e: Quality gate Layer 2 — LLM scoring for articles still in "draft"
        if (record.status === "draft" && record.content_zh && !dryRun) {
          try {
            const score = await scoreArticle({
              title_zh: record.title_zh,
              content_zh: record.content_zh,
              source: record.source,
            });
            log.info(`Quality L2: af:${score.audience_fit} cr:${score.credibility} → ${score.action} | ${score.reason}`);
            if (score.action === "publish") {
              record.status = "published";
            } else if (score.action === "hidden") {
              record.status = "hidden";
            }
            // "draft" stays as draft — human review queue
          } catch (e) {
            log.warn(`Quality L2 failed, keeping draft: ${e.message}`);
          }
        }

        // 3f: Insert or dry-run log
        if (dryRun) {
          log.info(`[DRY RUN] Would insert: ${record.title_zh || record.title}`);
          totalInserted++;
        } else {
          // ignoreDuplicates: true ensures existing articles keep their status
          const { error } = await supabase
            .from("articles")
            .upsert(record, { onConflict: "source_url", ignoreDuplicates: true });

          if (error) {
            log.error(`Failed to insert "${record.title}": ${error.message}`);
            totalFailed++;
          } else {
            log.success(`Inserted: ${record.title_zh}`);
            totalInserted++;
          }
        }
      } catch (e) {
        log.error(`Unexpected error processing "${itemLabel}": ${e.message}`);
        totalFailed++;
      }

      log.progress(idx + 1, newItems.length, totalFailed, itemLabel);
    }

    log.progressEnd();
  }

  // Summary report
  log.success("\n=== Sync Summary ===");
  log.success(`Sources: ${sources.map((s) => s.name).join(", ")}`);
  log.success(`Fetched: ${totalFetched} | Dedup: ${totalSkipped} | Filtered: ${totalFiltered} | Inserted: ${totalInserted} | Failed: ${totalFailed}`);
  if (dryRun) {
    log.info("[DRY RUN] No records were written to the database.");
  }

  // Write Job Summary for GitHub Actions
  const summaryLines = [
    "## Articles Sync Summary",
    "",
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Sources | ${sources.map((s) => s.name).join(", ")} |`,
    `| Fetched | ${totalFetched} |`,
    `| Skipped (dedup) | ${totalSkipped} |`,
    `| Filtered (irrelevant) | ${totalFiltered} |`,
    `| Inserted | ${totalInserted} |`,
    `| Failed | ${totalFailed} |`,
    dryRun ? "\n> **DRY RUN** — no records written" : "",
  ];
  log.summary(summaryLines.join("\n"));

  // Expose stats as GitHub Actions step outputs for Slack notification
  log.setOutput("inserted", totalInserted);
  log.setOutput("skipped", totalSkipped);
  log.setOutput("failed", totalFailed);
  log.setOutput("fetched", totalFetched);

  return {
    status: totalFailed > 0 ? "partial" : "success",
    summary: {
      fetched: totalFetched,
      deduped: totalSkipped,
      filtered: totalFiltered,
      inserted: totalInserted,
      failed: totalFailed,
    },
    errorMsg: totalFailed > 0 ? `${totalFailed} articles failed` : null,
    exitCode: totalFailed > 0 ? 1 : 0,
  };
}

runPipeline(main, { logger: log, defaultPipeline: "sync-articles" });
