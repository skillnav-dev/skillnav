#!/usr/bin/env node

/**
 * Paper Radar — daily paper sensing for knowledge base.
 * Fetches from 3 sources, merges, deduplicates, outputs Markdown to Vault.
 *
 * Sources:
 *   1. HuggingFace Daily Papers (community upvotes)
 *   2. Semantic Scholar (citation velocity)
 *   3. Newsletter LLM extraction (editorial signal)
 *
 * Usage:
 *   node scripts/paper-radar.mjs                  # Generate today's radar
 *   node scripts/paper-radar.mjs --dry-run         # Preview without writing file
 *   node scripts/paper-radar.mjs --date 2026-04-06 # Specific date
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import fs from "fs";
import pathMod from "path";
import { createLogger } from "./lib/logger.mjs";

const log = createLogger("radar");

const VAULT_RADAR_DIR = pathMod.join(
  process.env.HOME,
  "Vault/知识库/AI/论文雷达",
);
const NEWSLETTER_DIR = pathMod.join(process.cwd(), "data/daily-newsletters");
const MAX_PAPERS = 10;

// ── Date Helpers ────────────────────────────────────────────────────

function todayCST() {
  const now = new Date();
  const cst = new Date(now.getTime() + 8 * 3600 * 1000);
  return cst.toISOString().slice(0, 10);
}

// ── Source 1: HuggingFace Daily Papers ──────────────────────────────

async function fetchHFPapers(limit = 15) {
  try {
    const res = await fetch("https://huggingface.co/api/daily_papers", {
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      log.warn(`HF Daily Papers API returned ${res.status}`);
      return [];
    }
    const data = await res.json();
    return data
      .sort((a, b) => (b.paper?.upvotes || 0) - (a.paper?.upvotes || 0))
      .slice(0, limit)
      .map((item) => ({
        id: item.paper?.id,
        title: item.paper?.title?.replace(/\s+/g, " ").trim(),
        upvotes: item.paper?.upvotes || 0,
        org: item.paper?.organization?.fullname || "",
        summary: item.paper?.ai_summary || "",
        keywords: item.paper?.ai_keywords || [],
        githubUrl: item.paper?.githubRepo || "",
        githubStars: item.paper?.githubStars ?? null,
        source: "hf",
      }));
  } catch (e) {
    log.warn(`HF Daily Papers fetch failed: ${e.message}`);
    return [];
  }
}

// ── Source 2: Semantic Scholar ───────────────────────────────────────

async function fetchSemanticScholarTrending(limit = 15) {
  // Bulk search for recent high-citation AI papers
  // Free tier: 1 request/sec, 100 requests/5 min (no auth needed)
  const fields = "paperId,externalIds,title,citationCount,year,authors,tldr";
  const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=large+language+model+agent&year=2025-2026&fieldsOfStudy=Computer+Science&fields=${fields}&sort=citationCount:desc&limit=${limit}`;

  // Retry once on 429 after 3s delay
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      if (attempt > 0) await new Promise((r) => setTimeout(r, 3000));
      const headers = { "User-Agent": "SkillNav-PaperRadar/1.0 (skillnav.dev)" };
      if (process.env.S2_API_KEY) {
        headers["x-api-key"] = process.env.S2_API_KEY;
      }
      const res = await fetch(url, {
        signal: AbortSignal.timeout(15_000),
        headers,
      });
      if (res.status === 429 && attempt === 0) {
        log.warn("Semantic Scholar rate limited, retrying in 3s...");
        continue;
      }
      if (!res.ok) {
        log.warn(`Semantic Scholar API returned ${res.status}`);
        return [];
      }
    const data = await res.json();
    return (data.data || [])
      .filter((p) => p.externalIds?.ArXiv) // only papers with arXiv ID
      .map((p) => ({
        id: p.externalIds.ArXiv,
        title: p.title?.replace(/\s+/g, " ").trim(),
        citations: p.citationCount || 0,
        org: p.authors?.[0]?.name ? `${p.authors[0].name} et al.` : "",
        summary: p.tldr?.text || "",
        keywords: [],
        githubUrl: "",
        githubStars: null,
        source: "s2",
      }));
    } catch (e) {
      log.warn(`Semantic Scholar fetch failed: ${e.message}`);
      return [];
    }
  }
  return [];
}

// ── Source 3: Newsletter Paper Extraction ────────────────────────────

function loadNewsletterText(dateLabel) {
  // Try today and yesterday
  for (const offset of [0, -1]) {
    const d = new Date(dateLabel);
    d.setDate(d.getDate() + offset);
    const file = pathMod.join(
      NEWSLETTER_DIR,
      `${d.toISOString().slice(0, 10)}.json`,
    );
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, "utf8"));
      const texts = (data.sources || []).map((s) => s.text).join("\n\n");
      return { texts, date: d.toISOString().slice(0, 10) };
    }
  }
  return null;
}

async function extractPapersFromNewsletters(newsletterText) {
  // Use LLM to extract paper titles, then resolve arXiv IDs
  if (!newsletterText || newsletterText.length < 200) return [];

  try {
    const { callLLM } = await import("./lib/llm.mjs");

    const systemPrompt = `You extract academic paper references from AI newsletter text. Return a JSON array of objects with "title" (exact paper title) and "context" (one sentence about why it was mentioned). Only include actual research papers (with clear titles), not product launches or blog posts. Return [] if none found.`;

    const userPrompt = `Extract paper references from this newsletter text (max 10):

${newsletterText.slice(0, 8000)}

Return JSON array only:
[{"title": "exact paper title", "context": "why mentioned"}]`;

    const raw = await callLLM(systemPrompt, userPrompt, 1024);
    const jsonStr = raw
      .replace(/^```(?:json)?\s*/m, "")
      .replace(/```\s*$/m, "")
      .trim();
    const papers = JSON.parse(jsonStr);
    if (!Array.isArray(papers)) return [];

    // Resolve arXiv IDs via arXiv search API
    const resolved = [];
    for (const p of papers.slice(0, 5)) {
      if (!p.title) continue;
      try {
        const searchUrl = `https://export.arxiv.org/api/query?search_query=ti:"${encodeURIComponent(p.title)}"&max_results=1`;
        const res = await fetch(searchUrl, {
          signal: AbortSignal.timeout(10_000),
        });
        if (!res.ok) continue;
        const xml = await res.text();
        const idMatch = xml.match(
          /<id>http:\/\/arxiv\.org\/abs\/([\d.]+)(v\d+)?<\/id>/,
        );
        if (idMatch) {
          const entry = xml.match(/<entry>([\s\S]*?)<\/entry>/)?.[1] || "";
          const title =
            entry
              .match(/<title>([\s\S]*?)<\/title>/)?.[1]
              ?.replace(/\s+/g, " ")
              .trim() || p.title;
          const abstract =
            entry.match(/<summary>([\s\S]*?)<\/summary>/)?.[1]?.trim() || "";

          resolved.push({
            id: idMatch[1],
            title,
            summary: abstract.slice(0, 200),
            context: p.context,
            org: "",
            keywords: [],
            githubUrl: "",
            githubStars: null,
            source: "newsletter",
          });
        }
      } catch {
        // skip individual paper resolution failures
      }
    }
    return resolved;
  } catch (e) {
    log.warn(`Newsletter paper extraction failed: ${e.message}`);
    return [];
  }
}

