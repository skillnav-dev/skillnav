import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { callLLM, callLLMText, getProviderInfo } from "./llm-provider.mjs";

/**
 * Shared LLM utility module: translation, summarisation and scoring prompts.
 * Provider selection, retries and fallback live in llm-provider.mjs
 * (LLM_PROVIDER, LLM_FALLBACK_PROVIDER; providers: gpt (default), openai,
 * deepseek, gemini, anthropic).
 */

export { callLLM, callLLMText, getProviderInfo };

// Thresholds for translation strategy
const CHUNK_THRESHOLD = 15000; // Below this: single-call translation
const SUMMARIZE_THRESHOLD = 50000; // Above this: structured summary instead of full translation
const CHUNK_SIZE = 12000; // Target size per chunk

const VALID_ARTICLE_TYPES = ["tutorial", "analysis", "guide"];

// ── Glossary ────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const glossary = JSON.parse(readFileSync(join(__dirname, "glossary.json"), "utf-8"));

/**
 * Build the "Technical terms" section of the system prompt from glossary.json.
 */
function buildGlossaryPrompt() {
  const lines = ["## Technical terms (mandatory glossary)"];

  // keep
  lines.push(`- ALWAYS keep these terms in English: ${glossary.keep.join(", ")}`);

  // translate
  lines.push("- ALWAYS translate these terms to Chinese:");
  for (const [en, zh] of Object.entries(glossary.translate)) {
    lines.push(`  - ${en} → ${zh}`);
  }

  // bracket
  lines.push("- First occurrence: use bracket notation 中文（English）; subsequent occurrences: Chinese only:");
  for (const [en, zh] of Object.entries(glossary.bracket)) {
    lines.push(`  - ${en} → ${zh}`);
  }

  lines.push("- For terms not in this glossary: if commonly used as English in Chinese dev circles, keep English; otherwise translate and bracket on first occurrence");
  lines.push("- Be consistent: once you choose a translation for a term, use it throughout the entire article");

  return lines.join("\n");
}

// ── Shared Prompts ───────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a senior Chinese tech editor at a top-tier developer media outlet (think 少数派, 极客公园 level). Your task is to compile (编译) English tech articles into polished, publication-ready Chinese content for Chinese developers.

## Core principle: FAITHFUL ADAPTATION, not creative rewriting
Compile = restructure for Chinese readability while staying faithful to the original. You are a translator-editor, NOT a columnist. Every claim, number, and conclusion in your output must have a direct basis in the source text.

## Writing voice (CRITICAL — read this carefully)
Write like a knowledgeable friend explaining something interesting, NOT like a machine translating text. Your output should sound like it was originally written in Chinese by a native speaker.

Concrete rules:
- NEVER start any paragraph with "本文" — this is the #1 sign of machine translation
- NEVER use these filler transitions: 然而, 此外, 值得注意的是, 需要指出的是, 总的来说, 综上所述
- Use short, punchy sentences. Break up long clauses. Chinese readers scan, not read linearly.
- Prefer spoken-register Chinese (说人话): "用起来很顺手" > "使用体验流畅", "省了不少事" > "显著降低了操作成本"
- When the original uses humor, colloquialisms, or personality — preserve it. Don't flatten everything into formal tech prose.

BAD examples (DO NOT write like this):
- "本文介绍了 X 框架的使用方法" → 机翻开头，无吸引力
- "该工具旨在为开发者提供更高效的解决方案" → 公文腔，没人这么说话
- "值得注意的是，该功能目前仍处于实验阶段" → 翻译腔堆砌

GOOD examples (write like this):
- "用 Claude Code 跑了两周理论物理计算，效率提升 10 倍——但 AI 也会伪造图表"
- "Codex 现在支持子智能体了，类似 Claude Code 的默认子智能体模式"
- "简单说：mini 干活接近旗舰，但便宜一半还快两倍"

