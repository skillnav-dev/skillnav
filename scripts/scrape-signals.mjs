#!/usr/bin/env node

/**
 * Fetch daily AI newsletter content from 5 sources.
 * Extracts plain text for LLM-based editorial curation in generate-daily.
 * Output: data/daily-newsletters/YYYY-MM-DD.json
 *
 * Usage:
 *   node scripts/scrape-signals.mjs                  # Fetch today's newsletters
 *   node scripts/scrape-signals.mjs --date 2026-03-19 # Specific date
 *   node scripts/scrape-signals.mjs --dry-run         # Preview, don't write file
 */

import { createLogger } from "./lib/logger.mjs";
import { runPipeline } from "./lib/run-pipeline.mjs";
import fs from "fs";
import path from "path";

const log = createLogger("signals");

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const BROWSER_HEADERS = {
  "User-Agent": BROWSER_UA,
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
};
const FETCH_TIMEOUT = 30_000;
const MAX_TEXT_LENGTH = 5000;

// ── Helpers ────────────────────────────────────────────────────────

function formatDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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

function htmlToText(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|h[1-6]|li|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n/g, "\n")
    .trim();
}

function truncate(text, max = MAX_TEXT_LENGTH) {
  if (text.length <= max) return text;
  // Cut at last sentence boundary before max
  const cut = text.lastIndexOf(". ", max);
  return cut > max * 0.6 ? text.slice(0, cut + 1) : text.slice(0, max);
}

// ── Source Fetchers ────────────────────────────────────────────────

async function fetchTldr(dateStr) {
  const html = await fetchWithTimeout(`https://tldr.tech/ai/${dateStr}`);
  // Reject landing/redirect pages (no newsletter-html blocks = not the actual issue)
  if (!html.includes("newsletter-html")) {
    throw new Error("Issue not published yet");
  }
  const text = htmlToText(html);
  if (text.length < 300) throw new Error("Content too short, likely not a real issue");
  return { name: "tldr", label: "TLDR AI", url: `https://tldr.tech/ai/${dateStr}`, text: truncate(text) };
}

async function fetchBensBites() {
  const rss = await fetchWithTimeout("https://www.bensbites.com/feed");
  const linkMatch = rss.match(/<item>[\s\S]*?<link>(https:\/\/www\.bensbites\.com\/p\/[^<]+)<\/link>/);
  if (!linkMatch) throw new Error("No recent post in RSS");
  const postUrl = linkMatch[1];
  const html = await fetchWithTimeout(postUrl, { headers: BROWSER_HEADERS });
  const text = htmlToText(html);
  return { name: "bensbites", label: "Ben's Bites", url: postUrl, text: truncate(text) };
}

async function fetchRundown() {
  const archiveHtml = await fetchWithTimeout("https://www.therundown.ai/archive", { headers: BROWSER_HEADERS });
  const slugMatch = archiveHtml.match(/href="\/p\/([^"]+)"/);
  if (!slugMatch) throw new Error("No post slug found");
  const postUrl = `https://www.therundown.ai/p/${slugMatch[1]}`;
  const html = await fetchWithTimeout(postUrl, { headers: BROWSER_HEADERS });
  const text = htmlToText(html);
  return { name: "rundown", label: "The Rundown AI", url: postUrl, text: truncate(text) };
}

async function fetchBeehiiv(baseUrl, name, label) {
  const html = await fetchWithTimeout(baseUrl, { headers: BROWSER_HEADERS });

  // Try extracting post data from embedded JSON (richer content)
  const postsIdx = html.indexOf('"posts":');
  const bracketStart = postsIdx !== -1 ? html.indexOf("[", postsIdx) : -1;
  let postsJson = null;
  if (bracketStart !== -1) {
    let depth = 0;
    for (let i = bracketStart; i < html.length; i++) {
      if (html[i] === "[") depth++;
      if (html[i] === "]") { depth--; if (depth === 0) { postsJson = html.slice(bracketStart, i + 1); break; } }
    }
  }

  if (postsJson) {
    try {
      const posts = JSON.parse(postsJson);
      const lines = [];
      for (const post of posts.slice(0, 3)) {
        const title = post.web_title || post.meta_default_title || "";
        const subtitle = post.web_subtitle || post.meta_default_description || "";
        if (title) lines.push(`${title}\n${subtitle}`);
      }
      if (lines.length) {
        return { name, label, url: baseUrl, text: truncate(lines.join("\n\n")) };
      }
    } catch { /* fall through to HTML extraction */ }
  }

  // Fallback: extract from full page HTML
  const text = htmlToText(html);
  return { name, label, url: baseUrl, text: truncate(text) };
}

