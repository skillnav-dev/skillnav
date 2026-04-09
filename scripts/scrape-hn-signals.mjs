#!/usr/bin/env node

/**
 * Collect Hacker News signals: AI/LLM/dev-tool related stories.
 * Uses HN Firebase API (free, no auth needed).
 * Two-stage filter: positive keywords → negative exclusion → developer context check.
 *
 * Usage:
 *   node scripts/scrape-hn-signals.mjs            # Collect current top stories
 *   node scripts/scrape-hn-signals.mjs --dry-run   # Preview without DB write
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { createLogger } from "./lib/logger.mjs";
import { runPipeline } from "./lib/run-pipeline.mjs";
import { createAdminClient } from "./lib/supabase-admin.mjs";
import { callLLMText } from "./lib/llm.mjs";

const log = createLogger("hn-signals");

const HN_TOP_URL = "https://hacker-news.firebaseio.com/v0/topstories.json";
const HN_ITEM_URL = (id) =>
  `https://hacker-news.firebaseio.com/v0/item/${id}.json`;
const HN_ITEM_LINK = (id) => `https://news.ycombinator.com/item?id=${id}`;

const TOP_N = 500; // scan top 500 stories
const FETCH_TIMEOUT = 10_000;
const CONCURRENCY = 10;
const MAX_RESULTS = 30; // keep top 30 after filtering
const MAX_SUMMARY_BATCH = 10;

// ── Keyword Filters (from plan §3.3) ───────────────────────────────

const POSITIVE_KEYWORDS = [
  // Models & companies
  "ai", "llm", "gpt", "claude", "gemini", "anthropic", "openai", "deepmind",
  "deepseek", "mistral", "llama", "qwen", "phi",
  // Concepts
  "machine learning", "deep learning", "neural network", "transformer",
  "large language model", "foundation model", "generative ai",
  // Tools & infra
  "mcp", "agent", "rag", "vector database", "embedding", "fine-tuning",
  "fine tuning", "prompt engineering", "langchain", "llamaindex",
  "hugging face", "huggingface",
  // Dev tools
  "cursor", "copilot", "claude code", "codex", "codeium", "windsurf",
  "devin", "replit",
  // Infra
  "gpu", "cuda", "inference", "mlops", "training",
  // Embodied AI / Robotics
  "robot", "humanoid", "embodied", "manipulation", "locomotion",
];

const NEGATIVE_KEYWORDS = [
  "healthcare", "policy", "regulation", "singer", "music", "art gallery",
  "movie", "film", "tv show", "recipe", "cooking", "sports", "weather",
  "politics", "election", "lawsuit", "patent troll",
];

// Second-stage: must contain at least one developer-context word
const DEV_CONTEXT_KEYWORDS = [
  "code", "coding", "programming", "developer", "api", "sdk", "framework",
  "tool", "model", "inference", "training", "benchmark", "open source",
  "opensource", "github", "library", "package", "deploy", "pipeline",
  "server", "cli", "terminal", "ide", "editor", "plugin", "extension",
  "build", "ship", "debug", "test", "release", "architecture", "protocol",
  "token", "context window", "multimodal", "reasoning", "agentic",
  "workflow", "automation", "self-hosted", "local",
];

// ── Helpers ──────────────────────────────────────────────────────────

function getCSTDate() {
  const now = new Date();
  const cst = new Date(now.getTime() + 8 * 3600_000);
  return cst.toISOString().slice(0, 10);
}

async function fetchJSON(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Pre-compile word-boundary regexes for accurate matching
// Avoids "ai" matching "maintain", "phi" matching "philosophy", etc.
const _regexCache = new Map();
function _getKeywordRegex(kw) {
  if (!_regexCache.has(kw)) {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    _regexCache.set(kw, new RegExp(`\\b${escaped}\\b`, "i"));
  }
  return _regexCache.get(kw);
}

function matchesKeywords(text, keywords) {
  return keywords.some((kw) => _getKeywordRegex(kw).test(text));
}

function isRelevant(story) {
  const text = `${story.title || ""} ${story.text || ""}`.toLowerCase();

  // Step 1: must match positive keyword
  if (!matchesKeywords(text, POSITIVE_KEYWORDS)) return false;

  // Step 2: must NOT match negative keyword
  if (matchesKeywords(text, NEGATIVE_KEYWORDS)) return false;

  // Step 3: must contain developer context
  if (!matchesKeywords(text, DEV_CONTEXT_KEYWORDS)) return false;

  return true;
}

// ── Concurrent fetcher ──────────────────────────────────────────────

async function fetchStoriesConcurrent(ids) {
  const results = [];
  for (let i = 0; i < ids.length; i += CONCURRENCY) {
    const batch = ids.slice(i, i + CONCURRENCY);
    const items = await Promise.allSettled(
      batch.map((id) => fetchJSON(HN_ITEM_URL(id)))
    );
    for (const r of items) {
      if (r.status === "fulfilled" && r.value && r.value.type === "story") {
        results.push(r.value);
      }
    }
    if (i + CONCURRENCY < ids.length) {
      log.progress(
        Math.min(i + CONCURRENCY, ids.length),
        ids.length,
        0,
        "fetching stories"
      );
    }
  }
  log.progressEnd();
  return results;
}

// ── LLM Summary ─────────────────────────────────────────────────────

async function summarizeStories(stories) {
  if (stories.length === 0) return [];

  const texts = stories
    .map((s, i) => `[${i + 1}] ${s.title} (${s.score} points, ${s.descendants || 0} comments)`)
    .join("\n");

  const systemPrompt = `You are a Chinese tech editor. For each Hacker News story below, write a concise Chinese summary (1 sentence, max 80 chars). Keep English technical terms as-is. Output JSON array: [{"index": 1, "summary_zh": "..."}]`;

  try {
    const raw = await callLLMText(systemPrompt, `Summarize:\n\n${texts}`, 2048);
    const jsonStr = raw.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(jsonStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    log.warn(`LLM summary failed: ${e.message}`);
    return [];
  }
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const signalDate = getCSTDate();
  log.info(`Collecting HN signals for ${signalDate}`);

  // Fetch top story IDs
  log.info(`Fetching top ${TOP_N} story IDs...`);
  const allIds = await fetchJSON(HN_TOP_URL);
  const topIds = allIds.slice(0, TOP_N);

  // Fetch story details concurrently
  log.info(`Fetching ${topIds.length} story details...`);
  const stories = await fetchStoriesConcurrent(topIds);
  log.info(`Fetched ${stories.length} stories`);

  // Filter for AI/dev relevance
  const relevant = stories
    .filter(isRelevant)
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, MAX_RESULTS);

  log.info(`Filtered: ${stories.length} → ${relevant.length} AI/dev stories`);

  if (relevant.length === 0) {
    log.warn("No relevant stories found today");
    return { status: "success", summary: { scanned: stories.length, relevant: 0, upserted: 0 }, exitCode: 0 };
  }

  // LLM summarize in batches
  log.info("Generating Chinese summaries...");
  const summaryMap = new Map();
  for (let i = 0; i < relevant.length; i += MAX_SUMMARY_BATCH) {
    const batch = relevant.slice(i, i + MAX_SUMMARY_BATCH);
    const summaries = await summarizeStories(batch);
    for (const s of summaries) {
      const story = batch[s.index - 1];
      if (story) summaryMap.set(story.id, s.summary_zh);
    }
  }
  log.info(`Generated ${summaryMap.size} summaries`);

  // Build rows (validate URLs: HN stories may have external URLs or HN discussion links)
  const rows = relevant.map((s) => {
    const rawUrl = s.url || HN_ITEM_LINK(s.id);
    const url = rawUrl.startsWith("http") ? rawUrl : HN_ITEM_LINK(s.id);
    return {
      platform: "hn",
      external_id: String(s.id),
      author: s.by || null,
      author_handle: s.by || null,
      title: (s.title || "").slice(0, 500),
      content_summary: (s.title || "").slice(0, 1000),
      content_summary_zh: summaryMap.get(s.id) || null,
      url,
      score: s.score || 0,
      likes: 0,
      retweets: 0,
      comments: s.descendants || 0,
      signal_date: signalDate,
      is_hidden: false,
    };
  });

  if (dryRun) {
    log.info(`[DRY RUN] Would upsert ${rows.length} HN signals`);
    for (const r of rows.slice(0, 10)) {
      log.info(`  [${r.score}▲] ${r.title}`);
      if (r.content_summary_zh) log.info(`    → ${r.content_summary_zh}`);
    }
    return { status: "skipped", summary: { scanned: stories.length, relevant: relevant.length }, exitCode: 0 };
  }

  // Upsert — use higher score if story already exists
  const supabase = createAdminClient();
  let upserted = 0;

  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50);
    const { error } = await supabase
      .from("community_signals")
      .upsert(batch, { onConflict: "platform,external_id" });

    if (error) {
      log.error(`Upsert batch failed: ${error.message}`);
    } else {
      upserted += batch.length;
    }
  }

  log.success(`Upserted ${upserted} HN signals for ${signalDate}`);

  return {
    status: "success",
    summary: { scanned: stories.length, relevant: relevant.length, upserted },
    exitCode: 0,
  };
}

runPipeline(main, {
  logger: log,
  defaultPipeline: "hn-signals",
});