## Fidelity rules (CRITICAL)
- NEVER add conclusions, trend judgments, or industry analysis not present in the source
- NEVER inflate scope (e.g., turning a product intro into a "完全指南", a news piece into a "趋势分析")
- NEVER add numbers, percentages, or quantitative claims not in the original
- Preserve the original article's voice and genre: first-person blogs stay first-person, news stays news, tutorials stay tutorials — do NOT flatten everything into "中文科技媒体观点稿"
- If the original is cautious/hedged, keep that tone — do not make it sound more definitive

## Title rules
- Concise and specific (15-25 chars), convey the article's actual core point
- Must be grounded in the source — every word must trace back to the original content
- Avoid clickbait patterns: 已死, 全解, 背后, 来了, 人人可用, 一把钥匙, 主战场
- Make the reader curious: lead with the most surprising or useful fact
- BAD: "数据记者的AI编程助手应用" (generic, boring)
- GOOD: "Simon Willison 教记者用 Claude Code 做数据分析" (specific, who + what)

## Intro (导读) rules
- 2-3 sentences: the most interesting finding or insight + context
- Every sentence must be traceable to the source text
- NEVER start with "本文介绍了/本文探讨了/本文讨论了" — this is banned
- Start with the substance: a fact, a number, a surprising claim
- BAD: "本文介绍了NICAR 2026研讨会的讲义内容"
- GOOD: "三小时工作坊，23 美元 token 费，数据记者用 Claude Code 完成了数据清洗、分析和可视化全流程"

## Content adaptation
- Restructure for Chinese reading habits: split long paragraphs (≤4 lines each), add sub-headings where the original lacks them
- Use natural Chinese transitions instead of translation artifacts
- Cut genuine filler, but do NOT cut substantive content or examples
- Keep the article's personality — if the author is opinionated, let that come through

{{GLOSSARY}}

