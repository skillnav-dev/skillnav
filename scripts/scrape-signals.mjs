#!/usr/bin/env node

/**
 * Scrape daily signals from 5 AI newsletters.
 * Cross-reference topics by URL/title to calculate heat scores.
 * Output: data/daily-signals/YYYY-MM-DD.json
 *
 * Usage:
 *   node scripts/scrape-signals.mjs                  # Scrape today's signals
 *   node scripts/scrape-signals.mjs --date 2026-03-19 # Specific date
 *   node scripts/scrape-signals.mjs --dry-run         # Preview, don't write file
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import { createAdminClient } from "./lib/supabase-admin.mjs";
import { createLogger } from "./lib/logger.mjs";
import fs from "fs";
import path from "path";

const log = createLogger("signals");

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const BROWSER_HEADERS = {
  "User-Agent": BROWSER_UA,
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
};
const FETCH_TIMEOUT = 30_000;

// ── Helpers ────────────────────────────────────────────────────────

function formatDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function normalizeUrl(raw) {
  if (!raw) return null;
  try {
    // Decode HTML entities before parsing
    let cleaned = raw
      .replace(/&amp;/g, "&")
      .replace(/%3B/gi, ";")
      .replace(/%3D/gi, "=")
      .replace(/%26/gi, "&");
    const u = new URL(cleaned);
    // Strip tracking params (including malformed amp; variants)
    const stripParams = [
      "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
      "ref", "source", "s_category", "s_source", "s_origin",
      "s", // Twitter share param
    ];
    for (const p of stripParams) {
      u.searchParams.delete(p);
      u.searchParams.delete(`amp;${p}`); // malformed HTML-encoded params
    }
    // Normalize
    u.protocol = "https:";
    let href = u.href;
    // Remove trailing slash for consistency
    if (href.endsWith("/") && u.pathname !== "/") href = href.slice(0, -1);
    return href;
  } catch {
    return null;
  }
}

async function fetchWithTimeout(url, opts = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

function htmlDecode(str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/<[^>]+>/g, "") // strip remaining HTML tags
    .trim();
}

// ── Source Scrapers ────────────────────────────────────────────────

/**
 * TLDR AI — best structured, date-based URL.
 * Sections: Headlines & Launches, Deep Dives, Engineering & Research, Quick Links
 */
async function scrapeTldr(dateStr) {
  const html = await fetchWithTimeout(`https://tldr.tech/ai/${dateStr}`);

  // Check for redirect (not published yet)
  if (html.includes("<title>TLDR AI</title>") && !html.includes(dateStr)) {
    log.warn("[tldr] Issue not published yet for " + dateStr);
    return [];
  }

  const items = [];
  // Pattern: <a class="font-bold" href="URL?utm_source=tldrai"> followed by <h3>Title</h3>
  // then <div class="newsletter-html">Summary</div>
  const blockRe =
    /<a class="font-bold" href="([^"]+\?utm_source=tldrai)"[^>]*>\s*<h3[^>]*>([^<]+)<\/h3>[\s\S]*?<div class="newsletter-html">([\s\S]*?)<\/div>/g;

  let match;
  while ((match = blockRe.exec(html)) !== null) {
    const rawUrl = match[1];
    const title = htmlDecode(match[2]).replace(/\s*\(\d+ minute read\)\s*$/, "").trim();
    const summary = htmlDecode(match[3]).slice(0, 300);
    const url = normalizeUrl(rawUrl);

    if (!url) continue;
    // Skip sponsor items
    if (/sponsor/i.test(summary) || /sponsor/i.test(title)) continue;

    items.push({ title, url, source: "tldr", summary });
  }

  log.info(`[tldr] ${items.length} items`);
  return items;
}

/**
 * Ben's Bites — Substack RSS feed.
 * Get latest post, extract external links from content.
 */
