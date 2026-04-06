#!/usr/bin/env node

/**
 * Translate an arXiv paper to Chinese and insert into articles table.
 *
 * Usage:
 *   node scripts/translate-paper.mjs 2603.23483              # Translate by arXiv ID
 *   node scripts/translate-paper.mjs 2603.23483 --dry-run    # Preview without DB write
 *   node scripts/translate-paper.mjs --local paper.pdf --arxiv-id 2307.15818          # Local PDF
 *   node scripts/translate-paper.mjs --local paper.pdf --arxiv-id 2307.15818 --dry-run
 *
 * Flow:
 *   1. Fetch metadata from arXiv API (or extract from local PDF via LLM)
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
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "fs";
import { resolve, join } from "path";

const log = createLogger("paper");

// ── arXiv Metadata ──────────────────────────────────────────────────

async function fetchArxivMetadata(arxivId) {
  const url = `https://export.arxiv.org/api/query?id_list=${arxivId}`;
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

  let res;
  try {
    res = await fetch(url, {
      signal: AbortSignal.timeout(30_000),
      headers: { "User-Agent": "SkillNav-PaperBot/1.0 (skillnav.dev)" },
    });
  } catch (e) {
    log.warn(`ar5iv fetch failed: ${e.message}`);
    return null;
  }

  if (!res.ok) {
    log.warn(`ar5iv returned ${res.status}`);
    return null;
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  // Remove unwanted elements
  $("nav, header, footer, .ltx_bibliography, .ltx_appendix, script, style, .ltx_page_footer, .ltx_page_header").remove();

  // ar5iv image src is relative (e.g. "2604.01658v1/x2.png")
  // HTML is served at /html/XXXX.XXXXX, so images resolve to /html/XXXX.XXXXXv1/x2.png
  const baseUrl = "https://arxiv.org/html";

  // Convert a DOM subtree to markdown-like text preserving figures and equations
  function toMarkdown($el) {
    const parts = [];
    $el.children().each((_, child) => {
      const $child = $(child);
      const tag = child.tagName?.toLowerCase() || "";
      const cls = $child.attr("class") || "";

      // Figure: embed as markdown image
      if (tag === "figure" || cls.includes("ltx_figure")) {
        const caption = $child.find("figcaption, .ltx_caption").text().trim();
        const imgSrc = $child.find("img").first().attr("src");
        if (imgSrc) {
          const imgUrl = imgSrc.startsWith("http") ? imgSrc : `${baseUrl}/${imgSrc}`;
          parts.push(`\n\n![${caption}](${imgUrl})\n\n`);
        } else if (caption) {
          parts.push(`\n\n[${caption}]\n\n`);
        }
        return;
      }

      // Equation block: preserve LaTeX
      if (cls.includes("ltx_equation") || cls.includes("ltx_eqn")) {
        const latex = $child.find("math").attr("alttext") || $child.find(".ltx_Math").attr("alttext") || $child.text().trim();
        if (latex) {
          parts.push(`\n\n$$${latex}$$\n\n`);
        }
        return;
      }

      // Table: preserve as-is with caption
      if (tag === "table" || cls.includes("ltx_tabular") || cls.includes("ltx_table")) {
        const caption = $child.find("figcaption, .ltx_caption, caption").text().trim();
        const text = $child.text().trim();
        if (caption || text.length > 50) {
          parts.push(`\n\n[Table: ${caption || text.slice(0, 100)}]\n\n`);
        }
        return;
      }

      // Paragraph with inline math
      if (tag === "p" || cls.includes("ltx_para")) {
        let pText = "";
        $child.contents().each((_, node) => {
          if (node.type === "text") {
            pText += $(node).text();
          } else {
            const $node = $(node);
            const nodeCls = $node.attr("class") || "";
            if (nodeCls.includes("ltx_Math") || node.tagName === "math") {
              const alt = $node.attr("alttext") || $node.text();
              pText += ` $${alt}$ `;
            } else {
              pText += $node.text();
            }
          }
        });
        if (pText.trim()) parts.push(pText.trim());
        return;
      }

      // Nested sections: recurse into them to capture figures/content
      if (cls.includes("ltx_section") || cls.includes("ltx_subsection") || cls.includes("ltx_subsubsection") || tag === "section") {
        const nested = toMarkdown($child);
        if (nested) parts.push(nested);
        return;
      }

      // Default: extract text
      const text = $child.text().trim();
      if (text) parts.push(text);
    });

    return parts.join("\n\n");
  }

  // Extract sections
  const sections = [];
  const article = $(".ltx_document, .ltx_page_content, article, main").first();
  const root = article.length ? article : $("body");

  // Try to get structured sections
  root.find(".ltx_section, section").each((_, el) => {
    const $el = $(el);
    const heading = $el.find("h2, h3, .ltx_title").first().text().trim();
    const text = toMarkdown($el);
    if (text.length > 50) {
      sections.push({ heading, text });
    }
  });

  // Fallback: extract all text if no sections found
  if (!sections.length) {
    const fullText = toMarkdown(root);
    if (fullText.length > 500) {
      sections.push({ heading: "", text: fullText });
    }
  }

  if (!sections.length) {
    log.warn("ar5iv HTML parsed but no meaningful content found");
    return null;
  }

  // Strip bare BibTeX citation keys (e.g. "roberts2021hypersim", "li2021openrooms ; zhu2022learning")
  // These appear when ar5iv renders \cite{} as link text = citation key
  for (const s of sections) {
    s.text = s.text.replace(/\s+[a-z]+\d{4}[a-z][a-z0-9+]*(?:\s*[;,]\s*[a-z]+\d{4}[a-z][a-z0-9+]*)*/g, "");
  }

  const totalChars = sections.reduce((sum, s) => sum + s.text.length, 0);
  const figCount = sections.reduce((sum, s) => sum + (s.text.match(/!\[/g) || []).length, 0);
  const eqCount = sections.reduce((sum, s) => sum + (s.text.match(/\$\$/g) || []).length / 2, 0);
  log.info(`ar5iv: ${sections.length} sections, ${totalChars} chars, ${figCount} figures, ${Math.floor(eqCount)} equations`);
  return sections;
}

