#!/usr/bin/env node

/**
 * One-time reclassification script for Phase 1.5-1.8.
 *
 * Tasks:
 *   1.5  Skills reclassification (301 → zero "其他")
 *   1.6  MCP first-time unified classification (4,616)
 *   1.7  Low-quality entries → draft
 *   1.8  Platform field cleanup → universal
 *
 * Usage:
 *   node scripts/reclassify-all.mjs --dry-run          # Preview changes
 *   node scripts/reclassify-all.mjs                     # Live update DB
 *   node scripts/reclassify-all.mjs --skills-only       # Only reclassify skills
 *   node scripts/reclassify-all.mjs --mcp-only          # Only reclassify MCP
 *   node scripts/reclassify-all.mjs --llm-assist        # Use LLM for stubborn "其他"
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { createAdminClient } from "./lib/supabase-admin.mjs";
import { categorize } from "./lib/categorize.mjs";
import { createLogger } from "./lib/logger.mjs";
import { validateEnv } from "./lib/validate-env.mjs";

// ─── LLM-assisted classification ─────────────────────────────────────

const VALID_CATEGORIES = [
  "编码与调试", "AI 与智能体", "数据与存储", "搜索与获取", "DevOps",
  "内容与创意", "效率与工作流", "安全与合规", "平台与服务", "行业场景",
];

const CLASSIFY_SYSTEM = `You are a tool categorizer for SkillNav, a Chinese developer AI tools directory.
Classify each tool into exactly ONE of these 10 categories:

1. 编码与调试 — write/review/test/debug code
2. AI 与智能体 — LLM, agent, RAG, prompt engineering
3. 数据与存储 — database, file system, data analysis, ETL
4. 搜索与获取 — web search, crawling, RSS, API aggregation
5. DevOps — deploy, CI/CD, Docker, cloud, monitoring
6. 内容与创意 — writing, translation, design, video, audio
7. 效率与工作流 — task management, file ops, automation, CLI tools
8. 安全与合规 — security scan, encryption, audit, compliance
9. 平台与服务 — connect specific platforms (Slack, GitHub, Stripe, etc.)
10. 行业场景 — domain-specific (finance, education, legal, medical, gaming, HR)

Rules:
- Return ONLY the category name in Chinese, nothing else
- If a tool connects to a specific platform/service, prefer 平台与服务
- If a tool is domain-specific (finance, legal, medical), prefer 行业场景
- Never return 其他`;

/**
 * Call DeepSeek API directly (without json_object format constraint).
 */
