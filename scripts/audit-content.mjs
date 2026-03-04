#!/usr/bin/env node
// Audit skill content quality in Supabase
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // Fetch all skills with content (paginate to bypass 1000 row limit)
  const allWithContent = [];
  const PAGE = 1000;
  let offset = 0;
  while (true) {
    const { data, error: fetchErr } = await supabase
      .from("skills")
      .select("slug, name, content")
      .not("content", "is", null)
      .range(offset, offset + PAGE - 1);
    if (fetchErr) {
      console.error("DB error:", fetchErr);
      process.exit(1);
    }
    allWithContent.push(...data);
    if (data.length < PAGE) break;
    offset += PAGE;
  }
  const error = null;

  if (error) {
    console.error("DB error:", error);
    process.exit(1);
  }

  console.log(`Total skills with content: ${allWithContent.length}\n`);

  // 1. Content length distribution
  const lengths = allWithContent.map((s) => s.content.length).sort((a, b) => a - b);
  const percentile = (p) => lengths[Math.floor(lengths.length * p)];
  const avg = Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);

  console.log("=== CONTENT LENGTH DISTRIBUTION ===");
  console.log(`  Min:  ${lengths[0]}`);
  console.log(`  P10:  ${percentile(0.1)}`);
  console.log(`  P25:  ${percentile(0.25)}`);
  console.log(`  P50:  ${percentile(0.5)}`);
  console.log(`  P75:  ${percentile(0.75)}`);
  console.log(`  P90:  ${percentile(0.9)}`);
  console.log(`  P99:  ${percentile(0.99)}`);
  console.log(`  Max:  ${lengths[lengths.length - 1]}`);
  console.log(`  Avg:  ${avg}`);

  // 2. Quality issues
  let underHundred = 0;
  let underTwoHundred = 0;
  let templateVars = 0;
  let dangerousHtml = 0;
  let truncated = 0;
  let frontmatterLeak = 0;
  let yamlLike = 0;
  let noHeading = 0;

  const issues = {
    frontmatterLeak: [],
    yamlLike: [],
    templateVars: [],
    underHundred: [],
    noHeading: [],
    truncated: [],
  };

  for (const s of allWithContent) {
    const c = s.content;
    const trimmed = c.trim();

    if (c.length < 100) {
      underHundred++;
      issues.underHundred.push({ slug: s.slug, len: c.length, preview: c.substring(0, 80) });
    }
    if (c.length < 200) underTwoHundred++;

    if (c.includes("$ARGUMENTS") || c.includes("$USER_")) {
      templateVars++;
      issues.templateVars.push(s.slug);
    }

    if (c.includes("<script") || c.includes("<iframe")) dangerousHtml++;

    if (c.includes("<!-- truncated -->")) {
      truncated++;
      issues.truncated.push(s.slug);
    }

    if (trimmed.startsWith("---")) {
      frontmatterLeak++;
      issues.frontmatterLeak.push({
        slug: s.slug,
        preview: c.substring(0, 120).replace(/\n/g, "\\n"),
      });
    }

    const first100 = c.substring(0, 100);
    if (
      first100.match(/^(name|description|version|author):\s/m) &&
      !first100.startsWith("#")
    ) {
      yamlLike++;
      issues.yamlLike.push({
        slug: s.slug,
        preview: c.substring(0, 120).replace(/\n/g, "\\n"),
      });
    }

    if (!trimmed.startsWith("#") && !trimmed.startsWith("---") && trimmed.length > 100) {
      noHeading++;
      if (issues.noHeading.length < 10) {
        issues.noHeading.push({
          slug: s.slug,
          preview: c.substring(0, 100).replace(/\n/g, "\\n"),
        });
      }
    }
  }

  console.log(`\n=== QUALITY ISSUES SUMMARY ===`);
  console.log(`  < 100 chars:       ${underHundred}`);
  console.log(`  < 200 chars:       ${underTwoHundred}`);
  console.log(`  Template vars:     ${templateVars}`);
  console.log(`  Dangerous HTML:    ${dangerousHtml}`);
  console.log(`  Truncated (>50KB): ${truncated}`);
  console.log(`  Frontmatter leak:  ${frontmatterLeak}`);
  console.log(`  YAML-like start:   ${yamlLike}`);
  console.log(`  No heading start:  ${noHeading}`);

  // 3. Detail samples
  if (issues.frontmatterLeak.length > 0) {
    console.log(`\n=== FRONTMATTER LEAK SAMPLES ===`);
    for (const s of issues.frontmatterLeak.slice(0, 5)) {
      console.log(`  ${s.slug}: "${s.preview}"`);
    }
  }

  if (issues.yamlLike.length > 0) {
    console.log(`\n=== YAML-LIKE START SAMPLES ===`);
    for (const s of issues.yamlLike.slice(0, 5)) {
      console.log(`  ${s.slug}: "${s.preview}"`);
    }
  }

  if (issues.noHeading.length > 0) {
    console.log(`\n=== NO HEADING START SAMPLES ===`);
    for (const s of issues.noHeading.slice(0, 10)) {
      console.log(`  ${s.slug}: "${s.preview}"`);
    }
  }

  if (issues.underHundred.length > 0) {
    console.log(`\n=== VERY SHORT CONTENT (<100 chars) ===`);
    for (const s of issues.underHundred.slice(0, 10)) {
      console.log(`  ${s.slug} (${s.len} chars): "${s.preview}"`);
    }
  }

  if (issues.truncated.length > 0) {
    console.log(`\n=== TRUNCATED CONTENT ===`);
    for (const s of issues.truncated) {
      console.log(`  ${s}`);
    }
  }

  // 4. Check NULL content count
  const { count: nullCount } = await supabase
    .from("skills")
    .select("slug", { count: "exact", head: true })
    .is("content", null);
  console.log(`\n=== NULL CONTENT: ${nullCount} ===`);
}

main();