async function fetchPdfText(arxivId) {
  const url = `https://arxiv.org/pdf/${arxivId}`;
  log.info(`Trying PDF fallback: ${url}`);

  let res;
  try {
    res = await fetch(url, {
      signal: AbortSignal.timeout(60_000),
      headers: { "User-Agent": "SkillNav-PaperBot/1.0 (skillnav.dev)" },
    });
  } catch (e) {
    log.warn(`PDF fetch failed: ${e.message}`);
    return null;
  }

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
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
    const numPages = doc.numPages;

    const pageTexts = [];
    for (let i = 1; i <= numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const text = content.items.map((item) => item.str).join(" ");
      pageTexts.push(text);
    }
    doc.destroy();

    const fullText = pageTexts.join("\n\n");
    if (fullText.length < 500) {
      log.warn(`PDF text too short: ${fullText.length} chars`);
      return null;
    }

    log.info(`PDF: ${numPages} pages, ${fullText.length} chars`);

    // Group pages into ~8K char chunks
    const CHUNK_TARGET = 8000;
    const sections = [];
    let chunk = "";
    let startPage = 1;

    for (let i = 0; i < pageTexts.length; i++) {
      const pageText = pageTexts[i];
      if (/^\s*References\s/i.test(pageText)) break;

      if (chunk.length + pageText.length > CHUNK_TARGET && chunk.length > 0) {
        sections.push({ heading: `Pages ${startPage}-${i}`, text: chunk.trim() });
        chunk = pageText;
        startPage = i + 1;
      } else {
        chunk += (chunk ? "\n\n" : "") + pageText;
      }
    }
    if (chunk.trim().length > 100) {
      sections.push({ heading: `Pages ${startPage}-${pageTexts.length}`, text: chunk.trim() });
    }

    const result = sections.length ? sections : [{ heading: "", text: fullText }];
    // Strip bare BibTeX citation keys from PDF text
    for (const s of result) {
      s.text = s.text.replace(/\s+[a-z]+\d{4}[a-z][a-z0-9+]*(?:\s*[;,]\s*[a-z]+\d{4}[a-z][a-z0-9+]*)*/g, "");
    }
    return result;
  } catch (e) {
    log.warn(`PDF parse failed: ${e.message}`);
    return null;
  }
}

// ── Local PDF Extraction ───────────────────────────────────────────

