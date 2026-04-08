#!/usr/bin/env node

/**
 * Collect X/Twitter signals from 40 AI developer KOLs.
 * Fetches recent original tweets, generates Chinese summaries via LLM,
 * and upserts into community_signals table.
 *
 * Usage:
 *   node scripts/scrape-x-signals.mjs            # Collect today's signals
 *   node scripts/scrape-x-signals.mjs --dry-run   # Preview without DB write
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createLogger } from "./lib/logger.mjs";
import { runPipeline } from "./lib/run-pipeline.mjs";
import { createAdminClient } from "./lib/supabase-admin.mjs";
import { callLLMText } from "./lib/llm.mjs";
import { fetchUserTweets } from "./lib/x-client.mjs";

const log = createLogger("x-signals");
const __dirname = dirname(fileURLToPath(import.meta.url));
const KOL_LIST = JSON.parse(
  readFileSync(join(__dirname, "../config/x-kol-list.json"), "utf-8")
);

const TWEETS_PER_KOL = 3;
const BATCH_DELAY_MS = 6_000; // rate limit: free tier = 1 req per 5s, use 6s for safety
const MAX_SUMMARY_BATCH = 10; // summarize up to 10 tweets per LLM call

// ── Helpers ──────────────────────────────────────────────────────────

function getCSTDate() {
  const now = new Date();
  // CST = UTC+8
  const cst = new Date(now.getTime() + 8 * 3600_000);
  return cst.toISOString().slice(0, 10);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── LLM Summary ─────────────────────────────────────────────────────

async function summarizeTweets(tweets) {
  if (tweets.length === 0) return [];

  const tweetTexts = tweets
    .map(
      (t, i) =>
        `[${i + 1}] @${t.author_handle}: ${t.text.slice(0, 500)}`
    )
    .join("\n\n");

  const systemPrompt = `You are a Chinese tech editor. For each tweet below, write a concise Chinese summary (1-2 sentences, max 100 chars). Keep English technical terms (LLM, MCP, Agent, Claude, GPT etc.) as-is. Output JSON array: [{"index": 1, "summary_zh": "..."}]`;

  const userPrompt = `Summarize these tweets:\n\n${tweetTexts}`;

  try {
    const raw = await callLLMText(systemPrompt, userPrompt, 2048);
    // Extract JSON from response (handle markdown code blocks)
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
  log.info(`Collecting X signals for ${signalDate} (${KOL_LIST.length} KOLs)`);

  let totalFetched = 0;
  let totalErrors = 0;
  let consecutive402 = 0;
  let allTweets = [];

  for (let i = 0; i < KOL_LIST.length; i++) {
    const kol = KOL_LIST[i];
    log.progress(i + 1, KOL_LIST.length, totalErrors, `@${kol.handle}`);

    try {
      const tweets = await fetchUserTweets(kol.handle, TWEETS_PER_KOL);
      allTweets.push(...tweets);
      totalFetched += tweets.length;
      consecutive402 = 0;
    } catch (e) {
      totalErrors++;
      log.warn(`@${kol.handle} failed: ${e.message}`);

      // Early exit: 3 consecutive 402 (credits exhausted) → stop wasting time
      if (e.message.includes("402")) {
        consecutive402++;
        if (consecutive402 >= 3) {
          log.warn(`3 consecutive 402 errors — API credits exhausted, skipping remaining ${KOL_LIST.length - i - 1} KOLs`);
          break;
        }
      } else {
        consecutive402 = 0;
      }
    }

    if (i < KOL_LIST.length - 1) await sleep(BATCH_DELAY_MS);
  }
  log.progressEnd();

  log.info(`Fetched ${totalFetched} tweets from ${KOL_LIST.length - totalErrors} KOLs`);

  // LLM summarize in batches
  log.info("Generating Chinese summaries...");
  const summaryMap = new Map();
  for (let i = 0; i < allTweets.length; i += MAX_SUMMARY_BATCH) {
    const batch = allTweets.slice(i, i + MAX_SUMMARY_BATCH);
    const summaries = await summarizeTweets(batch);
    for (const s of summaries) {
      const tweet = batch[s.index - 1];
      if (tweet) summaryMap.set(tweet.id, s.summary_zh);
    }
  }
  log.info(`Generated ${summaryMap.size} summaries`);

  // Build rows for upsert
  const rows = allTweets.map((t) => ({
    platform: "x",
    external_id: t.id,
    author: t.author,
    author_handle: t.author_handle,
    title: null,
    content_summary: t.text.slice(0, 1000),
    content_summary_zh: summaryMap.get(t.id) || null,
    url: t.url,
    score: t.likes,
    likes: t.likes,
    retweets: t.retweets,
    comments: t.comments,
    signal_date: signalDate,
    is_hidden: false,
  }));

  if (dryRun) {
    log.info(`[DRY RUN] Would upsert ${rows.length} signals`);
    const top5 = rows
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    for (const r of top5) {
      log.info(`  @${r.author_handle} (${r.score}❤): ${r.content_summary.slice(0, 80)}...`);
      if (r.content_summary_zh) log.info(`    → ${r.content_summary_zh}`);
    }
    return { status: "skipped", summary: { fetched: totalFetched, errors: totalErrors }, exitCode: 0 };
  }

  // Upsert to community_signals
  const supabase = createAdminClient();
  let upserted = 0;

  // Batch upsert (Supabase supports bulk upsert)
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

  log.success(`Upserted ${upserted} X signals for ${signalDate}`);

  return {
    status: totalErrors > KOL_LIST.length / 2 ? "partial" : "success",
    summary: { fetched: totalFetched, upserted, errors: totalErrors, kols: KOL_LIST.length },
    exitCode: 0,
  };
}

runPipeline(main, {
  logger: log,
  defaultPipeline: "x-signals",
});
