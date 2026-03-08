#!/usr/bin/env node

/**
 * Reclassify `news` articles into tutorial / analysis / guide.
 *
 * Phase 1 of content pipeline spec — type simplification.
 *
 * Usage:
 *   # Dry-run: show LLM classification results (no DB changes)
 *   LLM_PROVIDER=gpt npm run reclassify-news
 *
 *   # Apply: write new types to DB + hide low-score drafts
 *   LLM_PROVIDER=gpt npm run reclassify-news -- --apply
 */

import { createAdminClient } from "./lib/supabase-admin.mjs";

// ── LLM Classification ─────────────────────────────────────────────

const PROVIDERS = {
  deepseek: {
    baseUrl: "https://api.deepseek.com/v1",
    model: "deepseek-chat",
    apiKeyEnv: "DEEPSEEK_API_KEY",
    type: "openai-compatible",
  },
  gemini: {
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    model: "gemini-2.0-flash",
    apiKeyEnv: "GEMINI_API_KEY",
    type: "openai-compatible",
  },
  gpt: {
    baseUrl: "https://gmn.chuangzuoli.com/v1",
    model: "gpt-5.3-codex",
    apiKeyEnv: "GPT_API_KEY",
    type: "openai-responses",
  },
};

function getProvider() {
  const name = process.env.LLM_PROVIDER || "deepseek";
  const cfg = PROVIDERS[name];
  if (!cfg) throw new Error(`Unknown LLM_PROVIDER: ${name}`);
  const apiKey = process.env[cfg.apiKeyEnv];
  if (!apiKey) throw new Error(`${cfg.apiKeyEnv} not set`);
  return { ...cfg, apiKey };
}