async function parseLocalPdf(filePath) {
  const absPath = resolve(filePath);
  if (!existsSync(absPath)) throw new Error(`File not found: ${absPath}`);

  const buffer = readFileSync(absPath);
  const MAX_PDF_SIZE = 50 * 1024 * 1024;
  if (buffer.length > MAX_PDF_SIZE) {
    throw new Error(`PDF too large: ${(buffer.length / 1024 / 1024).toFixed(1)} MB (limit: 50 MB)`);
  }

  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
  const numPages = doc.numPages;

  // Extract text from all pages
  const pageTexts = [];
  for (let i = 1; i <= numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((item) => item.str).join(" ");
    pageTexts.push(text);
  }
  doc.destroy();

  const fullText = pageTexts.join("\n\n");
  if (fullText.length < 500) {
    throw new Error(`PDF text too short: ${fullText.length} chars`);
  }

  log.info(`Local PDF: ${numPages} pages, ${fullText.length} chars`);

  // Group pages into ~8K char chunks (PDF text lacks section markers)
  const CHUNK_TARGET = 8000;
  const sections = [];
  let chunk = "";
  let startPage = 1;

  for (let i = 0; i < pageTexts.length; i++) {
    const pageText = pageTexts[i];
    // Skip reference pages (heuristic: "References" at start of page)
    if (/^\s*References\s/i.test(pageText)) break;

    if (chunk.length + pageText.length > CHUNK_TARGET && chunk.length > 0) {
      sections.push({ heading: `Pages ${startPage}-${i}`, text: chunk.trim() });
      chunk = pageText;
      startPage = i + 1;
    } else {
      chunk += (chunk ? "\n\n" : "") + pageText;
    }
  }
  if (chunk.trim().length > 100) {
    sections.push({ heading: `Pages ${startPage}-${pageTexts.length}`, text: chunk.trim() });
  }

  return {
    sections: sections.length ? sections : [{ heading: "", text: fullText }],
    rawText: fullText,
  };
}

async function extractMetadataFromText(rawText) {
  const { callLLM } = await import("./lib/llm.mjs");

  const snippet = rawText.slice(0, 3000);
  const systemPrompt = `You are an academic paper metadata extractor. Extract metadata from the first few pages of a paper. Return valid JSON only.`;
  const userPrompt = `Extract metadata from this paper text:

${snippet}

Return JSON:
{
  "title": "exact English title of the paper",
  "authors": ["author1", "author2", "..."],
  "abstract": "the full abstract text"
}`;

  const raw = await callLLM(systemPrompt, userPrompt, 2048);
  const jsonStr = raw.replace(/^```(?:json)?\s*/m, "").replace(/```\s*$/m, "").trim();
  return JSON.parse(jsonStr);
}

// ── LLM Translation ────────────────────────────────────────────────

async function translateSection(heading, text, context) {
  const headingInstruction = heading ? `Section heading: "${heading}"` : "No section heading";

  const systemPrompt = `You are a senior Chinese tech translator specializing in AI/ML research papers.
Translate the following academic paper section into polished, readable Chinese.

## Critical Rules
- NEVER start with "本文介绍了", "本文探讨了", "本文提出了"
- NEVER use filler: 然而, 此外, 值得注意的是, 综上所述
- NEVER add commentary, opinions, or analysis not in the original
- Translate FAITHFULLY — do not rewrite for marketing effect

## Preserve Exactly (DO NOT translate or modify)
- Markdown images: ![caption](url) — keep the ENTIRE syntax unchanged
- LaTeX equations: $$...$$ and $...$ — keep the math content unchanged
- Citation markers: [1], [2, 3], etc.
- Table placeholders: [Table: ...]

## Translation Style
- Natural Chinese academic writing, concise and direct
- For well-known terms (Transformer, attention, BERT, LLM, etc.), keep English
- For domain terms, bracket notation on first use: 视觉语言模型（Vision-Language Model）
- Translate "Figure X" → "图X", "Table X" → "表X", "Eq. (X)" → "式(X)"
- Use ## for section headings, - for lists, **bold** for emphasis

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

// ── Vault Write ─────────────────────────────────────────────────────

const VAULT_PAPER_DIR = join(process.env.HOME, "Vault/知识库/AI/论文");

function writeToVault(arxivId, record, paperMeta) {
  const safeId = arxivId.replace(/[/.]/g, "-");
  // Short slug: first 40 chars of English title
  const titleSlug = record.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 40)
    .replace(/-+$/, "");
  const filename = `${safeId}-${titleSlug}.md`;
  const filePath = join(VAULT_PAPER_DIR, filename);

  const tags = (paperMeta.tags || []).map((t) => t.toLowerCase());
  if (!tags.includes("论文")) tags.unshift("论文");
  if (!tags.includes("ai")) tags.unshift("AI");

  const frontmatter = [
    "---",
    "type: reusable",
    `tags: [${tags.join(", ")}]`,
    "level: 2",
    `created: ${new Date().toISOString().slice(0, 10)}`,
    `source: https://arxiv.org/abs/${arxivId}`,
    `arxiv_id: "${arxivId}"`,
    "status: draft",
    "---",
  ].join("\n");

  const body = [
    `# ${record.title_zh}`,
    "",
    `> **原标题**: ${record.title}`,
    `> **arXiv**: [${arxivId}](https://arxiv.org/abs/${arxivId})`,
    "",
    "## 我的看法",
    "",
    "_（入库后补一句话批注）_",
    "",
    "## 导读",
    "",
    record.intro_zh || record.summary_zh || "",
    "",
    "---",
    "",
    record.content_zh,
  ].join("\n");

  mkdirSync(VAULT_PAPER_DIR, { recursive: true });
  writeFileSync(filePath, `${frontmatter}\n\n${body}`, "utf8");
  return filePath;
}

