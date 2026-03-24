#!/usr/bin/env node

/**
 * Publish daily brief to configured channels.
 * Reads approved brief from DB, outputs copy-ready content, updates publication status.
 *
 * Usage:
 *   node scripts/publish-daily.mjs                   # Publish today's approved brief
 *   node scripts/publish-daily.mjs --date 2026-03-19 # Publish specific date
 *   node scripts/publish-daily.mjs --channel rss     # Publish to specific channel only
 *   node scripts/publish-daily.mjs --dry-run         # Preview without updating DB
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import { createAdminClient } from "./lib/supabase-admin.mjs";
import { createLogger } from "./lib/logger.mjs";
import { runPipeline } from "./lib/run-pipeline.mjs";
import { validateEnv } from "./lib/validate-env.mjs";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const log = createLogger("publish");

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const dateIdx = args.indexOf("--date");
  const dateStr = dateIdx !== -1 ? args[dateIdx + 1] : null;
  const channelIdx = args.indexOf("--channel");
  const channelFilter = channelIdx !== -1 ? args[channelIdx + 1] : null;

  const validChannels = ["rss", "wechat", "x", "zhihu", "xhs"];
  if (channelFilter && !validChannels.includes(channelFilter)) {
    log.error(`Invalid channel: ${channelFilter}. Valid: ${validChannels.join(", ")}`);
    return { status: "failure", summary: {}, errorMsg: `Invalid channel: ${channelFilter}`, exitCode: 1 };
  }

  const dateLabel = dateStr || formatDate(new Date());
  log.info(`Publishing brief for: ${dateLabel}`);
  log.info(`Options: dry-run=${dryRun}, channel=${channelFilter || "all"}`);

  validateEnv(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
  const supabase = createAdminClient();

  // Fetch brief
  const { data: briefs, error } = await supabase
    .from("daily_briefs")
    .select("*")
    .eq("brief_date", dateLabel)
    .limit(1);

  if (error) {
    log.error(`Query failed: ${error.message}`);
    return { status: "failure", summary: { date: dateLabel }, errorMsg: error.message, exitCode: 1 };
  }

  if (!briefs?.length) {
    log.warn(`No brief found for ${dateLabel}. Run generate-daily.mjs first.`);
    return { status: "failure", summary: { date: dateLabel }, errorMsg: "No brief found", exitCode: 1 };
  }

  const brief = briefs[0];

  if (brief.status === "draft") {
    log.warn(`Brief for ${dateLabel} is still a draft. Approve it first via Admin Dashboard.`);
    return { status: "failure", summary: { date: dateLabel }, errorMsg: "Brief is draft", exitCode: 1 };
  }

  log.info(`Brief: "${brief.title}" (status: ${brief.status})`);

  // Determine channels to publish — only include channels that have content
  const contentMap = {
    rss: true, // always available (auto-served)
    wechat: !!brief.content_wechat,
    x: !!brief.content_x,
    zhihu: !!brief.content_zhihu,
    xhs: !!brief.content_xhs,
  };
  const allChannels = Object.keys(contentMap).filter((ch) => contentMap[ch]);
  const channels = channelFilter ? [channelFilter] : allChannels;

  for (const channel of channels) {
    log.info(`\n── ${channel.toUpperCase()} ──────────────────────`);

    switch (channel) {
      case "rss": {
        // RSS is auto-served by the API route, just mark as published
        log.success("RSS is auto-served at /api/rss/daily — no manual action needed.");
        break;
      }
      case "wechat": {
        if (!brief.content_wechat) {
          log.warn("No WeChat HTML content found. Re-run generate-daily.mjs.");
          continue;
        }
        // Write to temp file for easy access
        const wechatPath = join(process.cwd(), `daily-${dateLabel}-wechat.html`);
        if (!dryRun) {
          writeFileSync(wechatPath, brief.content_wechat, "utf-8");
          log.success(`WeChat HTML written to: ${wechatPath}`);
          log.info("Open this file in browser, Ctrl+A, Ctrl+C, paste into WeChat editor.");
        } else {
          log.info("[DRY RUN] Would write WeChat HTML to: " + wechatPath);
        }
        break;
      }
      case "x": {
        if (!brief.content_x) {
          log.warn("No X thread content found. Re-run generate-daily.mjs.");
          continue;
        }
        console.log("\n" + brief.content_x + "\n");
        log.info("Copy each tweet above and post as a thread on X.");
        break;
      }
      case "zhihu": {
        if (!brief.content_zhihu) {
          log.warn("No Zhihu content found. Re-run generate-daily.mjs.");
          continue;
        }
        const zhihuPath = join(process.cwd(), `daily-${dateLabel}-zhihu.md`);
        if (!dryRun) {
          writeFileSync(zhihuPath, brief.content_zhihu, "utf-8");
          log.success(`Zhihu article written to: ${zhihuPath}`);
          log.info("Copy content and paste into Zhihu editor (supports Markdown).");
        } else {
          log.info("[DRY RUN] Would write Zhihu article to: " + zhihuPath);
        }
        break;
      }
      case "xhs": {
        if (!brief.content_xhs) {
          log.warn("No Xiaohongshu content found. Re-run generate-daily.mjs.");
          continue;
        }
        console.log("\n" + brief.content_xhs + "\n");
        log.info("Copy caption above, pair with image card, and post on Xiaohongshu.");
        break;
      }
      default:
        log.warn(`Unknown channel: ${channel}`);
        continue;
    }

    // Record publication status
    if (!dryRun) {
      const { error: pubErr } = await supabase
        .from("brief_publications")
        .upsert(
          {
            brief_id: brief.id,
            channel,
            status: channel === "rss" ? "published" : "pending",
            published_at: channel === "rss" ? new Date().toISOString() : null,
          },
          { onConflict: "brief_id,channel" }
        );

      if (pubErr) {
        log.warn(`Failed to record ${channel} publication: ${pubErr.message}`);
      }
    }
  }

  // Update brief status to published if all channels processed
  if (!dryRun && !channelFilter) {
    const { error: updateErr } = await supabase
      .from("daily_briefs")
      .update({ status: "published" })
      .eq("id", brief.id)
      .eq("status", "approved");

    if (updateErr) {
      log.warn(`Failed to update brief status: ${updateErr.message}`);
    } else {
      log.success(`Brief status updated to 'published'`);
    }
  }

  const channelsPrepared = channels.filter((ch) => ch !== "unknown");
  return {
    status: "success",
    summary: { date: dateLabel, channels_prepared: channelsPrepared },
    exitCode: 0,
  };
}

runPipeline(main, { logger: log, defaultPipeline: "publish-daily" });
