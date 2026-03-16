#!/usr/bin/env node

/**
 * Backfill a curated article series into Supabase.
 *
 * - Fetches full content from each URL (Readability + Turndown)
 * - Translates via LLM (reuses existing pipeline)
 * - Inserts with series slug + series_number
 * - Skips URLs already in DB (safe to re-run)
 *
 * Usage:
 *   node scripts/backfill-series.mjs                # Run backfill
 *   node scripts/backfill-series.mjs --dry-run      # Preview only
 *   node scripts/backfill-series.mjs --tag-only      # Only tag existing articles (no fetch/translate)
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import TurndownService from "turndown";
import { createAdminClient } from "./lib/supabase-admin.mjs";
import { createLogger } from "./lib/logger.mjs";
import { translateArticle, getProviderInfo } from "./lib/llm.mjs";
import { withRetry } from "./lib/retry.mjs";
import { validateEnv } from "./lib/validate-env.mjs";

const log = createLogger("series");

// ── Series definition ────────────────────────────────────────────────
const SERIES = {
  slug: "agentic-engineering-patterns",
  source: "simonw",
  articles: [
    { order: 1,  section: "Principles",        url: "https://simonwillison.net/guides/agentic-engineering-patterns/what-is-agentic-engineering/" },
    { order: 2,  section: "Principles",        url: "https://simonwillison.net/guides/agentic-engineering-patterns/code-is-cheap/" },
    { order: 3,  section: "Principles",        url: "https://simonwillison.net/guides/agentic-engineering-patterns/hoard-things-you-know-how-to-do/" },
    { order: 4,  section: "Principles",        url: "https://simonwillison.net/guides/agentic-engineering-patterns/better-code/" },
    { order: 5,  section: "Principles",        url: "https://simonwillison.net/guides/agentic-engineering-patterns/anti-patterns/" },
    { order: 6,  section: "Testing & QA",      url: "https://simonwillison.net/guides/agentic-engineering-patterns/red-green-tdd/" },
    { order: 7,  section: "Testing & QA",      url: "https://simonwillison.net/guides/agentic-engineering-patterns/first-run-the-tests/" },
    { order: 8,  section: "Testing & QA",      url: "https://simonwillison.net/guides/agentic-engineering-patterns/agentic-manual-testing/" },
    { order: 9,  section: "Understanding Code", url: "https://simonwillison.net/guides/agentic-engineering-patterns/linear-walkthroughs/" },
    { order: 10, section: "Understanding Code", url: "https://simonwillison.net/guides/agentic-engineering-patterns/interactive-explanations/" },
    { order: 11, section: "Annotated Prompts",  url: "https://simonwillison.net/guides/agentic-engineering-patterns/gif-optimization/" },
    { order: 12, section: "Appendix",           url: "https://simonwillison.net/guides/agentic-engineering-patterns/prompts/" },
  ],
};

// ── Helpers ──────────────────────────────────────────────────────────
const turndown = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced" });
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function generateSlug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

async function extractContent(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "SkillNav-Bot/1.0 (+https://skillnav.dev)" },
    signal: AbortSignal.timeout(15000),
  });
  const html = await res.text();
  const dom = new JSDOM(html, { url });
  const doc = dom.window.document;

  // Extract cover image
  const ogImage = doc.querySelector('meta[property="og:image"]');
  const coverImage = ogImage?.content || null;

  const reader = new Readability(doc);
  const article = reader.parse();
  if (!article) return null;
  return {
    title: article.title,
    content: turndown.turndown(article.content),
    excerpt: article.excerpt,
    coverImage,
  };
}

// ── Main ─────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const tagOnly = args.includes("--tag-only");

  validateEnv(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
  const supabase = createAdminClient();

  if (!dryRun && !tagOnly) {
    const { name, model } = getProviderInfo();
    log.info(`LLM provider: ${name} (${model})`);
  }

  log.info(`Series: ${SERIES.slug} (${SERIES.articles.length} articles)`);

  // Step 1: Find which URLs already exist in DB
  // Match both with and without trailing slash, and with #atom-everything suffix
  const allUrls = SERIES.articles.flatMap((a) => {
    const base = a.url.replace(/\/$/, "");
    return [base, base + "/", base + "/#atom-everything", base + "#atom-everything"];
  });

  const { data: existing } = await supabase
    .from("articles")
    .select("id, source_url, series, series_number")
    .in("source_url", allUrls);

  // Build a lookup: normalized URL → existing row
  const existingByUrl = new Map();
  for (const row of existing || []) {
    const norm = row.source_url.replace(/#.*$/, "").replace(/\/$/, "");
    existingByUrl.set(norm, row);
  }

  // Also check the announcement post
  const { data: announceRows } = await supabase
    .from("articles")
    .select("id, source_url, series, series_number")
    .like("source_url", "%agentic-engineering-patterns%")
    .not("source_url", "like", "%/guides/%");

  // Step 2: Tag existing articles
  const toTag = [];
  const toFetch = [];

  for (const entry of SERIES.articles) {
    const norm = entry.url.replace(/\/$/, "");
    const row = existingByUrl.get(norm);
    if (row) {
      if (row.series !== SERIES.slug || row.series_number !== entry.order) {
        toTag.push({ id: row.id, series: SERIES.slug, series_number: entry.order });
      }
    } else {
      toFetch.push(entry);
    }
  }

  // Tag the announcement post as series_number 0 if it exists
  for (const row of announceRows || []) {
    if (row.series !== SERIES.slug) {
      toTag.push({ id: row.id, series: SERIES.slug, series_number: 0 });
    }
  }

  log.info(`Already in DB: ${existingByUrl.size} | Need tagging: ${toTag.length} | Need fetch+translate: ${toFetch.length}`);

  // Step 2a: Apply tags
  if (toTag.length > 0) {
    for (const { id, series, series_number } of toTag) {
      if (dryRun) {
        log.info(`[DRY RUN] Would tag article ${id} → series=${series}, #${series_number}`);
      } else {
        const { error } = await supabase
          .from("articles")
          .update({ series, series_number })
          .eq("id", id);
        if (error) {
          log.error(`Failed to tag ${id}: ${error.message}`);
        } else {
          log.success(`Tagged article ${id} → #${series_number}`);
        }
      }
    }
  }

  if (tagOnly) {
    log.success("Tag-only mode complete.");
    log.done();
    return;
  }

  // Step 3: Fetch + translate missing articles
  if (toFetch.length === 0) {
    log.success("All articles already in DB. Nothing to fetch.");
    log.done();
    return;
  }

  let inserted = 0;
  let failed = 0;

  for (let i = 0; i < toFetch.length; i++) {
    const entry = toFetch[i];
    const label = entry.url.split("/").filter(Boolean).pop();

    try {
      // 3a: Extract content
      log.info(`Fetching: ${label}`);
      const extracted = await withRetry(() => extractContent(entry.url), { label });
      if (!extracted) {
        log.error(`Readability failed for ${label}`);
        failed++;
        continue;
      }

      if (extracted.content.length < 200) {
        log.warn(`Content too short (${extracted.content.length} chars): ${label}`);
        failed++;
        continue;
      }

      // 3b: Translate
      if (dryRun) {
        log.info(`[DRY RUN] Would translate+insert: "${extracted.title}" (${Math.round(extracted.content.length / 1000)}K chars)`);
        inserted++;
      } else {
        log.info(`Translating (${Math.round(extracted.content.length / 1000)}K): ${extracted.title}`);
        const result = await withRetry(
          () => translateArticle({
            title: extracted.title || "",
            summary: extracted.excerpt || "",
            content: extracted.content,
          }),
          { label }
        );

        const validTypes = ["tutorial", "analysis", "guide"];
        const articleType = validTypes.includes(result.articleType) ? result.articleType : "guide";

        const record = {
          slug: generateSlug(extracted.title || label),
          title: extracted.title || "",
          title_zh: result.titleZh,
          intro_zh: result.introZh || null,
          summary: extracted.excerpt || "",
          summary_zh: result.summaryZh,
          content: extracted.content,
          content_zh: result.contentZh,
          source_url: entry.url,
          cover_image: extracted.coverImage || null,
          source: SERIES.source,
          article_type: articleType,
          reading_time: result.readingTime,
          relevance_score: 5, // curated series = max relevance
          content_tier: "translated",
          series: SERIES.slug,
          series_number: entry.order,
          status: "published", // curated series go live directly
          published_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from("articles")
          .upsert(record, { onConflict: "source_url", ignoreDuplicates: true });

        if (error) {
          log.error(`Insert failed for "${record.title}": ${error.message}`);
          failed++;
        } else {
          log.success(`Inserted: ${result.titleZh} → #${entry.order}`);
          inserted++;
        }

        await delay(2000); // polite delay between LLM calls
      }
    } catch (e) {
      log.error(`Failed for ${label}: ${e.message}`);
      failed++;
    }

    log.progress(i + 1, toFetch.length, failed, label);
  }

  log.progressEnd();
  log.success(`\n=== Series Backfill Summary ===`);
  log.success(`Series: ${SERIES.slug}`);
  log.success(`Tagged: ${toTag.length} | Inserted: ${inserted} | Failed: ${failed}`);
  if (dryRun) log.info("[DRY RUN] No records were written.");
  log.done();

  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  log.error(e.message);
  process.exit(1);
});