async function callLLM(systemPrompt, userPrompt) {
  const p = getProvider();

  if (p.type === "openai-responses") {
    const res = await fetch(`${p.baseUrl}/responses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${p.apiKey}`,
      },
      body: JSON.stringify({
        model: p.model,
        max_output_tokens: 512,
        input: [
          { type: "message", role: "developer", content: [{ type: "input_text", text: systemPrompt }] },
          { type: "message", role: "user", content: [{ type: "input_text", text: userPrompt }] },
        ],
      }),
    });
    if (!res.ok) throw new Error(`LLM error ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = await res.json();
    return data.output?.find((o) => o.type === "message")?.content?.find((c) => c.type === "output_text")?.text;
  }

  // OpenAI-compatible
  const res = await fetch(`${p.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${p.apiKey}`,
    },
    body: JSON.stringify({
      model: p.model,
      max_tokens: 512,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`LLM error ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

const CLASSIFY_SYSTEM = `You are a content editor for a Chinese AI developer tools site (skillnav.dev).
Your job is to classify articles into exactly one of three types. Respond with valid JSON only.`;

const VALID_TYPES = ["tutorial", "analysis", "guide"];

async function classifyArticle({ title, titleZh, summary, summaryZh, content }) {
  const contentPreview = (content || "").slice(0, 2000);

  const userPrompt = `Classify this article into one of three types. Return JSON:

{
  "articleType": "tutorial" | "analysis" | "guide",
  "reason": "one-sentence explanation in Chinese"
}

Type definitions:
- tutorial: 教你做（How-to、操作指南、最佳实践、代码示例）
- analysis: 帮你想（深度分析、趋势解读、技术洞察、对比分析）
- guide: 帮你选（工具评测、对比横评、选型建议、产品介绍性评测）

Title: ${title}
Title (zh): ${titleZh || "N/A"}
Summary: ${summary || "N/A"}
Summary (zh): ${summaryZh || "N/A"}

Content preview:
${contentPreview}`;

  // Retry up to 3 times on transient errors (502, network, etc.)
  let text;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      text = await callLLM(CLASSIFY_SYSTEM, userPrompt);
      break;
    } catch (err) {
      if (attempt === 3) throw err;
      const delay = attempt * 3000;
      process.stdout.write(`\n    ⚠ Attempt ${attempt} failed (${err.message.slice(0, 60)}), retrying in ${delay / 1000}s... `);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  const jsonStr = text.replace(/^```json\s*\n?/, "").replace(/\n?```\s*$/, "").trim();

  try {
    const result = JSON.parse(jsonStr);
    if (!VALID_TYPES.includes(result.articleType)) {
      result.articleType = "analysis"; // safe default
    }
    return result;
  } catch {
    console.error("  ⚠ JSON parse failed, defaulting to analysis:", jsonStr.slice(0, 200));
    return { articleType: "analysis", reason: "JSON 解析失败，默认分类" };
  }
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  const apply = process.argv.includes("--apply");
  const supabase = createAdminClient();

  console.log(`\n🔄 Phase 1: News Type Reclassification`);
  console.log(`   Mode: ${apply ? "APPLY (will update DB)" : "DRY-RUN (preview only)"}\n`);

  // 1. Fetch all non-hidden news articles
  const { data: newsArticles, error } = await supabase
    .from("articles")
    .select("id, slug, title, title_zh, summary, summary_zh, content, status, relevance_score, source")
    .eq("article_type", "news")
    .in("status", ["published", "draft"])
    .order("relevance_score", { ascending: false, nullsFirst: false });

  if (error) { console.error("DB error:", error); process.exit(1); }

  const published = newsArticles.filter((a) => a.status === "published");
  const drafts = newsArticles.filter((a) => a.status === "draft");

  console.log(`📊 Found ${newsArticles.length} news articles (${published.length} published, ${drafts.length} draft)\n`);

  // 2. LLM classify each published article
  console.log("── Published News → LLM Reclassification ──\n");
  const classifications = [];

  for (let i = 0; i < published.length; i++) {
    const a = published[i];
    const displayTitle = (a.title_zh || a.title || "").slice(0, 50);
    process.stdout.write(`  [${i + 1}/${published.length}] ${displayTitle}... `);

    const result = await classifyArticle({
      title: a.title,
      titleZh: a.title_zh,
      summary: a.summary,
      summaryZh: a.summary_zh,
      content: a.content,
    });

    classifications.push({ id: a.id, slug: a.slug, ...result });
    console.log(`→ ${result.articleType} (${result.reason})`);

    // Brief pause between LLM calls
    if (i < published.length - 1) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  // 3. Summary table
  const typeCounts = { tutorial: 0, analysis: 0, guide: 0 };
  for (const c of classifications) typeCounts[c.articleType]++;

  console.log(`\n── Classification Results ──`);
  console.log(`   tutorial: ${typeCounts.tutorial} | analysis: ${typeCounts.analysis} | guide: ${typeCounts.guide}`);
  console.log();

  for (const c of classifications) {
    console.log(`  ${c.articleType.padEnd(10)} ${c.slug.slice(0, 50).padEnd(52)} ${c.reason}`);
  }

  // 4. Draft articles → hidden
  console.log(`\n── Draft News → Hidden ──`);
  console.log(`   ${drafts.length} draft articles will be hidden (all score=2, business/policy content)\n`);

  // 5. Hidden news type change (for DB constraint)
  const { count: hiddenCount } = await supabase
    .from("articles")
    .select("*", { count: "exact", head: true })
    .eq("article_type", "news")
    .eq("status", "hidden");
  console.log(`── Hidden News ──`);
  console.log(`   ${hiddenCount} hidden news articles will be retyped to 'analysis'\n`);

  if (!apply) {
    console.log("✅ Dry-run complete. Run with --apply to execute changes.\n");
    return;
  }

  // ── Apply changes ──
  console.log("── Applying Changes ──\n");

  // 5a. Update each published article with LLM-assigned type
  let updated = 0;
  for (const c of classifications) {
    const { error: err } = await supabase
      .from("articles")
      .update({ article_type: c.articleType })
      .eq("id", c.id);
    if (err) {
      console.error(`  ✗ ${c.slug}: ${err.message}`);
    } else {
      updated++;
    }
  }
  console.log(`  ✓ Reclassified ${updated}/${classifications.length} published articles`);

  // 5b. Hide draft news
  const { error: draftErr, count: draftHidden } = await supabase
    .from("articles")
    .update({ status: "hidden" })
    .eq("article_type", "news")
    .eq("status", "draft");
  if (draftErr) {
    console.error(`  ✗ Draft hide failed: ${draftErr.message}`);
  } else {
    console.log(`  ✓ Hidden ${draftHidden ?? drafts.length} draft news articles`);
  }

  // 5c. Retype hidden news to analysis (for constraint)
  const { error: hiddenErr, count: hiddenUpdated } = await supabase
    .from("articles")
    .update({ article_type: "analysis" })
    .eq("article_type", "news")
    .eq("status", "hidden");
  if (hiddenErr) {
    console.error(`  ✗ Hidden retype failed: ${hiddenErr.message}`);
  } else {
    console.log(`  ✓ Retyped ${hiddenUpdated ?? hiddenCount} hidden news → analysis`);
  }

  // 5d. Also retype review/comparison/weekly → guide
  for (const oldType of ["review", "comparison", "weekly"]) {
    const { count } = await supabase
      .from("articles")
      .select("*", { count: "exact", head: true })
      .eq("article_type", oldType);
    if (count > 0) {
      await supabase.from("articles").update({ article_type: "guide" }).eq("article_type", oldType);
      console.log(`  ✓ Merged ${count} '${oldType}' → guide`);
    }
  }

  // 6. Final verification
  const { data: remaining } = await supabase
    .from("articles")
    .select("article_type")
    .not("article_type", "in", '("tutorial","analysis","guide")');

  if (remaining?.length > 0) {
    console.error(`\n  ⚠ ${remaining.length} articles still have non-standard types!`);
  } else {
    console.log(`\n✅ All articles now use tutorial/analysis/guide types.`);
    console.log(`   Safe to update DB constraint.\n`);
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
