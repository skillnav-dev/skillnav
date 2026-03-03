#!/usr/bin/env node

/**
 * One-time migration: recategorize all skills using the expanded
 * keyword scoring algorithm.
 *
 * Usage:
 *   node scripts/recategorize-skills.mjs --dry-run              # Preview only
 *   node scripts/recategorize-skills.mjs --dry-run --sample 30  # Preview + examples
 *   node scripts/recategorize-skills.mjs                        # Execute migration
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { createAdminClient } from "./lib/supabase-admin.mjs";
import { createLogger } from "./lib/logger.mjs";
import { categorize } from "./lib/categorize.mjs";

const log = createLogger("recategorize");

// --------------- CLI args ---------------

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const sampleIdx = args.indexOf("--sample");
const sampleCount = sampleIdx !== -1 ? parseInt(args[sampleIdx + 1], 10) || 20 : 0;
const limitIdx = args.indexOf("--limit");
const limitCount = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : 0;

// --------------- Fetch all skills ---------------

async function fetchAllSkills(supabase) {
  const PAGE_SIZE = 1000;
  const allSkills = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from("skills")
      .select("id, slug, name, tags, description, category")
      .order("id")
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) throw new Error(`Fetch error at offset ${offset}: ${error.message}`);
    allSkills.push(...data);
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return limitCount > 0 ? allSkills.slice(0, limitCount) : allSkills;
}

// --------------- Batch update ---------------

async function batchUpdate(supabase, updates) {
  const CONCURRENCY = 50;
  let updated = 0;
  let errors = 0;

  for (let i = 0; i < updates.length; i += CONCURRENCY) {
    const chunk = updates.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      chunk.map(({ id, category }) =>
        supabase.from("skills").update({ category }).eq("id", id),
      ),
    );

    const failed = results.filter((r) => r.error);
    errors += failed.length;
    updated += chunk.length - failed.length;

    if (failed.length > 0) {
      log.warn(`${failed.length} errors in chunk at offset ${i}`);
    }

    log.progress(
      Math.min(i + CONCURRENCY, updates.length),
      updates.length,
      errors,
      "updating",
    );
  }

  log.progressEnd();
  return { updated, errors };
}

// --------------- Report ---------------

function generateReport(skills, results) {
  const before = {};
  const after = {};
  const changes = [];

  for (let i = 0; i < skills.length; i++) {
    const oldCat = skills[i].category || "其他";
    const newCat = results[i];

    before[oldCat] = (before[oldCat] || 0) + 1;
    after[newCat] = (after[newCat] || 0) + 1;

    if (oldCat !== newCat) {
      changes.push({
        slug: skills[i].slug,
        name: skills[i].name,
        from: oldCat,
        to: newCat,
      });
    }
  }

  // Print distribution table
  const allCats = [
    ...new Set([...Object.keys(before), ...Object.keys(after)]),
  ].sort();

  console.log("\n=== Category Distribution ===");
  console.log(
    "Category".padEnd(12) +
      " | " +
      "Before".padStart(6) +
      " | " +
      "After".padStart(6) +
      " | " +
      "Delta".padStart(6),
  );
  console.log("-".repeat(40));

  for (const cat of allCats) {
    const b = before[cat] || 0;
    const a = after[cat] || 0;
    const delta = a - b;
    const sign = delta >= 0 ? "+" : "";
    console.log(
      cat.padEnd(12) +
        " | " +
        String(b).padStart(6) +
        " | " +
        String(a).padStart(6) +
        " | " +
        `${sign}${delta}`.padStart(6),
    );
  }

  const total = skills.length;
  const beforeOther = before["其他"] || 0;
  const afterOther = after["其他"] || 0;

  console.log("-".repeat(40));
  console.log(`Total skills: ${total}`);
  console.log(
    `"其他" before: ${beforeOther} (${((beforeOther / total) * 100).toFixed(1)}%)`,
  );
  console.log(
    `"其他" after:  ${afterOther} (${((afterOther / total) * 100).toFixed(1)}%)`,
  );
  console.log(`Total changes: ${changes.length}`);

  return { before, after, changes };
}

// --------------- Main ---------------

async function main() {
  if (dryRun) log.info("DRY RUN — no database changes will be made");

  const supabase = createAdminClient();

  // 1. Fetch all skills
  log.info("Fetching skills from database...");
  const skills = await fetchAllSkills(supabase);
  log.success(`Fetched ${skills.length} skills`);

  // 2. Recategorize
  log.info("Running categorization...");
  const results = skills.map((s) =>
    categorize(s.name, s.tags || [], s.description || ""),
  );

  // 3. Report
  const { changes } = generateReport(skills, results);

  // 4. Show samples
  if (sampleCount > 0 && changes.length > 0) {
    const samples = changes.slice(0, sampleCount);
    console.log(`\n=== Sample Changes (${samples.length}/${changes.length}) ===`);
    for (const c of samples) {
      console.log(`  ${c.name}`);
      console.log(`    ${c.from} → ${c.to}`);
    }
  }

  // 5. Apply changes (unless dry-run)
  if (dryRun) {
    log.info("Dry run complete. Use without --dry-run to apply changes.");
    return;
  }

  if (changes.length === 0) {
    log.info("No changes needed.");
    return;
  }

  // Build update list (only changed skills)
  const updates = [];
  for (let i = 0; i < skills.length; i++) {
    if ((skills[i].category || "其他") !== results[i]) {
      updates.push({ id: skills[i].id, category: results[i] });
    }
  }

  log.info(`Updating ${updates.length} skills...`);
  const { updated, errors } = await batchUpdate(supabase, updates);
  log.success(`Updated ${updated} skills (${errors} errors)`);
  log.done();
}

main().catch((err) => {
  log.error(err.message);
  process.exit(1);
});
