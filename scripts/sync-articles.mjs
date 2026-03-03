#!/usr/bin/env node

/**
 * Sync articles from RSS feeds to Supabase.
 * Fetches RSS → extracts full content → translates via LLM → upserts to DB.
 *
 * Usage:
 *   node scripts/sync-articles.mjs                    # Full sync (all sources)
 *   node scripts/sync-articles.mjs --dry-run           # Preview only
 *   node scripts/sync-articles.mjs --limit 5           # Limit items per source
 *   node scripts/sync-articles.mjs --source anthropic  # Single source only
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
import { translateArticle } from "./lib/llm.mjs";

const log = createLogger("articles");

// ── RSS Sources ──────────────────────────────────────────────────────
const SOURCES = [
  {
    name: "anthropic",
    label: "Anthropic News",
    feedUrl: "https://raw.githubusercontent.com/taobojlen/anthropic-rss-feed/main/anthropic_news_rss.xml",
    defaultType: "news",
  },
  {
    name: "openai",
    label: "OpenAI Blog",
    feedUrl: "https://openai.com/blog/rss.xml",
    defaultType: "news",
  },
  {
    name: "langchain",
    label: "LangChain Blog",
    feedUrl: "https://blog.langchain.dev/rss/",
    defaultType: "tutorial",
  },
  {
    name: "simonw",
    label: "Simon Willison's Weblog",
    feedUrl: "https://simonwillison.net/atom/everything/",
    defaultType: "analysis",
  },
];

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
 * Extract full article content from a URL using Readability + Turndown.
 * Returns Markdown content and excerpt, or null on failure.
 */
async function extractContent(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "SkillNav-Bot/1.0 (+https://skillnav.dev)" },
    signal: AbortSignal.timeout(15000),
  });
  const html = await res.text();
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();
  if (!article) return null;
  return {
    content: turndown.turndown(article.content),
    excerpt: article.excerpt,
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
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx !== -1 ? Number(args[limitIdx + 1]) : Infinity;
  const sourceIdx = args.indexOf("--source");
  const sourceFilter = sourceIdx !== -1 ? args[sourceIdx + 1] : null;

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
    process.exit(1);
  }

  // Summary counters
  let totalFetched = 0;
  let totalSkipped = 0;
  let totalInserted = 0;
  let totalFailed = 0;

  for (const source of sources) {
    log.info(`\n── ${source.label} (${source.name}) ──`);

    // Step 1: Fetch RSS feed
    let feed;
    try {
      feed = await rssParser.parseURL(source.feedUrl);
    } catch (e) {
      log.warn(`Failed to fetch RSS from ${source.feedUrl}: ${e.message}`);
      continue;
    }

    let items = feed.items || [];
    if (limit !== Infinity) {
      items = items.slice(0, limit);
    }
    totalFetched += items.length;
    log.info(`Fetched ${items.length} items from RSS`);

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

    log.info(`Processing ${newItems.length} new articles...`);

    // Step 3: Process each new item sequentially
    for (let idx = 0; idx < newItems.length; idx++) {
      const item = newItems[idx];
      const itemLabel = (item.title || item.link || "unknown").slice(0, 60);

      try {
        // 3a: Extract full content from source URL
        let contentMd = "";
        let excerpt = "";

        if (item.link) {
          try {
            const extracted = await extractContent(item.link);
            if (extracted) {
              contentMd = extracted.content;
              excerpt = extracted.excerpt || "";
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
            translation = await translateArticle({
              title: item.title || "",
              summary: excerpt,
              content: contentMd,
            });
            await delay(200); // rate limit between LLM calls
          } catch (e) {
            log.error(`Translation failed for "${itemLabel}": ${e.message}`);
            totalFailed++;
            continue;
          }
        }

        // Normalize articleType to DB-valid values
        // DB allows: news, review, comparison, tutorial, weekly
        const validDbTypes = ["news", "review", "comparison", "tutorial", "weekly"];
        const articleType = validDbTypes.includes(translation.articleType)
          ? translation.articleType
          : source.defaultType === "analysis" ? "news" : (source.defaultType || "news");

        // 3c: Build DB record
        const record = {
          slug: generateSlug(item.title || "untitled"),
          title: item.title || "",
          title_zh: translation.titleZh,
          summary: excerpt,
          summary_zh: translation.summaryZh,
          content: contentMd,
          content_zh: translation.contentZh,
          source_url: item.link,
          article_type: articleType,
          reading_time: translation.readingTime,
          published_at: item.pubDate
            ? new Date(item.pubDate).toISOString()
            : new Date().toISOString(),
        };

        // 3d: Insert or dry-run log
        if (dryRun) {
          log.info(`[DRY RUN] Would insert: ${record.title_zh || record.title}`);
          totalInserted++;
        } else {
          const { error } = await supabase
            .from("articles")
            .upsert(record, { onConflict: "source_url" });

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
  log.success(`Fetched: ${totalFetched} | Skipped (dedup): ${totalSkipped} | Inserted: ${totalInserted} | Failed: ${totalFailed}`);
  if (dryRun) {
    log.info("[DRY RUN] No records were written to the database.");
  }
  log.done();
}

main().catch((e) => {
  log.error(e.message);
  process.exit(1);
});