// ── Merge & Deduplicate ─────────────────────────────────────────────

function mergePapers(hfPapers, s2Papers, nlPapers) {
  const byId = new Map();

  // Insert all papers, tracking sources
  for (const p of [...hfPapers, ...s2Papers, ...nlPapers]) {
    if (!p.id) continue;
    const existing = byId.get(p.id);
    if (existing) {
      existing.sources.push(p.source);
      // Merge fields: prefer non-empty
      if (!existing.summary && p.summary) existing.summary = p.summary;
      if (!existing.githubUrl && p.githubUrl) existing.githubUrl = p.githubUrl;
      if (!existing.org && p.org) existing.org = p.org;
      if (p.context) existing.context = p.context;
      if (p.upvotes) existing.upvotes = p.upvotes;
      if (p.citations) existing.citations = p.citations;
    } else {
      byId.set(p.id, {
        ...p,
        sources: [p.source],
        upvotes: p.upvotes || 0,
        citations: p.citations || 0,
      });
    }
  }

  const all = [...byId.values()];

  // Score: multi-source bonus + upvotes + citations
  for (const p of all) {
    p.multiSource = p.sources.length > 1;
    p.score =
      (p.multiSource ? 1000 : 0) + (p.upvotes || 0) * 2 + (p.citations || 0);
  }

  // Sort by score descending
  all.sort((a, b) => b.score - a.score);

  return all.slice(0, MAX_PAPERS);
}

// ── Chinese Translation (batch) ─────────────────────────────────────

