#!/usr/bin/env node

/**
 * Content governance: recategorize + quality assessment + spam detection.
 *
 * Modes:
 *   --audit             Report only (no DB changes, no previews)
 *   --dry-run            Preview changes per-skill
 *   --apply              Execute updates to DB
 *
 * Options:
 *   --limit N            Process only first N skills
 *   --sample N           Show N sample changes in audit mode
 *
 * Examples:
 *   node scripts/govern-skills.mjs --audit
 *   node scripts/govern-skills.mjs --dry-run --limit 100
 *   node scripts/govern-skills.mjs --apply --limit 100
 *   node scripts/govern-skills.mjs --apply
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { createAdminClient } from "./lib/supabase-admin.mjs";
import { createLogger } from "./lib/logger.mjs";
import { categorize } from "./lib/categorize.mjs";

const log = createLogger("govern");

// ── CLI args ──────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const auditMode = args.includes("--audit");
const dryRun = args.includes("--dry-run");
const applyMode = args.includes("--apply");
const limitIdx = args.indexOf("--limit");
const limitCount = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : 0;
const sampleIdx = args.indexOf("--sample");
const sampleCount = sampleIdx !== -1 ? parseInt(args[sampleIdx + 1], 10) : 20;

if (!auditMode && !dryRun && !applyMode) {
  console.log("Usage: node scripts/govern-skills.mjs [--audit | --dry-run | --apply]");
  console.log("  --audit    Report quality distribution + category changes (no DB writes)");
  console.log("  --dry-run  Preview per-skill changes");
  console.log("  --apply    Execute updates to DB");
  process.exit(1);
}

// ── Spam detection ────────────────────────────────────────────────────

const SPAM_PATTERNS = [
  /^test[-_]?\d*$/i,                       // "test", "test1", "test-123"
  /^(my|hello|foo|bar|baz)[-_]?skill$/i,   // placeholder names
  /^untitled[-_]?\d*$/i,                   // "untitled", "untitled-1"
  /^skill[-_]?(template|example|demo)$/i,  // templates
  /^aaa+|^xxx+|^zzz+/i,                   // keyboard spam
  /^asdf|^qwer/i,                          // keyboard patterns
];

/**
 * Check if a skill is spam based on name patterns.
 * Conservative: only matches clearly junk names.
 */
function isSpam(skill) {
  const name = (skill.name || "").trim();
  if (!name) return true; // empty name = spam

  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(name)) return true;
  }

  return false;
}

// ── Quality assessment ────────────────────────────────────────────────

/**
 * Assess quality tier for a skill.
 *
 * Uses content length + description length as primary signals.
 * Tags are nearly unused (95.7% have 0 tags) so not used as criteria.
 *
 * Decision tree:
 *   1. Spam → Hidden (C-tier)
 *   2. content > 2000 chars AND description > 50 chars → A (comprehensive)
 *   3. content > 200 chars AND description > 20 chars → B (adequate)
 *   4. Otherwise → C (stub)
 *
 * Target distribution: A ~35-40%, B ~45-50%, C ~10-15%
 *
 * @returns {{ qualityTier: 'A' | 'B' | 'C', isHidden: boolean, reason: string }}
 */
function assessQuality(skill) {
  // Step 1: Spam check
  if (isSpam(skill)) {
    return { qualityTier: "C", isHidden: true, reason: "spam pattern detected" };
  }

  const contentLen = (skill.content || "").trim().length;
  const descLen = (skill.description || "").trim().length;

  // Step 2: A-tier — comprehensive content
  if (contentLen > 2000 && descLen > 50) {
    return { qualityTier: "A", isHidden: false, reason: `content ${contentLen} + desc ${descLen}` };
  }

  // Step 3: B-tier — adequate content
  if (contentLen > 200 && descLen > 20) {
    return { qualityTier: "B", isHidden: false, reason: `content ${contentLen} + desc ${descLen}` };
  }

  // Step 4: C-tier — stub
  return { qualityTier: "C", isHidden: false, reason: `stub (content ${contentLen}, desc ${descLen})` };
}

// ── Fetch all skills ──────────────────────────────────────────────────

async function fetchAllSkills(supabase) {
  const PAGE_SIZE = 1000;
  const allSkills = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from("skills")
      .select("id, slug, name, tags, description, category, content, is_hidden, quality_tier")
      .order("id")
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) throw new Error(`Fetch error at offset ${offset}: ${error.message}`);
    allSkills.push(...data);
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return limitCount > 0 ? allSkills.slice(0, limitCount) : allSkills;
}

// ── Batch update ──────────────────────────────────────────────────────