async function scrapeBensBites() {
  const rss = await fetchWithTimeout("https://www.bensbites.com/feed");

  // Get latest post URL
  const linkMatch = rss.match(/<item>[\s\S]*?<link>(https:\/\/www\.bensbites\.com\/p\/[^<]+)<\/link>/);
  if (!linkMatch) {
    log.warn("[bensbites] No recent post found in RSS");
    return [];
  }

  const postUrl = linkMatch[1];
  const html = await fetchWithTimeout(postUrl, {
    headers: BROWSER_HEADERS,
  });

  const items = [];
  // Extract linked headlines: <a href="external-url">title text</a> within post content
  // Ben's Bites uses Substack — content in <div class="body markup"> or similar
  // Look for external links with substantial anchor text
  const linkRe = /<a[^>]+href="(https?:\/\/[^"]+)"[^>]*>([^<]{10,})<\/a>/g;

  const seenUrls = new Set();
  let m;
  while ((m = linkRe.exec(html)) !== null) {
    const rawUrl = m[1];
    const text = htmlDecode(m[2]);

    // Skip internal, social, and utility links
    if (
      rawUrl.includes("bensbites.com") ||
      rawUrl.includes("substack.com") ||
      rawUrl.includes("twitter.com/intent") ||
      rawUrl.includes("mailto:") ||
      rawUrl.includes("substackcdn.com")
    ) continue;

    const url = normalizeUrl(rawUrl);
    if (!url || seenUrls.has(url)) continue;
    seenUrls.add(url);

    // Skip sponsor/ad links and very short anchor text (likely truncated)
    if (/sponsor|promoted|advertisement/i.test(text)) continue;
    if (text.split(/\s+/).length < 3) continue;
    items.push({ title: text, url, source: "bensbites", summary: "" });
  }

  log.info(`[bensbites] ${items.length} items from ${postUrl}`);
  return items;
}

/**
 * The Rundown AI — archive page with /p/ slugs.
 * Rundown uses single-word anchor text ("launched", "Dispatch"), so we extract
 * topic titles from h2/h3 headings and self-hosted article links instead.
 */
async function scrapeRundown() {
  const archiveHtml = await fetchWithTimeout("https://www.therundown.ai/archive", {
    headers: BROWSER_HEADERS,
  });

  // Get latest post slug
  const slugMatch = archiveHtml.match(/href="\/p\/([^"]+)"/);
  if (!slugMatch) {
    log.warn("[rundown] No post slug found");
    return [];
  }

  const postUrl = `https://www.therundown.ai/p/${slugMatch[1]}`;
  const html = await fetchWithTimeout(postUrl, {
    headers: BROWSER_HEADERS,
  });

  const items = [];
  const seenUrls = new Set();

  // Strategy 1: Extract self-hosted article links (/articles/ and /tools/)
  // These have descriptive titles as anchor text
  const selfLinkRe = /<a[^>]+href="(https:\/\/www\.rundown\.ai\/(?:articles|tools)\/[^"]+)"[^>]*>([^<]+)<\/a>/g;
  let m;
  while ((m = selfLinkRe.exec(html)) !== null) {
    const url = normalizeUrl(m[1]);
    const text = htmlDecode(m[2]).trim();
    if (!url || seenUrls.has(url) || text.length < 5) continue;
    seenUrls.add(url);
    items.push({ title: text, url, source: "rundown", summary: "" });
  }

  // Strategy 2: Extract external URLs (for cross-referencing)
  const extLinkRe = /<a[^>]+href="(https?:\/\/[^"]+)"[^>]*class="_3k8pkd0"[^>]*>([^<]*)<\/a>/g;
  while ((m = extLinkRe.exec(html)) !== null) {
    const rawUrl = m[1];
    if (
      rawUrl.includes("therundown.ai") ||
      rawUrl.includes("beehiiv.com") ||
      rawUrl.includes("twitter.com/intent") ||
      rawUrl.includes("mailto:")
    ) continue;
    const url = normalizeUrl(rawUrl);
    if (!url || seenUrls.has(url)) continue;
    seenUrls.add(url);
    // Use slug-derived title since anchor text is often just one word
    const slugTitle = url.split("/").pop()?.replace(/[-_]/g, " ").replace(/\?.*/, "") || "";
    const anchorText = htmlDecode(m[2]).trim();
    const title = anchorText.split(/\s+/).length >= 3 ? anchorText : slugTitle;
    if (title.length < 5) continue;
    items.push({ title, url, source: "rundown", summary: "" });
  }

  log.info(`[rundown] ${items.length} items from ${postUrl}`);
  return items;
}