async function translatePaperTitles(papers) {
  if (!papers.length) return papers;

  try {
    const { callLLM } = await import("./lib/llm.mjs");

    const input = papers.map((p, i) => ({
      i,
      title: p.title,
      summary: (p.summary || "").slice(0, 150),
    }));

    const systemPrompt = `You translate AI paper titles and summaries to Chinese for a developer audience. Return a JSON array.`;

    const userPrompt = `Translate each paper's title to Chinese and write a one-line Chinese summary (15-30 chars, what they did + key result). Be concise and specific.

${JSON.stringify(input)}

Return JSON array (same order, same length):
[{"i": 0, "title_zh": "中文标题", "summary_zh": "一句话中文简介"}]`;

    const raw = await callLLM(systemPrompt, userPrompt, 2048);
    const jsonStr = raw
      .replace(/^```(?:json)?\s*/m, "")
      .replace(/```\s*$/m, "")
      .trim();
    const results = JSON.parse(jsonStr);

    if (!Array.isArray(results)) return papers;

    // Merge translations back
    for (const r of results) {
      if (r.i != null && papers[r.i]) {
        papers[r.i].titleZh = r.title_zh || "";
        papers[r.i].summaryZh = r.summary_zh || "";
      }
    }
    return papers;
  } catch (e) {
    log.warn(`Title translation failed (non-fatal): ${e.message}`);
    return papers;
  }
}

// ── Format Markdown ─────────────────────────────────────────────────

function sourceLabel(sources) {
  const labels = [];
  if (sources.includes("hf"))
    labels.push("HF");
  if (sources.includes("s2"))
    labels.push("Semantic Scholar");
  if (sources.includes("newsletter")) labels.push("Newsletter");
  return labels;
}

function formatPaperLine(p) {
  const parts = [];

  // Checkbox + Chinese title (fallback to English) + ID
  const displayTitle = p.titleZh || p.title;
  parts.push(`- [ ] **${displayTitle}** \`${p.id}\``);

  // Chinese summary (fallback to English summary)
  const desc = p.summaryZh
    || (p.summary ? p.summary.slice(0, 120).replace(/\n/g, " ") : "")
    || p.context || "";
  if (desc) parts[0] += ` — ${desc}`;

  // Original English title (if Chinese title exists)
  if (p.titleZh) {
    parts.push(`  *${p.title}*`);
  }

  // Metadata line
  const meta = [];
  if (p.upvotes) meta.push(`HF ${p.upvotes}↑`);
  if (p.citations) meta.push(`${p.citations} citations`);
  const srcLabels = sourceLabel(p.sources);
  for (const l of srcLabels) {
    if (!meta.some((m) => m.includes(l))) meta.push(l);
  }
  if (p.org) meta.push(p.org);

  const links = [`[arXiv](https://arxiv.org/abs/${p.id})`];
  if (p.githubUrl) {
    const starStr =
      p.githubStars != null ? ` ${p.githubStars}⭐` : "";
    links.push(`[GitHub](${p.githubUrl})${starStr}`);
  }

  parts.push(`  \`${meta.join(" · ")}\` · ${links.join(" · ")}`);

  return parts.join("\n");
}

