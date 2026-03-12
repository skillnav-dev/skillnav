import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data } = await sb.from("skills")
  .select("slug, name, description, stars, source")
  .eq("status", "draft")
  .order("stars", { ascending: false });

const toHide = [];
const toPublish = [];

for (const s of data) {
  const desc = (s.description || "").toLowerCase();
  const name = (s.name || "").toLowerCase();

  // HIDE: no description
  if (!s.description || s.description.trim().length === 0) {
    toHide.push({ slug: s.slug, reason: "no description", stars: s.stars });
    continue;
  }

  // HIDE: collection/awesome-list/meta/cookbook repos
  const slug = s.slug.toLowerCase();
  const manualHide = [
    "voltagent--awesome-agent-skills",
    "anthropics--claude-cookbooks",
  ];
  if (
    manualHide.includes(slug) ||
    desc.includes("curated") ||
    desc.includes("awesome") ||
    desc.includes("community-editable skills repository") ||
    desc.includes("lab environment") ||
    name.includes("awesome") ||
    (desc.includes("example") && desc.includes("notebook"))
  ) {
    toHide.push({ slug: s.slug, reason: "collection/meta", stars: s.stars });
    continue;
  }

  // All others with descriptions → publish
  toPublish.push({ slug: s.slug, stars: s.stars });
}

console.log(`=== TO HIDE (${toHide.length}) ===`);
for (const s of toHide) {
  console.log(`  ${String(s.stars).padStart(6)} ${s.slug} — ${s.reason}`);
}

console.log(`\n=== TO PUBLISH (${toPublish.length}) ===`);
for (const s of toPublish) {
  console.log(`  ${String(s.stars).padStart(6)} ${s.slug}`);
}

console.log(`\nSummary: hide=${toHide.length} publish=${toPublish.length}`);

// Apply if --apply flag
if (process.argv.includes("--apply")) {
  let hideOk = 0, pubOk = 0, errors = 0;

  for (const s of toHide) {
    const { error } = await sb.from("skills").update({ status: "hidden" }).eq("slug", s.slug);
    if (error) { console.log(`FAIL hide ${s.slug}: ${error.message}`); errors++; }
    else hideOk++;
  }

  for (const s of toPublish) {
    const { error } = await sb.from("skills").update({ status: "published" }).eq("slug", s.slug);
    if (error) { console.log(`FAIL publish ${s.slug}: ${error.message}`); errors++; }
    else pubOk++;
  }

  console.log(`\nApplied: hidden=${hideOk} published=${pubOk} errors=${errors}`);
}