// ── Slug Generation ─────────────────────────────────────────────────

function generateSlug(title, id) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60)
    .replace(/-+$/, "");
  return `paper-${base}-${id}`;
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const forceOverwrite = args.includes("--force");
  const localIdx = args.indexOf("--local");
  const sourceMdIdx = args.indexOf("--source-md");
  const arxivIdx = args.indexOf("--arxiv-id");
  const isLocal = localIdx !== -1;
  const isSourceMd = sourceMdIdx !== -1;

  let arxivId = null;
  let localPath = null;
  let sourceMdPath = null;

  if (isSourceMd) {
    sourceMdPath = args[sourceMdIdx + 1];
    if (!sourceMdPath || sourceMdPath.startsWith("--")) {
      console.error("Usage: node scripts/translate-paper.mjs --source-md <md-path> --arxiv-id <id> [--dry-run]");
      process.exit(1);
    }
    if (arxivIdx !== -1) {
      arxivId = args[arxivIdx + 1];
    }
    if (!arxivId) {
      console.error("--source-md requires --arxiv-id for metadata lookup");
      process.exit(1);
    }
  } else if (isLocal) {
    localPath = args[localIdx + 1];
    if (!localPath || localPath.startsWith("--")) {
      console.error("Usage: node scripts/translate-paper.mjs --local <pdf-path> --arxiv-id <id> [--dry-run]");
      process.exit(1);
    }
    if (arxivIdx !== -1) {
      arxivId = args[arxivIdx + 1];
    }
  } else {
    arxivId = args.find((a) => !a.startsWith("--"));
    if (!arxivId) {
      console.error("Usage: node scripts/translate-paper.mjs <arxiv-id> [--dry-run]");
      console.error("       node scripts/translate-paper.mjs --local <pdf-path> --arxiv-id <id> [--dry-run]");
      console.error("       node scripts/translate-paper.mjs --source-md <md-path> --arxiv-id <id> [--dry-run]");
      process.exit(1);
    }
    // Validate arXiv ID format (YYMM.NNNNN with optional version)
    if (!/^\d{4}\.\d{4,5}(v\d+)?$/.test(arxivId)) {
      console.error(`Invalid arXiv ID format: "${arxivId}". Expected: YYMM.NNNNN (e.g., 2603.23483)`);
      process.exit(1);
    }
  }

  // Use DeepSeek for paper translation (fast + cheap)
  if (!process.env.LLM_PROVIDER) {
    process.env.LLM_PROVIDER = "deepseek";
  }

  validateEnv(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
  const { name, model } = getProviderInfo();
  log.info(`Translating paper: ${isSourceMd ? sourceMdPath : isLocal ? localPath : arxivId}`);
  log.info(`LLM provider: ${name} (${model})`);
  log.info(`Options: source-md=${isSourceMd}, local=${isLocal}, dry-run=${dryRun}`);

  let meta, sections, textSource;

  if (isSourceMd) {
    // ── Pre-extracted Markdown mode (e.g. MinerU CLI output) ──
    log.info("Step 1: Fetching arXiv metadata...");
    meta = await fetchArxivMetadata(arxivId);
    log.info(`Title: ${meta.title}`);

    log.info("Step 2: Reading pre-extracted markdown...");
    const absPath = resolve(sourceMdPath);
    if (!existsSync(absPath)) {
      log.error(`File not found: ${absPath}`);
      process.exit(1);
    }
    const md = readFileSync(absPath, "utf-8");
    // Split by ## headings into sections
    const parts = md.split(/^(?=## )/m);
    sections = parts.map((part) => {
      const headingMatch = part.match(/^## (.+)/);
      const heading = headingMatch ? headingMatch[1].trim() : "";
      const text = headingMatch ? part.slice(headingMatch[0].length).trim() : part.trim();
      return { heading, text };
    }).filter((s) => s.text.length > 50);
    textSource = "source-md";
  } else if (isLocal) {
    // ── Local PDF mode ──
    log.info("Step 1: Parsing local PDF...");
    const { sections: pdfSections, rawText } = await parseLocalPdf(localPath);
    sections = pdfSections;
    textSource = "local-pdf";

    log.info("Step 2: Extracting metadata via LLM...");
    const extracted = await extractMetadataFromText(rawText);
    meta = {
      title: extracted.title || localPath.replace(/.*\//, "").replace(/\.pdf$/i, ""),
      abstract: extracted.abstract || "",
      authors: extracted.authors || [],
      categories: [],
      published: null,
    };
    log.info(`Title: ${meta.title}`);
    log.info(`Authors: ${meta.authors.slice(0, 3).join(", ")}${meta.authors.length > 3 ? " et al." : ""}`);
  } else {
    // ── arXiv mode ──
    log.info("Step 1: Fetching arXiv metadata...");
    meta = await fetchArxivMetadata(arxivId);
    log.info(`Title: ${meta.title}`);
    log.info(`Authors: ${meta.authors.slice(0, 3).join(", ")}${meta.authors.length > 3 ? " et al." : ""}`);
    log.info(`Categories: ${meta.categories.join(", ")}`);

    log.info("Step 2: Fetching full text...");
    sections = await fetchAr5ivHtml(arxivId);
    textSource = "ar5iv";

    if (!sections) {
      sections = await fetchPdfText(arxivId);
      textSource = "pdf";
    }

    if (!sections) {
      log.warn("Both ar5iv and PDF failed. Using abstract only.");
      sections = [{ heading: "Abstract", text: meta.abstract || "" }];
      textSource = "abstract-only";
    }
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

  // Sanitize text for PostgreSQL (remove null bytes, unsupported Unicode, and \r\n)
  const sanitize = (s) => (s ? s.replace(/\u0000/g, "").replace(/\\u0000/g, "").replace(/\r\n/g, "\n") : s);

  // Step 5: Build record
  const sourceUrl = arxivId ? `https://arxiv.org/abs/${arxivId}` : null;
  const slugId = arxivId ? arxivId.replace(".", "") : Date.now().toString(36);
  const slug = generateSlug(meta.title, slugId);

  const record = {
    slug,
    title: meta.title,
    title_zh: paperMeta.title_zh,
    intro_zh: paperMeta.intro_zh || null,
    summary: meta.abstract?.slice(0, 500),
    summary_zh: paperMeta.summary_zh,
    content: sanitize(sections.map((s) => (s.heading ? `## ${s.heading}\n\n${s.text}` : s.text)).join("\n\n")),
    content_zh: sanitize(contentZh),
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
    // Still write Vault copy in dry-run for preview
    if (arxivId) {
      try {
        const vaultPath = writeToVault(arxivId, record, paperMeta);
        log.info(`[DRY RUN] Vault preview written: ${vaultPath}`);
      } catch (e) {
        log.warn(`Vault write failed: ${e.message}`);
      }
    }
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

  if (existing?.length && !forceOverwrite) {
    log.warn(`Paper already exists: ${existing[0].slug} (id: ${existing[0].id})`);
    log.warn("Use --force to overwrite existing translation.");
    return;
  }

  let data, error;
  if (existing?.length && forceOverwrite) {
    log.info(`Overwriting existing: ${existing[0].slug} (id: ${existing[0].id})`);
    ({ data, error } = await supabase
      .from("articles")
      .update(record)
      .eq("id", existing[0].id)
      .select("id, slug")
      .single());
  } else {
    ({ data, error } = await supabase
      .from("articles")
      .insert(record)
      .select("id, slug")
      .single());
  }

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

  // Step 7: Write to Vault (best-effort, don't fail on error)
  if (arxivId) {
    try {
      const vaultPath = writeToVault(arxivId, record, paperMeta);
      log.success(`Vault copy: ${vaultPath}`);
    } catch (e) {
      log.warn(`Vault write failed (non-fatal): ${e.message}`);
    }
  }
}

main().catch((err) => {
  log.error(err.message);
  process.exit(1);
});
