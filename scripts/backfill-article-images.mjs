#!/usr/bin/env node

/**
 * One-time backfill script: extract cover images for existing articles.
 * Fetches each article's source_url, extracts og:image, and updates DB.
 *
 * Usage:
 *   node scripts/backfill-article-images.mjs              # Run backfill
 *   node scripts/backfill-article-images.mjs --dry-run     # Preview only
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import { JSDOM } from "jsdom";
import { createAdminClient } from "./lib/supabase-admin.mjs";
import { createLogger } from "./lib/logger.mjs";
import { validateEnv } from "./lib/validate-env.mjs";

const log = createLogger("backfill-images");
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Extract cover image from a URL.
 * Priority: og:image → twitter:image → first wide img.
 */
async function extractCoverImage(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "SkillNav-Bot/1.0 (+https://skillnav.dev)" },
    signal: AbortSignal.timeout(15000),
  });
  const html = await res.text();
  const dom = new JSDOM(html, { url });
  const doc = dom.window.document;

  // og:image
  const ogImage = doc.querySelector('meta[property="og:image"]');
  if (ogImage?.content) return resolveUrl(ogImage.content, url);

  // twitter:image
  const twImage = doc.querySelector('meta[name="twitter:image"]');
  if (twImage?.content) return resolveUrl(twImage.content, url);

  // First content image
  const container =
    doc.querySelector("article") ||
    doc.querySelector("main") ||
    doc.body;
  if (container) {
    const imgs = container.querySelectorAll("img[src]");
    for (const img of imgs) {
      const w = parseInt(img.getAttribute("width") || "0", 10);
      if (w >= 400 || !img.getAttribute("width")) {
        const src = img.getAttribute("src");
        if (
          src &&
          !src.includes("avatar") &&
          !src.includes("icon") &&
          !src.includes("logo")
        ) {
          return resolveUrl(src, url);
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

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  validateEnv(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
  const supabase = createAdminClient();

  // Find articles missing cover images
  const { data: articles, error } = await supabase
    .from("articles")
    .select("id, slug, source_url, cover_image")
    .is("cover_image", null)
    .not("source_url", "is", null)
    .neq("source_url", "");

  if (error) {
    log.error(`Failed to query articles: ${error.message}`);
    process.exit(1);
  }

  log.info(`Found ${articles.length} articles without cover images`);

  let updated = 0;
  let failed = 0;

  for (const article of articles) {
    try {
      const coverImage = await extractCoverImage(article.source_url);

      if (coverImage) {
        if (dryRun) {
          log.info(`[DRY RUN] ${article.slug}: ${coverImage}`);
        } else {
          const { error: updateError } = await supabase
            .from("articles")
            .update({ cover_image: coverImage })
            .eq("id", article.id);

          if (updateError) {
            log.error(`Failed to update ${article.slug}: ${updateError.message}`);
            failed++;
            continue;
          }
          log.success(`Updated: ${article.slug}`);
        }
        updated++;
      } else {
        log.info(`No image found: ${article.slug}`);
      }

      await delay(500); // polite delay
    } catch (e) {
      log.warn(`Failed to fetch ${article.slug}: ${e.message}`);
      failed++;
    }
  }

  log.success(`\n=== Backfill Summary ===`);
  log.success(`Total: ${articles.length} | Updated: ${updated} | Failed: ${failed}`);
  if (dryRun) {
    log.info("[DRY RUN] No records were written to the database.");
  }

  log.done();
}

main().catch((e) => {
  log.error(e.message);
  process.exit(1);
});
