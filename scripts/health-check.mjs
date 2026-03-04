#!/usr/bin/env node

/**
 * Data health check script.
 * Connects to Supabase and reports on data quality metrics.
 * Outputs a Markdown report to GitHub Actions Job Summary.
 *
 * Usage:
 *   node scripts/health-check.mjs
 *
 * Exit codes:
 *   0 - All checks passed
 *   1 - Data anomaly detected (e.g. unusually low counts)
 *   2 - Fatal error (DB connection failure)
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import { createAdminClient } from "./lib/supabase-admin.mjs";
import { createLogger } from "./lib/logger.mjs";
import { validateEnv } from "./lib/validate-env.mjs";

const log = createLogger("health");

// Minimum thresholds for data anomaly detection
const MIN_SKILLS = 100;
const MIN_ARTICLES = 5;

async function main() {
  validateEnv(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);

  const supabase = createAdminClient();
  const warnings = [];

  // 1. DB connection test
  log.info("Testing database connection...");
  const { error: connError } = await supabase.rpc("version").maybeSingle();
  if (connError) {
    // Fallback: try a simple query if rpc('version') is not available
    const { error: fallbackError } = await supabase
      .from("skills")
      .select("slug")
      .limit(1);
    if (fallbackError) {
      log.error(`Database connection failed: ${fallbackError.message}`);
      process.exit(2);
    }
  }
  log.success("Database connection OK");

  // 2. Skills total count
  const { count: skillsTotal, error: skillsErr } = await supabase
    .from("skills")
    .select("*", { count: "exact", head: true });
  if (skillsErr) {
    log.error(`Failed to count skills: ${skillsErr.message}`);
    process.exit(2);
  }

  // 3. Articles total count
  const { count: articlesTotal, error: articlesErr } = await supabase
    .from("articles")
    .select("*", { count: "exact", head: true });
  if (articlesErr) {
    log.error(`Failed to count articles: ${articlesErr.message}`);
    process.exit(2);
  }

  // 4. Content coverage (skills with content)
  const { count: skillsWithContent } = await supabase
    .from("skills")
    .select("*", { count: "exact", head: true })
    .not("content", "is", null)
    .neq("content", "");

  // 5. Translation coverage (skills with content_zh out of those with content)
  const { count: skillsWithContentZh } = await supabase
    .from("skills")
    .select("*", { count: "exact", head: true })
    .not("content_zh", "is", null)
    .neq("content_zh", "");

  // 6. Articles translation coverage
  const { count: articlesWithContentZh } = await supabase
    .from("articles")
    .select("*", { count: "exact", head: true })
    .not("content_zh", "is", null)
    .neq("content_zh", "");

  // 7. Recent activity (7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const { count: skillsRecent7d } = await supabase
    .from("skills")
    .select("*", { count: "exact", head: true })
    .gte("created_at", sevenDaysAgo);

  const { count: articlesRecent7d } = await supabase
    .from("articles")
    .select("*", { count: "exact", head: true })
    .gte("created_at", sevenDaysAgo);

  // 8. Recent activity (30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const { count: skillsRecent30d } = await supabase
    .from("skills")
    .select("*", { count: "exact", head: true })
    .gte("created_at", thirtyDaysAgo);

  const { count: articlesRecent30d } = await supabase
    .from("articles")
    .select("*", { count: "exact", head: true })
    .gte("created_at", thirtyDaysAgo);

  // 9. Skills category distribution
  const { data: categoryData } = await supabase
    .from("skills")
    .select("category")
    .not("category", "is", null);

  const categoryDist = {};
  if (categoryData) {
    for (const row of categoryData) {
      const cat = row.category || "uncategorized";
      categoryDist[cat] = (categoryDist[cat] || 0) + 1;
    }
  }

  // Calculate percentages
  const contentPct = skillsTotal > 0
    ? ((skillsWithContent / skillsTotal) * 100).toFixed(1)
    : "0.0";
  const contentZhPct = skillsWithContent > 0
    ? ((skillsWithContentZh / skillsWithContent) * 100).toFixed(1)
    : "0.0";
  const articleZhPct = articlesTotal > 0
    ? ((articlesWithContentZh / articlesTotal) * 100).toFixed(1)
    : "0.0";

  // Check for anomalies
  if (skillsTotal < MIN_SKILLS) {
    warnings.push(`Skills count (${skillsTotal}) is below threshold (${MIN_SKILLS})`);
  }
  if (articlesTotal < MIN_ARTICLES) {
    warnings.push(`Articles count (${articlesTotal}) is below threshold (${MIN_ARTICLES})`);
  }

  // Build report
  const report = [
    "## Data Health Check Report",
    "",
    `> Generated at ${new Date().toISOString()}`,
    "",
    "### Overview",
    "",
    "| Metric | Value |",
    "|--------|-------|",
    `| Skills (total) | ${skillsTotal} |`,
    `| Articles (total) | ${articlesTotal} |`,
    `| Content coverage (skills) | ${skillsWithContent}/${skillsTotal} (${contentPct}%) |`,
    `| Translation coverage (skills) | ${skillsWithContentZh}/${skillsWithContent} (${contentZhPct}%) |`,
    `| Translation coverage (articles) | ${articlesWithContentZh}/${articlesTotal} (${articleZhPct}%) |`,
    "",
    "### Recent Activity",
    "",
    "| Period | New Skills | New Articles |",
    "|--------|-----------|-------------|",
    `| Last 7 days | ${skillsRecent7d} | ${articlesRecent7d} |`,
    `| Last 30 days | ${skillsRecent30d} | ${articlesRecent30d} |`,
    "",
    "### Category Distribution",
    "",
    "| Category | Count |",
    "|----------|-------|",
    ...Object.entries(categoryDist)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, count]) => `| ${cat} | ${count} |`),
  ];

  if (warnings.length > 0) {
    report.push("", "### Warnings", "");
    for (const w of warnings) {
      report.push(`- ⚠️ ${w}`);
    }
  }

  const reportText = report.join("\n");
  log.summary(reportText);
  log.done();

  if (warnings.length > 0) {
    log.warn(`${warnings.length} warning(s) detected`);
    process.exit(1);
  }
}

main().catch((e) => {
  log.error(e.message);
  process.exit(2);
});
