#!/usr/bin/env node
// One-shot helper to list/publish today's translated paper drafts.
// Usage:
//   node scripts/_publish-paper-drafts.mjs --list
//   node scripts/_publish-paper-drafts.mjs --apply

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { createAdminClient } from "./lib/supabase-admin.mjs";

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const sinceIdx = args.indexOf("--since");
const since = sinceIdx !== -1 ? args[sinceIdx + 1] : "2026-04-28T00:00:00Z";

const supabase = createAdminClient();

const { data, error } = await supabase
  .from("articles")
  .select("id, slug, title_zh, status, created_at")
  .eq("source", "arxiv")
  .eq("status", "draft")
  .gte("created_at", since)
  .order("created_at", { ascending: true });

if (error) {
  console.error(error);
  process.exit(1);
}

console.log(`Draft arxiv papers since ${since}: ${data.length}`);
for (const a of data) console.log(`  ${a.id.slice(0, 8)} | ${a.title_zh}`);

if (!apply) {
  console.log("\n[list mode] Pass --apply to update status to published.");
  process.exit(0);
}

const ids = data.map((a) => a.id);
const nowIso = new Date().toISOString();

const { error: upErr, count } = await supabase
  .from("articles")
  .update({ status: "published", published_at: nowIso }, { count: "exact" })
  .in("id", ids);

if (upErr) {
  console.error(upErr);
  process.exit(1);
}

console.log(`\n✓ Published ${count ?? ids.length} papers.`);
