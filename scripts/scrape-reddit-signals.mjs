#!/usr/bin/env node

/**
 * Collect Reddit signals from AI/developer subreddits.
 * Uses Reddit public .json endpoints (no API key needed).
 * Two-stage filter: positive keywords → negative exclusion → developer context check.
 *
 * Usage:
 *   node scripts/scrape-reddit-signals.mjs            # Collect current hot posts
 *   node scripts/scrape-reddit-signals.mjs --dry-run   # Preview without DB write
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { createLogger } from "./lib/logger.mjs";
import { runPipeline } from "./lib/run-pipeline.mjs";
import { createAdminClient } from "./lib/supabase-admin.mjs";
import { callLLMText } from "./lib/llm.mjs";

const log = createLogger("reddit-signals");

// AI/developer subreddits to monitor
const SUBREDDITS = [
  "MachineLearning",
  "LocalLLaMA",
  "artificial",
  "ClaudeAI",
  "robotics",
  "reinforcementlearning",
  "ChatGPT",
  "singularity",
  "LangChain",
  "computerscience",
];

const POSTS_PER_SUB = 25; // top 25 hot posts per subreddit
const FETCH_TIMEOUT = 10_000;
const REQUEST_DELAY = 2_500; // 2.5s between requests to avoid 429
const MAX_RESULTS = 30; // keep top 30 after filtering + dedup
const MAX_SUMMARY_BATCH = 10;
const USER_AGENT = "skillnav-bot/1.0 (AI developer news aggregator)";

// ── Keyword Filters (shared with HN scraper) ───────────────────────

const POSITIVE_KEYWORDS = [
  "ai", "llm", "gpt", "claude", "gemini", "anthropic", "openai", "deepmind",
  "deepseek", "mistral", "llama", "qwen", "phi",
  "machine learning", "deep learning", "neural network", "transformer",
  "large language model", "foundation model", "generative ai",
  "mcp", "agent", "rag", "vector database", "embedding", "fine-tuning",
  "fine tuning", "prompt engineering", "langchain", "llamaindex",
  "hugging face", "huggingface",
  "cursor", "copilot", "claude code", "codex", "codeium", "windsurf",
  "devin", "replit",
  "gpu", "cuda", "inference", "mlops", "training",
];

const NEGATIVE_KEYWORDS = [
  "healthcare", "policy", "regulation", "singer", "music", "art gallery",
  "movie", "film", "tv show", "recipe", "cooking", "sports", "weather",
  "politics", "election", "lawsuit", "patent troll",
];

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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

function isRelevant(post) {
  const text = `${post.title || ""} ${post.selftext || ""}`.toLowerCase();
  if (!matchesKeywords(text, POSITIVE_KEYWORDS)) return false;
  if (matchesKeywords(text, NEGATIVE_KEYWORDS)) return false;
  if (!matchesKeywords(text, DEV_CONTEXT_KEYWORDS)) return false;
  return true;
}

// ── Fetch subreddit hot posts ───────────────────────────────────────

async function fetchSubreddit(subreddit) {
  const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=${POSTS_PER_SUB}&raw_json=1`;
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(FETCH_TIMEOUT),
  });

  if (res.status === 429) {
    log.warn(`Rate limited on r/${subreddit}, skipping`);
    return [];
  }

  const ctype = res.headers.get("content-type") || "";

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`r/${subreddit} HTTP ${res.status} [${ctype}] body=${body.slice(0, 200).replace(/\s+/g, " ")}`);
  }

  // Read body as text first so we can include it in the error message if JSON parse fails
  // (Reddit block pages sometimes return 200 with HTML content)
  const bodyText = await res.text();
  let data;
  try {
    data = JSON.parse(bodyText);
  } catch {
    throw new Error(
      `r/${subreddit} 200 but non-JSON [${ctype}] body=${bodyText.slice(0, 200).replace(/\s+/g, " ")}`
    );
  }
  const children = data?.data?.children || [];

  return children
    .filter((c) => c.kind === "t3" && !c.data.stickied) // t3 = link post, skip stickied
    .map((c) => c.data);
}

// ── LLM Summary ─────────────────────────────────────────────────────

async function summarizePosts(posts) {
  if (posts.length === 0) return [];

  const texts = posts
    .map((p, i) => `[${i + 1}] ${p.title} (${p.score} upvotes, ${p.num_comments} comments, r/${p.subreddit})`)
    .join("\n");

  const systemPrompt = `You are a Chinese tech editor. For each Reddit post below, write a concise Chinese summary (1 sentence, max 80 chars). Keep English technical terms as-is. Output JSON array: [{"index": 1, "summary_zh": "..."}]`;

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
  log.info(`Collecting Reddit signals for ${signalDate} (${SUBREDDITS.length} subreddits)`);

  // Fetch posts from all subreddits with rate-limit delay
  const allPosts = [];
  let errors = 0;
  const subredditsFailed = [];

  for (let i = 0; i < SUBREDDITS.length; i++) {
    const sub = SUBREDDITS[i];
    try {
      const posts = await fetchSubreddit(sub);
      allPosts.push(...posts);
      log.progress(i + 1, SUBREDDITS.length, errors, `r/${sub} (${posts.length})`);
    } catch (e) {
      errors++;
      subredditsFailed.push(sub);
      log.warn(`r/${sub} failed: ${e.message}`);
    }
    // Rate limit: wait between requests
    if (i < SUBREDDITS.length - 1) await sleep(REQUEST_DELAY);
  }
  log.progressEnd();

  log.info(`Fetched ${allPosts.length} posts from ${SUBREDDITS.length} subreddits (errors=${errors})`);

  // Derive pipeline status: all-failed → failed, some-failed → partial, all-ok → success
  const allFailed = errors === SUBREDDITS.length;
  const someFailed = errors > 0 && errors < SUBREDDITS.length;
  const baseStatus = allFailed ? "failed" : someFailed ? "partial" : "success";

  // Dedup by post ID
  const seen = new Set();
  const uniquePosts = allPosts.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });

  // Filter for AI/dev relevance, sort by score
  const relevant = uniquePosts
    .filter(isRelevant)
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, MAX_RESULTS);

  log.info(`Filtered: ${uniquePosts.length} → ${relevant.length} AI/dev posts`);

  if (relevant.length === 0) {
    log.warn("No relevant posts found today");
    return {
      status: baseStatus,
      summary: { scanned: uniquePosts.length, relevant: 0, upserted: 0, errors, subredditsFailed },
      exitCode: 0,
    };
  }

  // LLM summarize in batches
  log.info("Generating Chinese summaries...");
  const summaryMap = new Map();
  for (let i = 0; i < relevant.length; i += MAX_SUMMARY_BATCH) {
    const batch = relevant.slice(i, i + MAX_SUMMARY_BATCH);
    const summaries = await summarizePosts(batch);
    for (const s of summaries) {
      const post = batch[s.index - 1];
      if (post) summaryMap.set(post.id, s.summary_zh);
    }
  }
  log.info(`Generated ${summaryMap.size} summaries`);

  // Build rows
  const rows = relevant.map((p) => {
    const url = p.url && !p.is_self
      ? p.url // external link posts
      : `https://www.reddit.com${p.permalink}`;
    return {
      platform: "reddit",
      external_id: p.id,
      author: p.author || null,
      author_handle: p.author || null,
      title: (p.title || "").slice(0, 500),
      content_summary: (p.title || "").slice(0, 1000),
      content_summary_zh: summaryMap.get(p.id) || null,
      url,
      score: p.score || 0,
      likes: p.ups || 0,
      retweets: 0,
      comments: p.num_comments || 0,
      signal_date: signalDate,
      is_hidden: false,
    };
  });

  if (dryRun) {
    log.info(`[DRY RUN] Would upsert ${rows.length} Reddit signals`);
    for (const r of rows.slice(0, 10)) {
      log.info(`  [${r.score}▲] ${r.title}`);
      if (r.content_summary_zh) log.info(`    → ${r.content_summary_zh}`);
    }
    return { status: "skipped", summary: { scanned: uniquePosts.length, relevant: relevant.length }, exitCode: 0 };
  }

  // Upsert
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

  log.success(`Upserted ${upserted} Reddit signals for ${signalDate}`);

  return {
    status: baseStatus,
    summary: { scanned: uniquePosts.length, relevant: relevant.length, upserted, errors, subredditsFailed },
    exitCode: 0,
  };
}

runPipeline(main, {
  logger: log,
  defaultPipeline: "reddit-signals",
});