async function callLLMText(systemPrompt, userPrompt) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY not set");

  const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      max_tokens: 1024,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`DeepSeek API error ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

/**
 * Classify items using LLM in batches.
 * @param {Array<{name: string, description: string, descriptionZh: string}>} items
 * @returns {Map<string, string>} name → category
 */
async function classifyWithLLM(items) {
  const results = new Map();
  const BATCH = 10;

  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH);
    const prompt = batch.map((item, idx) => {
      const desc = item.description || item.descriptionZh || "(no description)";
      return `${idx + 1}. ${item.name}: ${desc.slice(0, 200)}`;
    }).join("\n");

    const userPrompt = `Classify these ${batch.length} tools. Return one category per line, format: "NUMBER. CATEGORY"\n\n${prompt}`;

    try {
      const text = await callLLMText(CLASSIFY_SYSTEM, userPrompt);
      const lines = text.trim().split("\n");

      for (const line of lines) {
        const m = line.match(/^(\d+)\.\s*(.+)/);
        if (!m) continue;
        const idx = parseInt(m[1]) - 1;
        const cat = m[2].trim();
        if (idx >= 0 && idx < batch.length && VALID_CATEGORIES.includes(cat)) {
          results.set(batch[idx].name, cat);
        }
      }
    } catch (err) {
      log.warn(`LLM batch error: ${err.message}`);
    }

    // Rate limit
    await new Promise((r) => setTimeout(r, 300));
    if ((i + BATCH) % 50 === 0) {
      log.info(`  LLM classify: ${Math.min(i + BATCH, items.length)}/${items.length}`);
    }
  }

  log.info(`LLM classified ${results.size}/${items.length} items`);
  return results;
}

const log = createLogger("reclassify");

// ─── Fetch all rows with pagination ──────────────────────────────────

async function fetchAll(supabase, table, columns) {
  const rows = [];
  let from = 0;
  const PAGE = 1000;

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .range(from, from + PAGE - 1);

    if (error) throw new Error(`${table} fetch error: ${error.message}`);
    if (!data || data.length === 0) break;

    rows.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }

  return rows;
}

// ─── Reclassify Skills (1.5 + 1.7 + 1.8) ────────────────────────────

async function reclassifySkills(supabase, dryRun, llmAssist) {
  log.info("\n" + "=".repeat(60));
  log.info("Phase 1.5 + 1.7 + 1.8: Skills reclassification + cleanup");

  const rows = await fetchAll(
    supabase,
    "skills",
    "id, slug, name, tags, description, description_zh, category, platform, status"
  );
  log.info(`Fetched ${rows.length} skills`);

  const updates = [];
  const stats = {
    reclassified: 0,
    platformFixed: 0,
    draftedLowQuality: 0,
    unchanged: 0,
  };

  // Category migration map (old → new)
  const categoryMigration = {
    "编码开发": "编码与调试",
    "AI 智能体": "AI 与智能体",
    "数据处理": "数据与存储",
    "搜索研究": "搜索与获取",
    "运维部署": "DevOps",
    "内容创作": "内容与创意",
    "效率工具": "效率与工作流",
    "安全监控": "安全与合规",
    "平台集成": "平台与服务",
  };

  for (const row of rows) {
    const tags = Array.isArray(row.tags) ? row.tags : [];
    const patch = {};

    // Clean description: strip "Tier: POWERFUL" and "Category: Engineering" prefixes
    let desc = (row.description || "").trim();
    desc = desc.replace(/^(Tier|Category|Skill Type):\s*\w+\s*[-–—>]?\s*/i, "").trim();
    if (/^(tier|category|skill type):\s*\w+$/i.test(desc)) desc = "";

    // Combine English desc + Chinese desc_zh for richer signal
    const descForClassify = [desc, row.description_zh || ""].filter(Boolean).join(" ");

    // 1.5: Reclassify — run categorize() fresh for all
    const newCat = categorize(row.name, tags, descForClassify);

    // For non-"其他" old categories, prefer migration map if categorize returns "其他"
    const oldCat = row.category;
    let finalCat = newCat;
    if (newCat === "其他" && categoryMigration[oldCat]) {
      // Old category had a valid mapping; keep the migrated name
      finalCat = categoryMigration[oldCat];
    }

    if (finalCat !== oldCat) {
      patch.category = finalCat;
      stats.reclassified++;
    }

    // 1.7: Low-quality → draft (only truly empty/meaningless)
    const hasValidDesc = desc.length >= 10;
    const hasValidDescZh = (row.description_zh || "").trim().length >= 10;
    const isLowQuality = !hasValidDesc && !hasValidDescZh;

    if (isLowQuality && row.status !== "draft") {
      patch.status = "draft";
      stats.draftedLowQuality++;
    }

    // 1.8: Platform cleanup → universal
    const plat = row.platform;
    const needsPlatformFix =
      !plat ||
      (Array.isArray(plat) && (
        plat.length === 0 ||
        (plat.length === 1 && plat[0] === "claude") ||
        (plat.length === 1 && plat[0] === "codex")
      ));

    if (needsPlatformFix) {
      patch.platform = ["universal"];
      stats.platformFixed++;
    }

    if (Object.keys(patch).length > 0) {
      updates.push({ id: row.id, slug: row.slug, oldCat: oldCat, ...patch });
    } else {
      stats.unchanged++;
    }
  }

  // LLM assist: classify remaining "其他" items
  if (llmAssist) {
    const otherItems = [];
    const otherUpdateMap = new Map(); // slug → update entry

    for (const row of rows) {
      const upd = updates.find((u) => u.id === row.id);
      const currentCat = upd?.category || row.category;
      if (currentCat === "其他") {
        otherItems.push({
          name: row.name,
          description: (row.description || "").replace(/^(Tier|Category|Skill Type):\s*\w+\s*[-–—>]?\s*/i, "").trim(),
          descriptionZh: row.description_zh || "",
        });
        otherUpdateMap.set(row.name, { id: row.id, slug: row.slug, oldCat: "其他", upd });
      }
    }

    if (otherItems.length > 0) {
      log.info(`\nLLM assist: classifying ${otherItems.length} "其他" skills...`);
      const llmResults = await classifyWithLLM(otherItems);

      let llmFixed = 0;
      for (const [name, cat] of llmResults) {
        const entry = otherUpdateMap.get(name);
        if (!entry) continue;

        if (entry.upd) {
          // Already in updates array — modify in place
          entry.upd.category = cat;
        } else {
          // Not yet in updates — add new entry
          updates.push({ id: entry.id, slug: entry.slug, oldCat: "其他", category: cat });
          stats.reclassified++;
        }
        llmFixed++;
      }
      log.info(`LLM fixed ${llmFixed}/${otherItems.length} "其他" skills`);
    }
  }

  // Report
  log.info(`\nSkills reclassification summary:`);
  log.info(`  Total: ${rows.length}`);
  log.info(`  Reclassified: ${stats.reclassified}`);
  log.info(`  Platform fixed: ${stats.platformFixed}`);
  log.info(`  Low-quality → draft: ${stats.draftedLowQuality}`);
  log.info(`  Unchanged: ${stats.unchanged}`);

  // Show category distribution after reclassification
  const catCounts = {};
  for (const row of rows) {
    const upd = updates.find((u) => u.id === row.id);
    const cat = upd?.category || row.category;
    catCounts[cat] = (catCounts[cat] || 0) + 1;
  }
  log.info(`\nNew category distribution:`);
  for (const [cat, count] of Object.entries(catCounts).sort((a, b) => b[1] - a[1])) {
    log.info(`  ${cat}: ${count}`);
  }

  // Show samples of reclassified
  const reclassifiedSamples = updates
    .filter((u) => u.category)
    .slice(0, 15);
  if (reclassifiedSamples.length > 0) {
    log.info(`\nReclassification samples:`);
    for (const u of reclassifiedSamples) {
      log.info(`  ${u.slug}: ${u.oldCat} → ${u.category}`);
    }
  }

  // Show drafted entries
  const drafted = updates.filter((u) => u.status === "draft");
  if (drafted.length > 0) {
    log.info(`\nDrafted (low quality):`);
    for (const u of drafted) {
      log.info(`  ${u.slug}`);
    }
  }

  if (dryRun) {
    log.info(`\n[DRY RUN] Would update ${updates.length} skills`);
    return stats;
  }

  // Batch update
  const BATCH = 100;
  let updated = 0;
  for (let i = 0; i < updates.length; i += BATCH) {
    const batch = updates.slice(i, i + BATCH);

    for (const item of batch) {
      const patch = {};
      if (item.category) patch.category = item.category;
      if (item.status) patch.status = item.status;
      if (item.platform) patch.platform = item.platform;

      const { error } = await supabase
        .from("skills")
        .update(patch)
        .eq("id", item.id);

      if (error) {
        log.warn(`Failed to update ${item.slug}: ${error.message}`);
      } else {
        updated++;
      }
    }

    log.info(`Updated ${Math.min(i + BATCH, updates.length)}/${updates.length} skills`);
  }

  log.success(`Skills: ${updated} updated`);
  return stats;
}

// ─── Reclassify MCP Servers (1.6) ───────────────────────────────────

async function reclassifyMcp(supabase, dryRun, llmAssist) {
  log.info("\n" + "=".repeat(60));
  log.info("Phase 1.6: MCP servers unified classification");

  const rows = await fetchAll(
    supabase,
    "mcp_servers",
    "id, slug, name, name_zh, description, description_zh, category, tags"
  );
  log.info(`Fetched ${rows.length} MCP servers`);

  const updates = [];
  let unchanged = 0;

  // Old MCP-specific categories that need migration
  const mcpCategoryMigration = {
    "文件系统": "数据与存储",
    "数据库": "数据与存储",
    "Web & API": "平台与服务",
    "AI & LLM": "AI 与智能体",
    "开发工具": "编码与调试",
    // Old unified categories
    "编码开发": "编码与调试",
    "AI 智能体": "AI 与智能体",
    "数据处理": "数据与存储",
    "搜索研究": "搜索与获取",
    "运维部署": "DevOps",
    "内容创作": "内容与创意",
    "效率工具": "效率与工作流",
    "安全监控": "安全与合规",
    "平台集成": "平台与服务",
  };

  // New valid categories
  const validCategories = new Set([
    "编码与调试", "AI 与智能体", "数据与存储", "搜索与获取", "DevOps",
    "内容与创意", "效率与工作流", "安全与合规", "平台与服务", "行业场景",
  ]);

  for (const row of rows) {
    const name = row.name || "";
    const tags = Array.isArray(row.tags) ? row.tags : [];
    const desc = row.description || "";
    const descZh = row.description_zh || "";
    const oldCat = row.category || "";

    // Combine English + Chinese descriptions for richer signal
    const descForClassify = [desc, descZh].filter(Boolean).join(" ");

    // Run categorize
    const newCat = categorize(name, tags, descForClassify);

    let finalCat = newCat;

    // If categorize returns "其他", try migration map
    if (finalCat === "其他" && mcpCategoryMigration[oldCat]) {
      finalCat = mcpCategoryMigration[oldCat];
    }

    // If old category is already valid and new is "其他", keep old
    if (finalCat === "其他" && validCategories.has(oldCat)) {
      finalCat = oldCat;
    }

    if (finalCat !== oldCat && finalCat !== "其他") {
      updates.push({ id: row.id, slug: row.slug, oldCat, category: finalCat });
    } else if (finalCat === "其他" && oldCat !== "其他") {
      // Keep old if we can't do better — but still mark for review
      unchanged++;
    } else if (finalCat === oldCat) {
      unchanged++;
    } else {
      updates.push({ id: row.id, slug: row.slug, oldCat, category: finalCat });
    }
  }

  // LLM assist: classify remaining "其他" MCP servers
  if (llmAssist) {
    // Build a quick lookup for faster "is this still 其他?" check
    const updateById = new Map(updates.map((u) => [u.id, u]));

    const otherItems = [];
    const otherMeta = []; // parallel array with id/slug/upd

    for (const row of rows) {
      const upd = updateById.get(row.id);
      const currentCat = upd?.category || row.category || "其他";
      if (currentCat === "其他") {
        otherItems.push({
          name: row.name || row.slug,
          description: row.description || "",
          descriptionZh: row.description_zh || "",
        });
        otherMeta.push({ id: row.id, slug: row.slug, upd });
      }
    }

    if (otherItems.length > 0) {
      log.info(`\nLLM assist: classifying ${otherItems.length} "其他" MCP servers...`);
      const llmResults = await classifyWithLLM(otherItems);

      let llmFixed = 0;
      for (let i = 0; i < otherItems.length; i++) {
        const cat = llmResults.get(otherItems[i].name);
        if (!cat) continue;
        const meta = otherMeta[i];

        if (meta.upd) {
          meta.upd.category = cat;
        } else {
          updates.push({ id: meta.id, slug: meta.slug, oldCat: "其他", category: cat });
        }
        llmFixed++;
      }
      log.info(`LLM fixed ${llmFixed}/${otherItems.length} "其他" MCP servers`);
      unchanged -= llmFixed;
    }
  }

  // Category distribution after reclassification
  const catCounts = {};
  for (const row of rows) {
    const upd = updates.find((u) => u.id === row.id);
    const cat = upd?.category || row.category || "其他";
    catCounts[cat] = (catCounts[cat] || 0) + 1;
  }

  log.info(`\nMCP reclassification summary:`);
  log.info(`  Total: ${rows.length}`);
  log.info(`  Will update: ${updates.length}`);
  log.info(`  Unchanged: ${unchanged}`);

  log.info(`\nNew category distribution:`);
  for (const [cat, count] of Object.entries(catCounts).sort((a, b) => b[1] - a[1])) {
    log.info(`  ${cat}: ${count}`);
  }

  // Show samples
  const samples = updates.slice(0, 15);
  if (samples.length > 0) {
    log.info(`\nReclassification samples:`);
    for (const u of samples) {
      log.info(`  ${u.slug}: ${u.oldCat || "(empty)"} → ${u.category}`);
    }
  }

  if (dryRun) {
    log.info(`\n[DRY RUN] Would update ${updates.length} MCP servers`);
    return;
  }

  // Batch update
  let updated = 0;
  let errors = 0;
  const BATCH = 200;

  for (let i = 0; i < updates.length; i += BATCH) {
    const batch = updates.slice(i, i + BATCH);

    for (const item of batch) {
      const { error } = await supabase
        .from("mcp_servers")
        .update({ category: item.category })
        .eq("id", item.id);

      if (error) {
        log.warn(`Failed ${item.slug}: ${error.message}`);
        errors++;
      } else {
        updated++;
      }
    }

    log.info(`Updated ${Math.min(i + BATCH, updates.length)}/${updates.length} MCP servers`);
  }

  log.success(`MCP: ${updated} updated, ${errors} errors`);
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const skillsOnly = args.includes("--skills-only");
  const mcpOnly = args.includes("--mcp-only");
  const llmAssist = args.includes("--llm-assist");

  log.info(`Reclassify All — ${new Date().toISOString()}`);
  log.info(`Mode: ${dryRun ? "DRY RUN" : "LIVE"} | LLM: ${llmAssist ? "ON" : "OFF"}`);

  validateEnv(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
  const supabase = createAdminClient();

  if (!mcpOnly) {
    await reclassifySkills(supabase, dryRun, llmAssist);
  }

  if (!skillsOnly) {
    await reclassifyMcp(supabase, dryRun, llmAssist);
  }

  log.done();
}

main().catch((e) => {
  log.error(e.message);
  process.exit(1);
});
