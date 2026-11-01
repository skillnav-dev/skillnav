#!/usr/bin/env node

/**
 * Point published Skills at their own folder instead of the whole repo.
 *
 * The install command (src/lib/skill-install.ts) adds `--skill <folder>` only
 * when github_url points inside the repo (/tree/<ref>/<path>). Rows that store
 * the bare repo URL make `npx skills add` install every skill in that repo.
 *
 * For each published skill whose github_url is a bare repo URL, list the
 * repo's SKILL.md files and rewrite github_url to a folder when
 *   - the row's name (or slug) is exactly one folder's name, or
 *   - the repo holds a single skill, in a subfolder.
 * Rows that stand for a whole skill pack (many folders, none named like the
 * row) keep the repo URL on purpose: installing the pack is what they offer.
 * Template folders are ignored.
 *
 * Usage:
 *   node scripts/backfill-skill-source-paths.mjs            # Dry run (default)
 *   node scripts/backfill-skill-source-paths.mjs --apply
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { appendFileSync } from "node:fs";
import { createAdminClient } from "./lib/supabase-admin.mjs";
import { githubFetch } from "./lib/github.mjs";
import { createLogger } from "./lib/logger.mjs";
import { validateEnv } from "./lib/validate-env.mjs";

const log = createLogger("skill-paths");
const APPLY = process.argv.includes("--apply");

const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Bare https://github.com/owner/repo → { owner, repo }; null for deeper URLs. */
function bareRepo(url) {
  const m = url?.match(/^https?:\/\/github\.com\/([^/]+)\/([^/#?]+?)(?:\.git)?\/?$/i);
  return m ? { owner: m[1], repo: m[2] } : null;
}

/** Skill folders (dirs holding a SKILL.md) in a repo, plus its default branch. */
async function listSkillFolders(owner, repo) {
  const meta = await githubFetch(`/repos/${owner}/${repo}`);
  const branch = meta.default_branch;
  const tree = await githubFetch(`/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);
  const folders = (tree.tree || [])
    .filter((n) => n.type === "blob" && /(^|\/)SKILL\.md$/i.test(n.path))
    .map((n) => n.path.replace(/\/?SKILL\.md$/i, ""))
    .filter((p) => p && !/(^|\/)template$/i.test(p)); // drop root SKILL.md and templates
  return { branch, folders };
}

/** The folder this row stands for, or null when it stands for the whole pack. */
function matchFolder(row, folders) {
  if (folders.length === 1) return folders[0];
  const name = norm(row.name);
  const slug = norm(row.slug);
  const hits = folders.filter((path) => {
    const folder = norm(path.split("/").pop());
    return folder === name || folder === slug;
  });
  return hits.length === 1 ? hits[0] : null;
}

async function main() {
  validateEnv(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "GITHUB_TOKEN"]);
  const supabase = createAdminClient();

  const { data: skills, error } = await supabase
    .from("skills")
    .select("slug, name, github_url")
    .eq("status", "published")
    .order("slug", { ascending: true });
  if (error) throw new Error(`Fetch skills: ${error.message}`);

  // Group bare-repo rows by repo so each repo tree is fetched once
  const byRepo = new Map();
  for (const row of skills) {
    const r = bareRepo(row.github_url);
    if (!r) continue;
    const key = `${r.owner}/${r.repo}`;
    if (!byRepo.has(key)) byRepo.set(key, { ...r, rows: [] });
    byRepo.get(key).rows.push(row);
  }
  log.info(`${APPLY ? "APPLY" : "DRY RUN"} | ${skills.length} published skills, ${byRepo.size} repos with bare URLs`);

  const lines = ["## Skill source paths", "", "| Skill | Result |", "|-------|--------|"];
  let updated = 0;
  let errors = 0;

  for (const [key, g] of byRepo) {
    let listing;
    try {
      listing = await listSkillFolders(g.owner, g.repo);
    } catch (err) {
      log.warn(`${key}: ${err.message}`);
      g.rows.forEach((r) => lines.push(`| ${r.slug} | ⚠ repo not readable |`));
      continue;
    }
    for (const row of g.rows) {
      if (listing.folders.length === 0) {
        lines.push(`| ${row.slug} | single root skill, unchanged |`);
        continue;
      }
      const folder = matchFolder(row, listing.folders);
      if (!folder) {
        lines.push(`| ${row.slug} | skill pack (${listing.folders.length} folders), unchanged |`);
        continue;
      }
      const url = `https://github.com/${key}/tree/${listing.branch}/${folder}`;
      lines.push(`| ${row.slug} | → ${url} |`);
      if (APPLY) {
        const { error: upErr } = await supabase.from("skills").update({ github_url: url }).eq("slug", row.slug);
        if (upErr) {
          log.error(`${row.slug}: ${upErr.message}`);
          errors++;
          continue;
        }
      }
      updated++;
    }
  }

  lines.push("", `${APPLY ? "Updated" : "Would update"}: **${updated}**, errors: ${errors}`);
  const md = lines.join("\n");
  console.log(md);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + "\n");
  log.done();
  if (errors > 0) process.exit(1);
}

main().catch((err) => {
  log.error(err.message);
  process.exit(1);
});
