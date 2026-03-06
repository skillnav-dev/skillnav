#!/usr/bin/env node

/**
 * Article content governance: audit + LLM relevance scoring + status updates.
 *
 * Modes:
 *   --audit              Report distribution (no DB changes)
 *   --dry-run             Preview changes per-article
 *   --apply               Execute updates to DB
 *
 * Options:
 *   --limit N             Process only first N articles for scoring
 *   --score-only          Only set relevance_score, don't change status
 *
 * Examples:
 *   node scripts/govern-articles.mjs --audit
 *   node scripts/govern-articles.mjs --dry-run --limit 50
 *   node scripts/govern-articles.mjs --apply
 *   node scripts/govern-articles.mjs --apply --score-only
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { createAdminClient } from "./lib/supabase-admin.mjs";
import { createLogger } from "./lib/logger.mjs";
import { scoreArticleRelevance, getProviderInfo } from "./lib/llm.mjs";
import { withRetry } from "./lib/retry.mjs";

const log = createLogger("govern-articles");

// ── CLI args ──────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const auditMode = args.includes("--audit");
const dryRun = args.includes("--dry-run");
const applyMode = args.includes("--apply");
const scoreOnly = args.includes("--score-only");
const limitIdx = args.indexOf("--limit");
const limitCount = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : 0;

if (!auditMode && !dryRun && !applyMode) {
  console.log("Usage: node scripts/govern-articles.mjs [--audit | --dry-run | --apply]");
  console.log("  --audit       Report status/score distribution (no DB writes)");
  console.log("  --dry-run     Preview scoring + status changes");
  console.log("  --apply       Execute updates to DB");
  console.log("  --score-only  Only set relevance_score, don't change status");
  console.log("  --limit N     Process first N unscored articles");
  process.exit(1);
}

// ── Rate limiter ──────────────────────────────────────────────────────

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

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

const llmThrottle = createRateLimiter(10);

// ── Fetch all articles ────────────────────────────────────────────────

async function fetchAllArticles(supabase) {
  const PAGE_SIZE = 1000;
  const all = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from("articles")
      .select("id, slug, title, summary, content, status, relevance_score")
      .order("published_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) throw new Error(`Fetch error at offset ${offset}: ${error.message}`);
    all.push(...data);
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return all;
}

// ── Status from score ─────────────────────────────────────────────────

function statusFromScore(score) {
  if (score >= 3) return "published";
  if (score === 2) return "draft";
  return "hidden";
}

// ── Audit report ──────────────────────────────────────────────────────

function generateReport(articles) {
  const total = articles.length;

  // Status distribution
  const statusDist = { published: 0, draft: 0, hidden: 0 };
  for (const a of articles) {
    statusDist[a.status || "published"]++;
  }

  console.log("\n=== Status Distribution ===");
  console.log("Status".padEnd(12) + " | " + "Count".padStart(6) + " | " + "Percent".padStart(7));
  console.log("-".repeat(32));
  for (const [status, count] of Object.entries(statusDist)) {
    const pct = ((count / total) * 100).toFixed(1) + "%";
    console.log(status.padEnd(12) + " | " + String(count).padStart(6) + " | " + pct.padStart(7));
  }

  // Relevance score distribution
  const scoreDist = { unscored: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const a of articles) {
    if (a.relevance_score == null) scoreDist.unscored++;
    else scoreDist[a.relevance_score]++;
  }

  console.log("\n=== Relevance Score Distribution ===");
  console.log("Score".padEnd(12) + " | " + "Count".padStart(6) + " | " + "Percent".padStart(7));
  console.log("-".repeat(32));
  for (const [score, count] of Object.entries(scoreDist)) {
    const pct = ((count / total) * 100).toFixed(1) + "%";
    console.log(String(score).padEnd(12) + " | " + String(count).padStart(6) + " | " + pct.padStart(7));
  }

  // Content length distribution
  const lenBuckets = { "<300": 0, "300-500": 0, "500-2K": 0, "2K-10K": 0, ">10K": 0 };
  for (const a of articles) {
    const len = (a.content || "").length;
    if (len < 300) lenBuckets["<300"]++;
    else if (len < 500) lenBuckets["300-500"]++;
    else if (len < 2000) lenBuckets["500-2K"]++;
    else if (len < 10000) lenBuckets["2K-10K"]++;
    else lenBuckets[">10K"]++;
  }

  console.log("\n=== Content Length Distribution ===");
  console.log("Length".padEnd(12) + " | " + "Count".padStart(6) + " | " + "Percent".padStart(7));
  console.log("-".repeat(32));
  for (const [bucket, count] of Object.entries(lenBuckets)) {
    const pct = ((count / total) * 100).toFixed(1) + "%";
    console.log(bucket.padEnd(12) + " | " + String(count).padStart(6) + " | " + pct.padStart(7));
  }

  console.log("-".repeat(32));
  console.log(`Total articles: ${total}`);
  console.log(`Unscored: ${scoreDist.unscored}`);

  return { statusDist, scoreDist, total };
}

// ── Main ──────────────────────────────────────────────────────────────

async function main() {
  const mode = auditMode ? "AUDIT" : dryRun ? "DRY RUN" : "APPLY";
  log.info(`Mode: ${mode}${scoreOnly ? " (score-only)" : ""}`);

  const supabase = createAdminClient();

  // 1. Fetch all articles
  log.info("Fetching articles from database...");
  const articles = await fetchAllArticles(supabase);
  log.success(`Fetched ${articles.length} articles`);

  // 2. Audit report
  generateReport(articles);

  if (auditMode) {
    log.info("Audit complete. Use --dry-run or --apply for changes.");
    log.done();
    return;
  }

  // 3. Find articles needing scoring (relevance_score IS NULL AND status = 'published')
  let candidates = articles.filter(
    (a) => a.relevance_score == null && a.status === "published"
  );

  if (limitCount > 0) {
    candidates = candidates.slice(0, limitCount);
  }

  if (candidates.length === 0) {
    log.info("No articles need scoring.");
    log.done();
    return;
  }

  if (!dryRun) {
    const { name, model } = getProviderInfo();
    log.info(`LLM provider: ${name} (${model})`);
  }

  log.info(`Scoring ${candidates.length} articles...`);

  let scored = 0;
  let statusChanged = 0;
  let errors = 0;

  for (let i = 0; i < candidates.length; i++) {
    const article = candidates[i];
    const label = (article.title || article.slug).slice(0, 60);

    try {
      let relevanceScore;
      let reason;

      if (dryRun) {
        // Estimate based on content length as a rough proxy
        const len = (article.content || "").length;
        relevanceScore = len > 5000 ? 4 : len > 2000 ? 3 : 2;
        reason = `estimated (content ${len} chars)`;
      } else {
        await llmThrottle();
        const result = await withRetry(
          () => scoreArticleRelevance({
            title: article.title || "",
            summary: article.summary || "",
            content: article.content || "",
          }),
          { label }
        );
        relevanceScore = result.relevanceScore;
        reason = result.reason;
      }

      const newStatus = statusFromScore(relevanceScore);
      const statusWillChange = newStatus !== article.status;

      if (dryRun) {
        const statusInfo = statusWillChange
          ? ` | status: ${article.status} → ${newStatus}`
          : "";
        log.info(`[DRY RUN] ${label} → score=${relevanceScore} (${reason})${statusInfo}`);
        scored++;
        if (statusWillChange) statusChanged++;
      } else {
        const updateData = { relevance_score: relevanceScore };
        if (!scoreOnly && statusWillChange) {
          updateData.status = newStatus;
        }

        const { error } = await supabase
          .from("articles")
          .update(updateData)
          .eq("id", article.id);

        if (error) {
          log.error(`Update failed for "${label}": ${error.message}`);
          errors++;
        } else {
          const statusInfo = !scoreOnly && statusWillChange
            ? ` | status: ${article.status} → ${newStatus}`
            : "";
          log.success(`Scored: ${label} → ${relevanceScore} (${reason})${statusInfo}`);
          scored++;
          if (!scoreOnly && statusWillChange) statusChanged++;
        }
      }
    } catch (e) {
      log.error(`Scoring failed for "${label}": ${e.message}`);
      errors++;
    }

    log.progress(i + 1, candidates.length, errors, label);
  }

  log.progressEnd();

  // Summary
  log.success("\n=== Governance Summary ===");
  log.success(`Candidates: ${candidates.length} | Scored: ${scored} | Status changed: ${statusChanged} | Errors: ${errors}`);
  if (dryRun) log.info("[DRY RUN] No records were updated.");
  if (scoreOnly) log.info("[SCORE-ONLY] Status was not modified.");
  log.done();

  if (errors > 0) process.exit(1);
}

main().catch((err) => {
  log.error(err.message);
  process.exit(1);
});