async function fetchSuperhuman() {
  return fetchBeehiiv("https://www.superhuman.ai/", "superhuman", "Superhuman AI");
}

async function fetchNeuron() {
  return fetchBeehiiv("https://www.theneurondaily.com/", "neuron", "The Neuron");
}

// ── Main ───────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const dateIdx = args.indexOf("--date");
  const dateStr = dateIdx !== -1 ? args[dateIdx + 1] : null;

  function todayCST() {
    const now = new Date();
    const cst = new Date(now.getTime() + 8 * 3600 * 1000);
    return new Date(cst.toISOString().slice(0, 10));
  }
  const targetDate = dateStr ? new Date(dateStr) : todayCST();
  const dateLabel = formatDate(targetDate);

  log.info(`Fetching newsletters for: ${dateLabel}`);

  const fetchers = [
    { name: "tldr", fn: () => fetchTldr(dateLabel) },
    { name: "bensbites", fn: () => fetchBensBites() },
    { name: "rundown", fn: () => fetchRundown() },
    { name: "superhuman", fn: () => fetchSuperhuman() },
    { name: "neuron", fn: () => fetchNeuron() },
  ];

  const results = await Promise.allSettled(fetchers.map((f) => f.fn()));
  const sources = [];
  const sourcesFailed = [];

  for (let i = 0; i < fetchers.length; i++) {
    const { name } = fetchers[i];
    const result = results[i];
    if (result.status === "fulfilled" && result.value.text.length > 100) {
      sources.push(result.value);
      log.info(`[${name}] ${result.value.text.length} chars`);
    } else {
      const reason = result.status === "rejected" ? result.reason.message : "content too short";
      log.warn(`[${name}] Failed: ${reason}`);
      sourcesFailed.push(name);
    }
  }

  if (sources.length < 2) {
    log.error(`Only ${sources.length} sources succeeded. Need >= 2. Aborting.`);
    return {
      status: "failure",
      summary: { sources_ok: sources.length, sources_failed: sourcesFailed.length },
      errorMsg: `Only ${sources.length}/5 sources succeeded`,
      exitCode: 1,
    };
  }

  const output = {
    date: dateLabel,
    generated_at: new Date().toISOString(),
    sources: sources.map(({ name, label, url, text }) => ({ name, label, url, text })),
    sources_failed: sourcesFailed,
  };

  log.info(`\n── Summary ──────────────────────────────────`);
  log.info(`Sources: ${sources.map((s) => s.name).join(", ")}${sourcesFailed.length ? ` (failed: ${sourcesFailed.join(", ")})` : ""}`);
  log.info(`Total text: ${sources.reduce((sum, s) => sum + s.text.length, 0)} chars`);

  if (dryRun) {
    log.info("\n[DRY RUN] No file written.");
    for (const s of sources) {
      log.info(`\n── ${s.label} (${s.text.length} chars) ──`);
      console.log(s.text.slice(0, 500) + "...\n");
    }
  } else {
    const dir = path.join(process.cwd(), "data", "daily-newsletters");
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `${dateLabel}.json`);
    fs.writeFileSync(filePath, JSON.stringify(output, null, 2));
    log.success(`Written to ${filePath}`);

    // Cleanup files older than 30 days
    const files = fs.readdirSync(dir);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    for (const f of files) {
      const fDate = f.replace(".json", "");
      if (fDate < formatDate(cutoff)) {
        fs.unlinkSync(path.join(dir, f));
        log.info(`Cleaned up: ${f}`);
      }
    }
  }

  const totalChars = sources.reduce((s, x) => s + x.text.length, 0);
  return {
    status: sourcesFailed.length > 0 ? "partial" : "success",
    summary: {
      sources_ok: sources.length,
      sources_failed: sourcesFailed.length,
      total_chars: totalChars,
    },
    errorMsg:
      sourcesFailed.length > 0
        ? `Failed: ${sourcesFailed.join(", ")}`
        : null,
    exitCode: 0,
  };
}

runPipeline(main, { logger: log, defaultPipeline: "scrape-signals" });