function generateMarkdown(papers, dateLabel) {
  const multi = papers.filter((p) => p.multiSource);
  const hfOnly = papers.filter(
    (p) => !p.multiSource && p.sources.includes("hf"),
  );
  const s2Only = papers.filter(
    (p) => !p.multiSource && p.sources.includes("s2"),
  );
  const nlOnly = papers.filter(
    (p) => !p.multiSource && p.sources.includes("newsletter"),
  );

  const lines = [];

  // Frontmatter
  lines.push("---");
  lines.push("type: radar");
  lines.push("tags: [论文, AI]");
  lines.push(`created: ${dateLabel}`);
  lines.push("---");
  lines.push("");

  lines.push(`# 论文雷达 ${dateLabel}`);
  lines.push("");
  lines.push(
    "> 勾选想深读的，运行 `node scripts/translate-paper.mjs <id>` 翻译入库。",
  );
  lines.push("> 3 天未处理自动归档。");
  lines.push("");

  if (multi.length) {
    lines.push("## 🔥 多源共振");
    lines.push("");
    for (const p of multi) lines.push(formatPaperLine(p));
    lines.push("");
  }

  if (hfOnly.length) {
    lines.push("## 📄 社区热门（HuggingFace）");
    lines.push("");
    for (const p of hfOnly) lines.push(formatPaperLine(p));
    lines.push("");
  }

  if (s2Only.length) {
    lines.push("## 🎓 高引论文（Semantic Scholar）");
    lines.push("");
    for (const p of s2Only) lines.push(formatPaperLine(p));
    lines.push("");
  }

  if (nlOnly.length) {
    lines.push("## 📰 行业关注（Newsletter）");
    lines.push("");
    for (const p of nlOnly) lines.push(formatPaperLine(p));
    lines.push("");
  }

  if (!papers.length) {
    lines.push("_今日无论文信号。_");
    lines.push("");
  }

  // Stats footer
  const srcStats = [];
  const hfCount = papers.filter((p) => p.sources.includes("hf")).length;
  const s2Count = papers.filter((p) => p.sources.includes("s2")).length;
  const nlCount = papers.filter((p) => p.sources.includes("newsletter")).length;
  if (hfCount) srcStats.push(`HF ${hfCount}`);
  if (s2Count) srcStats.push(`S2 ${s2Count}`);
  if (nlCount) srcStats.push(`NL ${nlCount}`);
  lines.push(
    `---\n来源统计: ${srcStats.join(" · ") || "无"} | 多源共振: ${multi.length}`,
  );

  return lines.join("\n");
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const dateIdx = args.indexOf("--date");
  const dateLabel = dateIdx !== -1 ? args[dateIdx + 1] : todayCST();

  // Use DeepSeek for newsletter extraction (fast + cheap)
  if (!process.env.LLM_PROVIDER) {
    process.env.LLM_PROVIDER = "deepseek";
  }

  log.info(`Paper Radar for: ${dateLabel}`);
  log.info(`Options: dry-run=${dryRun}`);

  // Fetch from all 3 sources in parallel (each with independent error handling)
  const [hfPapers, s2Papers, newsletterData] = await Promise.all([
    fetchHFPapers(),
    fetchSemanticScholarTrending(),
    (async () => loadNewsletterText(dateLabel))(),
  ]);

  log.info(
    `Sources: HF=${hfPapers.length}, S2=${s2Papers.length}, Newsletter=${newsletterData ? "available" : "none"}`,
  );

  // Extract papers from newsletters (sequential, needs LLM)
  let nlPapers = [];
  if (newsletterData) {
    log.info("Extracting papers from newsletter text via LLM...");
    nlPapers = await extractPapersFromNewsletters(newsletterData.texts);
    log.info(`Newsletter papers extracted: ${nlPapers.length}`);
  }

  // Merge and deduplicate
  const papers = mergePapers(hfPapers, s2Papers, nlPapers);
  const multiCount = papers.filter((p) => p.multiSource).length;
  log.info(
    `Merged: ${papers.length} papers (${multiCount} multi-source)`,
  );

  // Translate titles and summaries to Chinese
  if (papers.length) {
    log.info("Translating titles to Chinese...");
    await translatePaperTitles(papers);
    const zhCount = papers.filter((p) => p.titleZh).length;
    log.info(`Translated: ${zhCount}/${papers.length}`);
  }

  // Generate markdown
  const markdown = generateMarkdown(papers, dateLabel);

  if (dryRun) {
    log.info("\n── Preview ─────────────────────────────────");
    console.log(markdown);
    log.info("── End Preview ─────────────────────────────\n");
    log.info("[DRY RUN] No file written.");
    return;
  }

  // Write to Vault
  const outPath = pathMod.join(VAULT_RADAR_DIR, `${dateLabel}.md`);
  fs.mkdirSync(VAULT_RADAR_DIR, { recursive: true });
  fs.writeFileSync(outPath, markdown, "utf8");
  log.success(`Radar written: ${outPath}`);
  log.info(`  Papers: ${papers.length} | Multi-source: ${multiCount}`);

  // Auto-archive old radars (> 3 days)
  const archiveDir = pathMod.join(VAULT_RADAR_DIR, "_归档");
  fs.mkdirSync(archiveDir, { recursive: true });
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 3);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const files = fs.readdirSync(VAULT_RADAR_DIR).filter((f) => f.endsWith(".md") && f < cutoffStr);
  for (const f of files) {
    const src = pathMod.join(VAULT_RADAR_DIR, f);
    const dst = pathMod.join(archiveDir, f);
    fs.renameSync(src, dst);
    log.info(`  Archived: ${f}`);
  }
}

main().catch((err) => {
  log.error(err.message);
  process.exit(1);
});