/**
 * Superhuman AI — Beehiiv, homepage → latest /p/ slug → extract headings.
 */
async function scrapeSuperhuman() {
  return scrapeBeehiivHomepage("https://www.superhuman.ai/", "superhuman");
}

/**
 * Generic beehiiv homepage scraper — extracts posts from embedded JSON.
 * Only fetches homepage (no post detail pages), reducing Cloudflare block risk.
 */
async function scrapeBeehiivHomepage(baseUrl, source) {
  const homeHtml = await fetchWithTimeout(baseUrl, { headers: BROWSER_HEADERS });

  const items = [];

  // Strategy 1: Parse embedded JSON posts data (beehiiv SSR)
  // Use bracket-matching instead of regex to handle nested arrays
  const postsIdx = homeHtml.indexOf('"posts":');
  const bracketStart = postsIdx !== -1 ? homeHtml.indexOf("[", postsIdx) : -1;
  let postsJson = null;
  if (bracketStart !== -1) {
    let depth = 0;
    for (let i = bracketStart; i < homeHtml.length; i++) {
      if (homeHtml[i] === "[") depth++;
      if (homeHtml[i] === "]") { depth--; if (depth === 0) { postsJson = homeHtml.slice(bracketStart, i + 1); break; } }
    }
  }
  if (postsJson) {
    try {
      const posts = JSON.parse(postsJson);
      // Take latest 3 posts (they're already sorted by date)
      for (const post of posts.slice(0, 3)) {
        const title = htmlDecode(post.web_title || post.meta_default_title || "");
        const postUrl = `${baseUrl}/p/${post.slug || post.parameterized_web_title}`;
        if (title) items.push({ title, url: postUrl, source, summary: "" });

        // Extract subtopics from web_subtitle ("ALSO: topic1, topic2")
        const subtitle = post.web_subtitle || post.meta_default_description || "";
        const alsoMatch = subtitle.match(/ALSO:\s*(.+)/i);
        if (alsoMatch) {
          const topics = alsoMatch[1].split(/[,;]/).map((t) => t.trim()).filter((t) => t.length > 5);
          for (const topic of topics) {
            items.push({ title: htmlDecode(topic), url: null, source, summary: "" });
          }
        }
      }
    } catch {
      log.warn(`[${source}] Failed to parse embedded JSON, falling back to HTML`);
    }
  }

  // Strategy 2: Fallback to HTML parsing if JSON extraction failed
  if (items.length === 0) {
    const slugs = [...new Set([...homeHtml.matchAll(/href="\/p\/([^"]+)"/g)].map((m) => m[1]))];
    for (const slug of slugs.slice(0, 3)) {
      items.push({ title: slug.replace(/-/g, " "), url: `${baseUrl}/p/${slug}`, source, summary: "" });
    }
  }

  log.info(`[${source}] ${items.length} items from homepage`);
  return items;
}

/**
 * The Neuron — Beehiiv, reuses generic homepage scraper.
 */
async function scrapeNeuron() {
  return scrapeBeehiivHomepage("https://www.theneurondaily.com/", "neuron");
}


// ── Aggregation ────────────────────────────────────────────────────

function aggregateSignals(allItems) {
  // Group by normalized URL
  const urlGroups = new Map();
  const noUrlItems = [];

  for (const item of allItems) {
    if (item.url) {
      const key = item.url;
      if (!urlGroups.has(key)) {
        urlGroups.set(key, {
          url: key,
          title: item.title,
          sources: new Set(),
          summaries: {},
        });
      }
      const group = urlGroups.get(key);
      group.sources.add(item.source);
      if (item.summary) group.summaries[item.source] = item.summary;
      // Prefer longer title
      if (item.title.length > group.title.length) group.title = item.title;
    } else {
      noUrlItems.push(item);
    }
  }

  // Title-based merging: group entries with different URLs but same topic
  // Extract key terms from titles and merge if strong overlap
  function titleKey(title) {
    return title
      .toLowerCase()
      .replace(/[''""():,.\-–—]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2)
      .sort()
      .join(" ");
  }

  // Build title similarity index
  const titleIndex = new Map();
  for (const [url, group] of urlGroups) {
    const key = titleKey(group.title);
    // Find existing group with similar title (>50% word overlap)
    let merged = false;
    for (const [existingKey, existingUrl] of titleIndex) {
      const keyWords = new Set(key.split(" "));
      const existWords = new Set(existingKey.split(" "));
      const overlap = [...keyWords].filter((w) => existWords.has(w)).length;
      const shorter = Math.min(keyWords.size, existWords.size);
      if (shorter >= 2 && overlap / shorter >= 0.5) {
        // Merge into existing group
        const target = urlGroups.get(existingUrl);
        for (const src of group.sources) target.sources.add(src);
        Object.assign(target.summaries, group.summaries);
        if (group.title.length > target.title.length) target.title = group.title;
        urlGroups.delete(url);
        merged = true;
        break;
      }
    }
    if (!merged) {
      titleIndex.set(key, url);
    }
  }

  // Convert to array and calculate heat
  const signals = [];
  for (const [, group] of urlGroups) {
    signals.push({
      url: group.url,
      title: group.title,
      heat: group.sources.size,
      sources: [...group.sources],
      summaries: group.summaries,
      in_our_pipeline: false, // will be filled later
    });
  }

  // Add no-URL items as heat=1 (unless title matches an existing signal)
  for (const item of noUrlItems) {
    const key = titleKey(item.title);
    let matched = false;
    for (const signal of signals) {
      const sigKey = titleKey(signal.title);
      const keyWords = new Set(key.split(" "));
      const sigWords = new Set(sigKey.split(" "));
      const overlap = [...keyWords].filter((w) => sigWords.has(w)).length;
      const shorter = Math.min(keyWords.size, sigWords.size);
      if (shorter >= 2 && overlap / shorter >= 0.5) {
        if (!signal.sources.includes(item.source)) {
          signal.sources.push(item.source);
          signal.heat = signal.sources.length;
        }
        matched = true;
        break;
      }
    }
    if (!matched) {
      signals.push({
        url: null,
        title: item.title,
        heat: 1,
        sources: [item.source],
        summaries: item.summary ? { [item.source]: item.summary } : {},
        in_our_pipeline: false,
      });
    }
  }

  // Sort by heat desc, then title
  signals.sort((a, b) => b.heat - a.heat || a.title.localeCompare(b.title));

  return signals;
}

async function matchOurPipeline(signals, supabase) {
  // Get all source_urls from our articles
  const { data: articles } = await supabase
    .from("articles")
    .select("source_url")
    .eq("status", "published")
    .not("source_url", "is", null);

  const ourUrls = new Set();
  for (const a of articles || []) {
    const norm = normalizeUrl(a.source_url);
    if (norm) ourUrls.add(norm);
  }

  for (const signal of signals) {
    if (signal.url && ourUrls.has(signal.url)) {
      signal.in_our_pipeline = true;
    }
  }

  return signals;
}

// ── Main ───────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const dateIdx = args.indexOf("--date");
  const dateStr = dateIdx !== -1 ? args[dateIdx + 1] : null;

  // Use CST (UTC+8) so CI running at UTC 22:xx resolves to next CST day
  function todayCST() {
    const now = new Date();
    const cst = new Date(now.getTime() + 8 * 3600 * 1000);
    return new Date(cst.toISOString().slice(0, 10));
  }
  const targetDate = dateStr ? new Date(dateStr) : todayCST();
  const dateLabel = formatDate(targetDate);

  log.info(`Scraping signals for: ${dateLabel}`);

  // Scrape all sources in parallel
  const scrapers = [
    { name: "tldr", fn: () => scrapeTldr(dateLabel) },
    { name: "bensbites", fn: () => scrapeBensBites() },
    { name: "rundown", fn: () => scrapeRundown() },
    { name: "superhuman", fn: () => scrapeSuperhuman() },
    { name: "neuron", fn: () => scrapeNeuron() },
  ];

  const results = await Promise.allSettled(scrapers.map((s) => s.fn()));
  const allItems = [];
  const sourcesScraped = [];
  const sourcesFailed = [];

  for (let i = 0; i < scrapers.length; i++) {
    const { name } = scrapers[i];
    const result = results[i];
    if (result.status === "fulfilled" && result.value.length > 0) {
      allItems.push(...result.value);
      sourcesScraped.push(name);
    } else {
      const reason =
        result.status === "rejected" ? result.reason.message : "no items";
      log.warn(`[${name}] Failed: ${reason}`);
      sourcesFailed.push(name);
    }
  }

  if (sourcesScraped.length < 2) {
    log.error(`Only ${sourcesScraped.length} sources succeeded. Need ≥2 for meaningful cross-reference. Aborting.`);
    process.exit(1);
  }

  log.info(`Total raw items: ${allItems.length} from ${sourcesScraped.length} sources`);

  // Aggregate
  let signals = aggregateSignals(allItems);

  // Match against our pipeline
  const supabase = createAdminClient();
  signals = await matchOurPipeline(signals, supabase);

  // Stats
  const stats = {
    total_items: allItems.length,
    unique_topics: signals.length,
    heat_3_plus: signals.filter((s) => s.heat >= 3).length,
    heat_2: signals.filter((s) => s.heat === 2).length,
    covered_by_us: signals.filter((s) => s.in_our_pipeline).length,
    coverage_rate: signals.length
      ? +(signals.filter((s) => s.in_our_pipeline && s.heat >= 2).length /
          Math.max(signals.filter((s) => s.heat >= 2).length, 1)).toFixed(2)
      : 0,
  };

  const output = {
    date: dateLabel,
    generated_at: new Date().toISOString(),
    sources_scraped: sourcesScraped,
    sources_failed: sourcesFailed,
    signals,
    stats,
  };

  // Print summary
  log.info(`\n── Signal Summary ──────────────────────────`);
  log.info(`Sources: ${sourcesScraped.join(", ")}${sourcesFailed.length ? ` (failed: ${sourcesFailed.join(", ")})` : ""}`);
  log.info(`Unique topics: ${stats.unique_topics}`);
  log.info(`Heat ≥3: ${stats.heat_3_plus} | Heat 2: ${stats.heat_2}`);
  log.info(`Covered by us: ${stats.covered_by_us} | Coverage: ${(stats.coverage_rate * 100).toFixed(0)}%`);

  if (signals.filter((s) => s.heat >= 2).length) {
    log.info(`\nHot topics:`);
    for (const s of signals.filter((s) => s.heat >= 2)) {
      const label = s.heat >= 3 ? "🔥" : "⭐";
      const covered = s.in_our_pipeline ? " ✅" : " ❌";
      log.info(`  ${label} [${s.heat}] ${s.title}${covered} (${s.sources.join(",")})`);
    }
  }

  if (dryRun) {
    log.info("\n[DRY RUN] No file written.");
    console.log(JSON.stringify(output, null, 2));
  } else {
    // Write to data/daily-signals/
    const dir = path.join(process.cwd(), "data", "daily-signals");
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `${dateLabel}.json`);
    fs.writeFileSync(filePath, JSON.stringify(output, null, 2));
    log.success(`Written to ${filePath}`);

    // Cleanup: remove files older than 30 days
    const files = fs.readdirSync(dir);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    for (const f of files) {
      const fDate = f.replace(".json", "");
      if (fDate < formatDate(cutoff)) {
        fs.unlinkSync(path.join(dir, f));
        log.info(`Cleaned up old signal file: ${f}`);
      }
    }
  }

  log.done();
}

main().catch((e) => {
  log.error(e.message);
  process.exit(1);
});
