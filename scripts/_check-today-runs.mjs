#!/usr/bin/env node
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import { createAdminClient } from "./lib/supabase-admin.mjs";

const supabase = createAdminClient();
const sinceUtc = "2026-04-27T16:00:00Z"; // CST 2026-04-28 00:00

const { data: runs, error } = await supabase
  .from("pipeline_runs")
  .select("pipeline, status, started_at, duration_s, summary, error_msg")
  .gte("started_at", sinceUtc)
  .order("started_at", { ascending: false });

if (error) {
  console.error(error);
  process.exit(1);
}

console.log(`Pipeline runs since CST 2026-04-28 00:00 (${sinceUtc} UTC): ${runs.length}\n`);
for (const r of runs) {
  const start = new Date(r.started_at).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });
  const dur = r.duration_s != null ? `${r.duration_s}s` : "running";
  const s = r.summary || {};
  const summaryStr = Object.entries(s)
    .filter(([k]) => ["fetched", "inserted", "updated", "translated", "skipped", "errors"].includes(k))
    .map(([k, v]) => `${k}=${v}`)
    .join(" ");
  console.log(
    `  ${start} | ${r.pipeline.padEnd(22)} | ${r.status.padEnd(8)} | ${dur.padStart(8)} | ${summaryStr || JSON.stringify(s).slice(0, 60)}`
  );
  if (r.error_msg) console.log(`      err: ${r.error_msg.slice(0, 120)}`);
}

const { count } = await supabase
  .from("articles")
  .select("id", { count: "exact", head: true })
  .neq("source", "arxiv")
  .gte("created_at", sinceUtc);

console.log(`\nNon-paper articles inserted today (CST): ${count}`);