async function batchUpdate(supabase, updates) {
  const CONCURRENCY = 50;
  let updated = 0;
  let errors = 0;

  for (let i = 0; i < updates.length; i += CONCURRENCY) {
    const chunk = updates.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      chunk.map(({ id, category, quality_tier, is_hidden }) =>
        supabase
          .from("skills")
          .update({ category, quality_tier, is_hidden })
          .eq("id", id),
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

// ── Report ────────────────────────────────────────────────────────────

function generateReport(skills, assessments, newCategories) {
  // Quality distribution
  const qualityDist = { A: 0, B: 0, C: 0, Hidden: 0 };
  for (const a of assessments) {
    if (a.isHidden) qualityDist.Hidden++;
    else qualityDist[a.qualityTier]++;
  }

  console.log("\n=== Quality Distribution ===");
  console.log("Tier".padEnd(10) + " | " + "Count".padStart(6) + " | " + "Percent".padStart(7));
  console.log("-".repeat(30));
  const total = skills.length;
  for (const [tier, count] of Object.entries(qualityDist)) {
    const pct = ((count / total) * 100).toFixed(1) + "%";
    console.log(tier.padEnd(10) + " | " + String(count).padStart(6) + " | " + pct.padStart(7));
  }

  // Category distribution (before vs after)
  const catBefore = {};
  const catAfter = {};
  const catChanges = [];

  for (let i = 0; i < skills.length; i++) {
    const oldCat = skills[i].category || "其他";
    const newCat = newCategories[i];
    catBefore[oldCat] = (catBefore[oldCat] || 0) + 1;
    catAfter[newCat] = (catAfter[newCat] || 0) + 1;

    if (oldCat !== newCat) {
      catChanges.push({
        slug: skills[i].slug,
        name: skills[i].name,
        from: oldCat,
        to: newCat,
      });
    }
  }

  const allCats = [...new Set([...Object.keys(catBefore), ...Object.keys(catAfter)])].sort();
  console.log("\n=== Category Distribution ===");
  console.log(
    "Category".padEnd(14) + " | " + "Before".padStart(6) + " | " + "After".padStart(6) + " | " + "Delta".padStart(6),
  );
  console.log("-".repeat(42));

  for (const cat of allCats) {
    const b = catBefore[cat] || 0;
    const a = catAfter[cat] || 0;
    const delta = a - b;
    const sign = delta >= 0 ? "+" : "";
    console.log(
      cat.padEnd(14) + " | " + String(b).padStart(6) + " | " + String(a).padStart(6) + " | " + `${sign}${delta}`.padStart(6),
    );
  }

  console.log("-".repeat(42));
  console.log(`Total skills: ${total}`);
  console.log(`Category changes: ${catChanges.length}`);

  // Problem items
  const spamItems = assessments
    .map((a, i) => ({ ...a, skill: skills[i] }))
    .filter((a) => a.isHidden);

  if (spamItems.length > 0) {
    console.log(`\n=== Hidden/Spam Items (${spamItems.length}) ===`);
    for (const item of spamItems.slice(0, 20)) {
      console.log(`  ${item.skill.name} (${item.skill.slug}) — ${item.reason}`);
    }
    if (spamItems.length > 20) {
      console.log(`  ... and ${spamItems.length - 20} more`);
    }
  }

  return { qualityDist, catChanges, spamItems };
}

// ── Main ──────────────────────────────────────────────────────────────

async function main() {
  const mode = auditMode ? "AUDIT" : dryRun ? "DRY RUN" : "APPLY";
  log.info(`Mode: ${mode}`);

  const supabase = createAdminClient();

  // 1. Fetch all skills
  log.info("Fetching skills from database...");
  const skills = await fetchAllSkills(supabase);
  log.success(`Fetched ${skills.length} skills`);

  // 2. Assess quality + recategorize
  log.info("Running quality assessment + categorization...");
  const assessments = skills.map((s) => assessQuality(s));
  const newCategories = skills.map((s) =>
    categorize(s.name, s.tags || [], s.description || ""),
  );

  // 3. Report
  const { catChanges } = generateReport(skills, assessments, newCategories);

  // 4. Show samples (audit mode)
  if (auditMode && sampleCount > 0 && catChanges.length > 0) {
    const samples = catChanges.slice(0, sampleCount);
    console.log(`\n=== Sample Category Changes (${samples.length}/${catChanges.length}) ===`);
    for (const c of samples) {
      console.log(`  ${c.name}`);
      console.log(`    ${c.from} → ${c.to}`);
    }
  }

  if (auditMode) {
    log.info("Audit complete. Use --dry-run or --apply for changes.");
    log.done();
    return;
  }

  // 5. Build update list
  const updates = [];
  for (let i = 0; i < skills.length; i++) {
    const oldCat = skills[i].category || "其他";
    const newCat = newCategories[i];
    const assessment = assessments[i];
    const oldTier = skills[i].quality_tier || null;
    const oldHidden = skills[i].is_hidden || false;

    // Only include if something changed
    const catChanged = oldCat !== newCat;
    const tierChanged = oldTier !== assessment.qualityTier;
    const hiddenChanged = oldHidden !== assessment.isHidden;

    if (catChanged || tierChanged || hiddenChanged) {
      updates.push({
        id: skills[i].id,
        category: newCat,
        quality_tier: assessment.qualityTier,
        is_hidden: assessment.isHidden,
      });
    }
  }

  if (updates.length === 0) {
    log.info("No changes needed.");
    log.done();
    return;
  }

  // 6. Dry-run: show per-skill changes
  if (dryRun) {
    console.log(`\n=== Preview Changes (${updates.length}) ===`);
    for (const u of updates.slice(0, 50)) {
      const skill = skills.find((s) => s.id === u.id);
      console.log(`  ${skill?.name || u.id}`);
      console.log(`    category: ${skill?.category || "其他"} → ${u.category}`);
      console.log(`    quality:  ${skill?.quality_tier || "null"} → ${u.quality_tier}`);
      console.log(`    hidden:   ${skill?.is_hidden || false} → ${u.is_hidden}`);
    }
    if (updates.length > 50) {
      console.log(`  ... and ${updates.length - 50} more`);
    }
    log.info("Dry run complete. Use --apply to execute changes.");
    log.done();
    return;
  }

  // 7. Apply changes
  log.info(`Updating ${updates.length} skills...`);
  const { updated, errors } = await batchUpdate(supabase, updates);
  log.success(`Updated ${updated} skills (${errors} errors)`);
  log.done();
}

main().catch((err) => {
  log.error(err.message);
  process.exit(1);
});
