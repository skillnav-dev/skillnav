#!/usr/bin/env node

/**
 * Translate an arXiv paper to Chinese and insert into articles table.
 *
 * Usage:
 *   node scripts/translate-paper.mjs 2603.23483              # Translate by arXiv ID
 *   node scripts/translate-paper.mjs 2603.23483 --dry-run    # Preview without DB write
 *
 * Flow:
 *   1. Fetch metadata from arXiv API (title, authors, abstract, categories)
 *   2. Fetch full text: ar5iv HTML (preferred) → PDF fallback → abstract-only fallback
 *   3. Split by sections, translate each via LLM (DeepSeek default)
 *   4. INSERT into articles table as draft
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { createAdminClient } from "./lib/supabase-admin.mjs";
import { createLogger } from "./lib/logger.mjs";
import { validateEnv } from "./lib/validate-env.mjs";
import { getProviderInfo, callLLMText } from "./lib/llm.mjs";
import * as cheerio from "cheerio";

const log = createLogger("paper");

// ── arXiv Metadata ──────────────────────────────────────────────────

async function fetchArxivMetadata(arxivId) {
  const url = `http://export.arxiv.org/api/query?id_list=${arxivId}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`arXiv API returned ${res.status}`);

  const xml = await res.text();

  // Parse XML with regex (lightweight, no xml2js dependency)
  const entry = xml.match(/<entry>([\s\S]*?)<\/entry>/)?.[1];
  if (!entry) throw new Error(`No entry found for arXiv ID: ${arxivId}`);

  const title = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/\s+/g, " ").trim();
  const abstract = entry.match(/<summary>([\s\S]*?)<\/summary>/)?.[1]?.trim();
  const published = entry.match(/<published>([\s\S]*?)<\/published>/)?.[1]?.trim();

  // Authors
  const authorMatches = [...entry.matchAll(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/g)];
  const authors = authorMatches.map((m) => m[1].trim());

  // Categories
  const catMatches = [...entry.matchAll(/<category[^>]*term="([^"]+)"/g)];
  const categories = catMatches.map((m) => m[1]);

  if (!title) throw new Error(`Could not parse title for arXiv ID: ${arxivId}`);

  return { title, abstract, authors, categories, published };
}

// ── Full Text Extraction ────────────────────────────────────────────

async function fetchAr5ivHtml(arxivId) {
  const url = `https://arxiv.org/html/${arxivId}`;
  log.info(`Trying ar5iv HTML: ${url}`);

  const res = await fetch(url, {
    signal: AbortSignal.timeout(30_000),
    headers: { "User-Agent": "SkillNav-PaperBot/1.0 (skillnav.dev)" },
  });

  if (!res.ok) {
    log.warn(`ar5iv returned ${res.status}`);
    return null;
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  // Remove unwanted elements
  $("nav, header, footer, .ltx_bibliography, .ltx_appendix, script, style, .ltx_page_footer, .ltx_page_header").remove();

  // Extract sections
  const sections = [];
  const article = $(".ltx_document, .ltx_page_content, article, main").first();
  const root = article.length ? article : $("body");

  // Try to get structured sections
  root.find(".ltx_section, section").each((_, el) => {
    const heading = $(el).find("h2, h3, .ltx_title").first().text().trim();
    const text = $(el).text().trim();
    if (text.length > 50) {
      sections.push({ heading, text });
    }
  });

  // Fallback: extract all text if no sections found
  if (!sections.length) {
    const fullText = root.text().trim();
    if (fullText.length > 500) {
      sections.push({ heading: "", text: fullText });
    }
  }

  if (!sections.length) {
    log.warn("ar5iv HTML parsed but no meaningful content found");
    return null;
  }

  const totalChars = sections.reduce((sum, s) => sum + s.text.length, 0);
  log.info(`ar5iv: ${sections.length} sections, ${totalChars} chars`);
  return sections;
}

async function fetchPdfText(arxivId) {
  const url = `https://arxiv.org/pdf/${arxivId}`;
  log.info(`Trying PDF fallback: ${url}`);

  const res = await fetch(url, {
    signal: AbortSignal.timeout(60_000),
    headers: { "User-Agent": "SkillNav-PaperBot/1.0 (skillnav.dev)" },
  });

  if (!res.ok) {
    log.warn(`PDF download returned ${res.status}`);
    return null;
  }

  const buffer = Buffer.from(await res.arrayBuffer());

  // Guard against oversized PDFs (50 MB limit)
  const MAX_PDF_SIZE = 50 * 1024 * 1024;
  if (buffer.length > MAX_PDF_SIZE) {
    log.warn(`PDF too large: ${(buffer.length / 1024 / 1024).toFixed(1)} MB (limit: 50 MB)`);
    return null;
  }

  try {
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);

    if (!data.text || data.text.length < 500) {
      log.warn(`PDF text too short: ${data.text?.length || 0} chars`);
      return null;
    }

    log.info(`PDF: ${data.numpages} pages, ${data.text.length} chars`);

    // Split by common section headings
    const sectionPattern = /\n\s*(\d+\.?\s+[A-Z][A-Za-z\s:]+|Abstract|Introduction|Related Work|Method|Methodology|Experiments|Results|Conclusion|Discussion|References)\s*\n/g;
    const parts = data.text.split(sectionPattern);

    const sections = [];
    for (let i = 0; i < parts.length; i += 2) {
      const heading = i > 0 ? (parts[i - 1] || "").trim() : "";
      const text = parts[i].trim();
      // Skip references section
      if (heading.toLowerCase() === "references") break;
      if (text.length > 100) {
        sections.push({ heading, text });
      }
    }

    return sections.length ? sections : [{ heading: "", text: data.text }];
  } catch (e) {
    log.warn(`PDF parse failed: ${e.message}`);
    return null;
  }
}

// ── LLM Translation ────────────────────────────────────────────────

async function translateSection(heading, text, context) {
  const headingInstruction = heading ? `Section heading: "${heading}"` : "No section heading";

  const systemPrompt = `You are a senior Chinese tech translator specializing in AI/ML research papers.
Translate the following academic paper section into polished, readable Chinese.

## Rules
- Preserve all technical terms, formulas, figure/table references, and citation markers
- Use natural Chinese academic writing style (not machine translation)
- Keep equation numbers and cross-references as-is (e.g., "Eq. (3)", "Figure 2")
- For well-known terms (Transformer, attention, BERT, etc.), keep English
- For domain-specific terms, use Chinese with first-occurrence bracket notation: 注意力机制（Attention）
- Preserve markdown formatting: use ## for section headings, - for lists, **bold** for emphasis
- Do NOT add any commentary, opinions, or analysis not in the original

## Paper context
Title: ${context.title}
Authors: ${context.authors}`;

  const userPrompt = `${headingInstruction}

Translate this section to Chinese (output the translation only, no JSON wrapping):

${text.slice(0, 15000)}`;

  return callLLMText(systemPrompt, userPrompt, 8192);
}

async function generatePaperMeta(title, abstract, authors) {
  const { callLLM } = await import("./lib/llm.mjs");

  const systemPrompt = `You are a Chinese tech editor. Generate metadata for an AI paper translation. Return valid JSON only.`;

  const userPrompt = `Generate Chinese metadata for this paper:

Title: ${title}
Authors: ${authors.join(", ")}
Abstract: ${abstract}

Return JSON:
{
  "title_zh": "Chinese title (15-30 chars, convey core contribution)",
  "summary_zh": "Chinese summary (2-3 sentences, what they did + key result + why it matters)",
  "intro_zh": "导读 (2-3 sentences, the most interesting finding + who should read this)",
  "tags": ["3-5 English tags for categorization"]
}`;

  const raw = await callLLM(systemPrompt, userPrompt, 1024);
  const jsonStr = raw.replace(/^```(?:json)?\s*/m, "").replace(/```\s*$/m, "").trim();
  return JSON.parse(jsonStr);
}

// ── Slug Generation ─────────────────────────────────────────────────

function generateSlug(title, arxivId) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60)
    .replace(/-+$/, "");
  return `paper-${base}-${arxivId.replace(".", "")}`;
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const arxivId = args.find((a) => !a.startsWith("--"));

  if (!arxivId) {
    console.error("Usage: node scripts/translate-paper.mjs <arxiv-id> [--dry-run]");
    console.error("Example: node scripts/translate-paper.mjs 2603.23483");
    process.exit(1);
  }

  // Validate arXiv ID format (YYMM.NNNNN with optional version)
  if (!/^\d{4}\.\d{4,5}(v\d+)?$/.test(arxivId)) {
    console.error(`Invalid arXiv ID format: "${arxivId}". Expected: YYMM.NNNNN (e.g., 2603.23483)`);
    process.exit(1);
  }

  // Use DeepSeek for paper translation (fast + cheap)
  if (!process.env.LLM_PROVIDER) {
    process.env.LLM_PROVIDER = "deepseek";
  }

  validateEnv(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
  const { name, model } = getProviderInfo();
  log.info(`Translating paper: ${arxivId}`);
  log.info(`LLM provider: ${name} (${model})`);
  log.info(`Options: dry-run=${dryRun}`);

  // Step 1: Fetch metadata
  log.info("Step 1: Fetching arXiv metadata...");
  const meta = await fetchArxivMetadata(arxivId);
  log.info(`Title: ${meta.title}`);
  log.info(`Authors: ${meta.authors.slice(0, 3).join(", ")}${meta.authors.length > 3 ? " et al." : ""}`);
  log.info(`Categories: ${meta.categories.join(", ")}`);

  // Step 2: Fetch full text
  log.info("Step 2: Fetching full text...");
  let sections = await fetchAr5ivHtml(arxivId);
  let textSource = "ar5iv";

  if (!sections) {
    sections = await fetchPdfText(arxivId);
    textSource = "pdf";
  }

  if (!sections) {
    log.warn("Both ar5iv and PDF failed. Using abstract only.");
    sections = [{ heading: "Abstract", text: meta.abstract || "" }];
    textSource = "abstract-only";
  }

  const totalChars = sections.reduce((sum, s) => sum + s.text.length, 0);
  log.info(`Source: ${textSource}, ${sections.length} sections, ${totalChars} chars`);

  // Merge small sections to reduce LLM calls (target ~8K chars per chunk)
  const MERGE_TARGET = 8000;
  const merged = [];
  let buf = null;
  for (const s of sections) {
    if (!buf) {
      buf = { heading: s.heading, text: s.text };
    } else if (buf.text.length + s.text.length < MERGE_TARGET) {
      buf.text += `\n\n${s.heading ? `### ${s.heading}\n` : ""}${s.text}`;
    } else {
      merged.push(buf);
      buf = { heading: s.heading, text: s.text };
    }
  }
  if (buf) merged.push(buf);
  if (merged.length < sections.length) {
    log.info(`Merged ${sections.length} sections → ${merged.length} chunks for translation`);
  }

  // Step 3: Translate sections
  log.info("Step 3: Translating sections...");
  const translatedParts = [];
  const context = { title: meta.title, authors: meta.authors.join(", ") };

  for (let i = 0; i < merged.length; i++) {
    const s = merged[i];
    log.info(`  Translating chunk ${i + 1}/${merged.length}: ${s.heading || "(untitled)"} (${s.text.length} chars)`);
    const translated = await translateSection(s.heading, s.text, context);
    translatedParts.push(translated);
  }

  const contentZh = translatedParts.join("\n\n");
  log.info(`Translation complete: ${contentZh.length} chars`);

  // Step 4: Generate metadata
  log.info("Step 4: Generating Chinese metadata...");
  const paperMeta = await generatePaperMeta(meta.title, meta.abstract, meta.authors);
  log.info(`Title (zh): ${paperMeta.title_zh}`);

  // Step 5: Build record
  const slug = generateSlug(meta.title, arxivId);
  const sourceUrl = `https://arxiv.org/abs/${arxivId}`;

  const record = {
    slug,
    title: meta.title,
    title_zh: paperMeta.title_zh,
    intro_zh: paperMeta.intro_zh || null,
    summary: meta.abstract?.slice(0, 500),
    summary_zh: paperMeta.summary_zh,
    content: sections.map((s) => (s.heading ? `## ${s.heading}\n\n${s.text}` : s.text)).join("\n\n"),
    content_zh: contentZh,
    source_url: sourceUrl,
    source: "arxiv",
    article_type: "analysis",
    reading_time: Math.max(5, Math.round(contentZh.length / 800)),
    relevance_score: 4,
    content_tier: "translated",
    status: "draft",
    published_at: meta.published ? new Date(meta.published).toISOString() : new Date().toISOString(),
  };

  if (dryRun) {
    log.info("\n── Preview ─────────────────────────────────");
    log.info(`Slug: ${record.slug}`);
    log.info(`Title: ${record.title_zh}`);
    log.info(`Summary: ${record.summary_zh}`);
    log.info(`Reading time: ${record.reading_time} min`);
    log.info(`Source: ${textSource}`);
    log.info(`Content length: ${record.content_zh.length} chars`);
    log.info("\n── Content Preview (first 500 chars) ───────");
    console.log(record.content_zh.slice(0, 500));
    log.info("── End Preview ─────────────────────────────\n");
    log.info("[DRY RUN] No records written to database.");
    return;
  }

  // Step 6: Insert into DB
  log.info("Step 6: Inserting into articles table...");
  const supabase = createAdminClient();

  // Check for existing translation
  const { data: existing } = await supabase
    .from("articles")
    .select("id, slug")
    .eq("source_url", sourceUrl)
    .limit(1);

  if (existing?.length) {
    log.warn(`Paper already exists: ${existing[0].slug} (id: ${existing[0].id})`);
    log.warn("Use the admin UI to update existing translations.");
    return;
  }

  const { data, error } = await supabase
    .from("articles")
    .insert(record)
    .select("id, slug")
    .single();

  if (error) {
    log.error(`Insert failed: ${error.message}`);
    process.exit(1);
  }

  log.success(`Paper translated and saved!`);
  log.info(`  ID: ${data.id}`);
  log.info(`  Slug: ${data.slug}`);
  log.info(`  Preview: https://skillnav.dev/articles/${data.slug}`);
  log.info(`  Source: ${textSource} | Sections: ${sections.length} | Chars: ${contentZh.length}`);
  log.info(`  Status: draft (review and publish from admin UI)`);
}

main().catch((err) => {
  log.error(err.message);
  process.exit(1);
});