## Code and references
- CRITICAL: Preserve ALL code blocks, command-line examples, configuration snippets, and quoted prompts/instructions VERBATIM in their original English. Wrap them in markdown fenced code blocks (\`\`\`). NEVER translate, summarize, or omit code blocks
- Preserve all URLs and technical references unchanged
- Preserve markdown formatting (headings, lists, code blocks, blockquotes)

## SEO
- The first paragraph of contentZh must directly state what this article is about, what problem it addresses, or the key finding — making it extractable by AI search engines.

## JSON output rules (CRITICAL — prevents parse failures)
- For quoted speech / titles / nicknames inside string values (titleZh, introZh, summaryZh, contentZh), use Chinese typography quotes: “ ” (U+201C/U+201D) and ‘ ’ (U+2018/U+2019).
- NEVER use ASCII straight quotes (") inside string values for quoting — they break JSON. Reserve " strictly for JSON field delimiters.
- Example BAD:  "contentZh": "他称这是"非常有趣的公告"。"   ← inner " breaks JSON
- Example GOOD: "contentZh": "他称这是“非常有趣的公告”。"   ← Chinese quotes are safe

You must respond with valid JSON only, no markdown fences.`.replace("{{GLOSSARY}}", buildGlossaryPrompt());

// ── Chunking Utilities ───────────────────────────────────────────────

/**
 * Split markdown content into chunks at natural boundaries.
 * Preserves code blocks — never splits inside fenced code.
 *
 * Strategy:
 * 1. Split by ## / ### headings
 * 2. If a section > maxSize, split by paragraphs (\n\n)
 * 3. If a paragraph > maxSize, split by sentences (last resort)
 * 4. Greedy merge: combine adjacent pieces without exceeding maxSize
 */
function splitIntoChunks(content, maxSize = CHUNK_SIZE) {
  if (content.length <= maxSize) return [content];

  // Protect code blocks: replace with placeholders, restore after splitting
  const codeBlocks = [];
  const withPlaceholders = content.replace(
    /```[\s\S]*?```/g,
    (match) => {
      const idx = codeBlocks.length;
      codeBlocks.push(match);
      return `__CODE_BLOCK_${idx}__`;
    }
  );

  // Size as it will be after code blocks are restored (placeholders are short)
  const realLength = (text) =>
    text.replace(/__CODE_BLOCK_(\d+)__/g, (_, idx) => codeBlocks[Number(idx)]).length;

  // Split by markdown headings (## or ###)
  const sections = withPlaceholders.split(/(?=\n#{2,3}\s)/);

  // Further split large sections by paragraphs
  const pieces = [];
  for (const section of sections) {
    if (realLength(section) <= maxSize) {
      pieces.push(section);
    } else {
      const paragraphs = section.split(/\n\n/);
      for (const para of paragraphs) {
        if (realLength(para) <= maxSize) {
          pieces.push(para);
        } else {
          // Last resort: split by sentence boundaries (Chinese or English)
          const sentences = para.split(/(?<=[。！？.!?])\s*/);
          pieces.push(...sentences);
        }
      }
    }
  }

  // Greedy merge: combine pieces into chunks up to maxSize.
  // A single code block larger than maxSize stays whole in its own chunk.
  const chunks = [];
  let current = "";
  let currentLength = 0;
  for (const piece of pieces) {
    const pieceLength = realLength(piece);
    if (!current) {
      current = piece;
      currentLength = pieceLength;
    } else if (currentLength + pieceLength + 2 <= maxSize) {
      current += "\n\n" + piece;
      currentLength += pieceLength + 2;
    } else {
      chunks.push(current);
      current = piece;
      currentLength = pieceLength;
    }
  }
  if (current) chunks.push(current);

  // Restore code blocks in all chunks
  return chunks.map((chunk) =>
    chunk.replace(/__CODE_BLOCK_(\d+)__/g, (_, idx) => codeBlocks[Number(idx)])
  );
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Translate and classify an article.
 * Routes to the appropriate strategy based on content length:
 *   - ≤15K chars: single-call translation
 *   - 15K–50K chars: chunked full translation
 *   - >50K chars: structured summary
 *
 * @param {{ title: string, summary: string, content: string }} article
 * @returns {Promise<{ titleZh: string, summaryZh: string, contentZh: string, articleType: string, readingTime: number }>}
 */
export async function translateArticle({ title, summary, content }) {
  const len = content.length;

  if (len > SUMMARIZE_THRESHOLD) {
    return summarizeArticle({ title, summary, content });
  }
  if (len > CHUNK_THRESHOLD) {
    return translateArticleChunked({ title, summary, content });
  }
  return translateArticleSingle({ title, summary, content });
}

/**
 * Single-call translation for short articles (≤15K chars).
 * Original logic, no truncation.
 */
async function translateArticleSingle({ title, summary, content }) {
  const userPrompt = `Compile (编译) this article into polished Chinese. Return JSON with these exact fields:

{
  "titleZh": "Chinese title (15-25 chars) — specific and grounded in the source. Every word must trace back to the original. No clickbait.",
  "introZh": "导读 (2-3 sentences) — what this article covers + key finding. Every sentence must be traceable to the source. No template phrases.",
  "summaryZh": "Chinese summary (2-3 sentences, capture key points)",
  "contentZh": "Compiled Chinese content — restructured for readability, sub-headings added where needed, filler cut, natural Chinese flow (preserve markdown formatting)",
  "articleType": "one of: tutorial, analysis, guide (see definitions below)",
  "readingTime": <estimated minutes to read the Chinese version>,
  "relevanceScore": <1-5 integer, see criteria below>,
  "isAdvertorial": <true/false, see detection rules below>
}

Article type definitions:
- tutorial: How-to guides, step-by-step instructions, best practices with code
- analysis: Deep analysis, trend insights, technical commentary
- guide: Tool reviews, comparisons, product introductions, buying/adoption guides

Relevance scoring criteria:
5 = Core AI Agent/Skills/MCP content (tutorials, deep analysis)
4 = AI dev tools (Claude Code, Cursor, Codex practices)
3 = AI industry trends (insightful analysis articles)
2 = Generic AI news (product announcements, brief updates)
1 = Not related to AI Agent ecosystem (company PR, hiring, policy)

Advertorial detection (isAdvertorial=true if ANY apply):
- Primary purpose is promoting a webinar, event, or product trial signup
- Contains CTAs like "register now", "sign up", "join us for [event]"
- Sponsored content or paid promotion disguised as editorial
- Thin content whose main goal is driving signups/purchases
NOTE: Articles that mention ads/events in passing context are NOT advertorials

Article to compile:

Title: ${title}

Summary: ${summary || "N/A"}

Content:
${content}`;

  const text = await callLLM(SYSTEM_PROMPT, userPrompt, 16384);
  return parseTranslationResponse(text);
}

/**
 * Chunked translation for medium-length articles (15K–50K chars).
 * Splits content into chunks, translates each, concatenates contentZh.
 */
async function translateArticleChunked({ title, summary, content }) {
  const chunks = splitIntoChunks(content, CHUNK_SIZE);

  // Chunk 0: full compilation prompt (returns all fields)
  const firstPrompt = `Compile (编译) this article into polished Chinese. Return JSON with these exact fields:

{
  "titleZh": "Chinese title (15-25 chars) — specific and grounded in the source. Every word must trace back to the original. No clickbait.",
  "introZh": "导读 (2-3 sentences) — what this article covers + key finding. Every sentence must be traceable to the source. No template phrases.",
  "summaryZh": "Chinese summary (2-3 sentences, capture key points)",
  "contentZh": "Compiled Chinese content — restructured for readability, sub-headings added where needed, filler cut, natural Chinese flow (preserve markdown formatting)",
  "articleType": "one of: tutorial, analysis, guide (see definitions below)",
  "readingTime": <estimated minutes to read the FULL Chinese version, not just this part>,
  "relevanceScore": <1-5 integer, see criteria below>,
  "isAdvertorial": <true/false, see detection rules below>
}

Article type definitions:
- tutorial: How-to guides, step-by-step instructions, best practices with code
- analysis: Deep analysis, trend insights, technical commentary
- guide: Tool reviews, comparisons, product introductions, buying/adoption guides

Relevance scoring criteria:
5 = Core AI Agent/Skills/MCP content (tutorials, deep analysis)
4 = AI dev tools (Claude Code, Cursor, Codex practices)
3 = AI industry trends (insightful analysis articles)
2 = Generic AI news (product announcements, brief updates)
1 = Not related to AI Agent ecosystem (company PR, hiring, policy)

Advertorial detection (isAdvertorial=true if ANY apply):
- Primary purpose is promoting a webinar, event, or product trial signup
- Contains CTAs like "register now", "sign up", "join us for [event]"
- Sponsored content or paid promotion disguised as editorial
NOTE: Articles that mention ads/events in passing context are NOT advertorials

Note: This is part 1 of ${chunks.length} of a multi-part article. Compile this portion completely.

Article to compile:

Title: ${title}

Summary: ${summary || "N/A"}

Content (Part 1/${chunks.length}):
${chunks[0]}`;

  const firstText = await callLLM(SYSTEM_PROMPT, firstPrompt, 16384);
  const result = parseTranslationResponse(firstText);
  const contentParts = [result.contentZh];

  // Chunks 1..N: continuation prompts (only contentZh)
  for (let i = 1; i < chunks.length; i++) {
    const contPrompt = `Continue compiling the following article content into polished Chinese. This is part ${i + 1} of ${chunks.length} of the article titled "${title}".

Return JSON with only one field:
{ "contentZh": "Compiled Chinese content of this part — natural flow, restructured for readability (preserve markdown formatting)" }

Content (Part ${i + 1}/${chunks.length}):
${chunks[i]}`;

    const contText = await callLLM(SYSTEM_PROMPT, contPrompt, 16384);
    const parsed = parseJsonResponse(contText);
    if (parsed.contentZh) {
      contentParts.push(parsed.contentZh);
    }
  }

  result.contentZh = contentParts.join("\n\n");
  return result;
}

/**
 * Structured summary for very long articles (>50K chars).
 * Sends beginning + ending to produce a Chinese summary.
 */
async function summarizeArticle({ title, summary, content }) {
  // Take first 12K + last 5K to give LLM a sense of full arc
  const head = content.slice(0, 12000);
  const tail = content.slice(-5000);
  const excerpt = head + "\n\n[... middle content omitted ...]\n\n" + tail;

  const userPrompt = `Summarize this long-form article (possibly a podcast transcript or deep-dive).
Extract and compile the key insights into a structured Chinese summary.

Return JSON with these exact fields:
{
  "titleZh": "Chinese title (15-25 chars) — specific and grounded in the source. Every word must trace back to the original. No clickbait.",
  "introZh": "导读 (2-3 sentences) — what this article covers + key finding. Every sentence must be traceable to the source. No template phrases.",
  "summaryZh": "Chinese summary (2-3 sentences, capture key points)",
  "contentZh": "Structured Chinese summary using ## headings for each key topic, include direct quotes where impactful",
  "articleType": "one of: tutorial, analysis, guide (see definitions below)",
  "readingTime": <estimated minutes to read the Chinese summary>,
  "relevanceScore": <1-5 integer, see criteria below>,
  "isAdvertorial": <true/false>
}

Article type definitions:
- tutorial: How-to guides, step-by-step instructions, best practices with code
- analysis: Deep analysis, trend insights, technical commentary
- guide: Tool reviews, comparisons, product introductions, buying/adoption guides

Relevance scoring criteria:
5 = Core AI Agent/Skills/MCP content (tutorials, deep analysis)
4 = AI dev tools (Claude Code, Cursor, Codex practices)
3 = AI industry trends (insightful analysis articles)
2 = Generic AI news (product announcements, brief updates)
1 = Not related to AI Agent ecosystem (company PR, hiring, policy)

Advertorial: set isAdvertorial=true if the article is primarily promoting a webinar/event/product signup.

Important: Start contentZh with this notice line:
> 本文为长文精华摘要，完整内容请查看原文。

Then use ## headings for each major topic/insight.

Article to summarize:

Title: ${title}

Summary: ${summary || "N/A"}

Content (beginning + ending, ~${Math.round(content.length / 1000)}K chars total):
${excerpt}`;

  const text = await callLLM(SYSTEM_PROMPT, userPrompt, 16384);
  return parseTranslationResponse(text);
}

/**
 * Generic text translation.
 *
 * @param {string} text - Text to translate
 * @param {{ from?: string, to?: string }} options
 * @returns {Promise<string>}
 */
export async function translate(text, options = {}) {
  const { from = "English", to = "Chinese" } = options;

  const result = await callLLM(
    "You are a professional translator. Return only the translation, no explanations.",
    `Translate the following ${from} text to ${to}:\n\n${text}`,
    4096
  );

  return result.trim();
}

/**
 * Score an article's relevance to AI Agent ecosystem (1-5).
 * Lightweight call — only sends title + summary + content preview.
 *
 * @param {{ title: string, summary: string, content: string }} article
 * @returns {Promise<{ relevanceScore: number, reason: string }>}
 */
export async function scoreArticleRelevance({ title, summary, content }) {
  const contentPreview = content.slice(0, 500);

  const systemPrompt = `You are an AI content relevance scorer for a site focused on AI Agent Skills, MCP, and AI developer tools. Respond with valid JSON only.`;

  const userPrompt = `Score this article's relevance to the AI Agent ecosystem AND check if it's an advertorial. Return JSON:

{
  "relevanceScore": <1-5 integer>,
  "isAdvertorial": <true/false>,
  "reason": "brief explanation in English"
}

Relevance scoring:
5 = Core AI Agent/Skills/MCP content (tutorials, deep analysis)
4 = AI dev tools (Claude Code, Cursor, Codex practices)
3 = AI industry trends (insightful analysis articles)
2 = Generic AI news (product announcements, brief updates)
1 = Not related to AI Agent ecosystem (company PR, hiring, policy)

Advertorial detection (isAdvertorial=true if ANY apply):
- Primary purpose is promoting a webinar, event registration, or product trial
- Contains CTAs like "register now", "sign up", "join us for [event]"
- Sponsored content or paid promotion disguised as editorial
- Thin content whose main goal is driving signups/purchases
NOTE: Articles that MENTION ads/events in context (e.g. "ad-free product") are NOT advertorials.

Title: ${title}
Summary: ${summary || "N/A"}
Content preview: ${contentPreview}`;

  const text = await callLLM(systemPrompt, userPrompt, 256);
  const parsed = parseJsonResponse(text);

  const score = typeof parsed.relevanceScore === "number"
    ? Math.max(1, Math.min(5, Math.round(parsed.relevanceScore)))
    : 3;

  return {
    relevanceScore: score,
    isAdvertorial: !!parsed.isAdvertorial,
    reason: parsed.reason || "",
  };
}

// ── Response Parsing ─────────────────────────────────────────────────

/**
 * Sanitize LLM-generated JSON string before parsing.
 * Fixes common issues: invalid escape sequences (\: \- \# etc.)
 * and unescaped control characters inside string values.
 */
function sanitizeJsonString(str) {
  // Fix invalid escape sequences: \x where x is not a valid JSON escape char
  // Valid JSON escapes: \" \\ \/ \b \f \n \r \t \uXXXX
  let out = str.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
  // Heuristic recovery: ASCII " surrounded by CJK chars (ideographs + CJK punctuation
  // + fullwidth forms) on both sides is almost always an unescaped inner quote inside
  // a string value, not a structural delimiter. Legit closing quotes are followed by
  // ASCII chars (, } ] etc.), not CJK.
  const cjk = "[\\u4E00-\\u9FFF\\u3000-\\u303F\\uFF00-\\uFFEF]";
  out = out.replace(new RegExp(`(${cjk})"(?=${cjk})`, "g"), '$1\\"');
  return out;
}

/**
 * Parse and validate the LLM translation response JSON.
 */
function parseTranslationResponse(text) {
  // Strip potential markdown fences
  const jsonStr = text
    .replace(/^```json\s*\n?/, "")
    .replace(/\n?```\s*$/, "")
    .trim();

  let result;
  try {
    result = JSON.parse(jsonStr);
  } catch (firstErr) {
    // Retry with sanitized JSON (fix bad escape characters)
    try {
      result = JSON.parse(sanitizeJsonString(jsonStr));
    } catch (err) {
      throw new Error(
        `Failed to parse LLM response as JSON: ${firstErr.message}\n` +
          `Raw response (first 500 chars): ${text.slice(0, 500)}`
      );
    }
  }

  // Validate required fields (introZh is optional for backward compat with older responses)
  const required = ["titleZh", "summaryZh", "contentZh", "articleType", "readingTime"];
  for (const field of required) {
    if (result[field] === undefined) {
      throw new Error(
        `LLM response missing required field: "${field}".\n` +
          `Received keys: ${Object.keys(result).join(", ")}`
      );
    }
  }

  // Normalize articleType
  if (!VALID_ARTICLE_TYPES.includes(result.articleType)) {
    result.articleType = "analysis";
  }

  // Ensure readingTime is a positive integer
  result.readingTime =
    typeof result.readingTime === "number"
      ? Math.max(1, Math.round(result.readingTime))
      : parseInt(result.readingTime, 10) || 5;

  // Normalize relevanceScore (optional, 1-5)
  if (result.relevanceScore !== undefined) {
    const score = typeof result.relevanceScore === "number"
      ? result.relevanceScore
      : parseInt(result.relevanceScore, 10);
    result.relevanceScore = Number.isNaN(score) ? undefined : Math.max(1, Math.min(5, Math.round(score)));
  }

  return result;
}

/**
 * Parse a JSON response without full validation (for continuation chunks).
 */
function parseJsonResponse(text) {
  const jsonStr = text
    .replace(/^```json\s*\n?/, "")
    .replace(/\n?```\s*$/, "")
    .trim();

  try {
    return JSON.parse(jsonStr);
  } catch (firstErr) {
    try {
      return JSON.parse(sanitizeJsonString(jsonStr));
    } catch (err) {
      throw new Error(
        `Failed to parse LLM continuation response as JSON: ${firstErr.message}\n` +
          `Raw response (first 500 chars): ${text.slice(0, 500)}`
      );
    }
  }
}
