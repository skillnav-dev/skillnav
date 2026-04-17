import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

/**
 * Shared LLM utility module.
 * Supports multiple providers via LLM_PROVIDER env var.
 *
 * Providers:
 *   - deepseek (default): DEEPSEEK_API_KEY, model deepseek-chat
 *   - gemini:             GEMINI_API_KEY, model gemini-2.0-flash
 *   - anthropic:          ANTHROPIC_API_KEY, model claude-haiku-4-5-20251001
 *   - openai:             OPENAI_API_KEY, model gpt-5.4 (OpenAI Responses API, OPENAI_BASE_URL for proxy)
 *   - gpt:                GPT_API_KEY, model gpt-5.4 (OpenAI Responses API via proxy)
 */

// ── Provider Configuration ───────────────────────────────────────────

const PROVIDERS = {
  deepseek: {
    name: "DeepSeek V3",
    baseUrl: "https://api.deepseek.com/v1",
    model: "deepseek-chat",
    apiKeyEnv: "DEEPSEEK_API_KEY",
    type: "openai-compatible",
    maxOutputTokens: 8192,
  },
  gemini: {
    name: "Gemini 2.0 Flash",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    model: "gemini-2.0-flash",
    apiKeyEnv: "GEMINI_API_KEY",
    type: "openai-compatible",
  },
  anthropic: {
    name: "Claude Haiku",
    model: "claude-haiku-4-5-20251001",
    apiKeyEnv: "ANTHROPIC_API_KEY",
    type: "anthropic",
  },
  openai: {
    name: "GPT-5.4",
    baseUrl: "https://api.openai.com/v1",
    baseUrlEnv: "OPENAI_BASE_URL",
    model: "gpt-5.4",
    apiKeyEnv: "OPENAI_API_KEY",
    type: "openai-responses",
    reasoning: { effort: "xhigh" },
  },
  gpt: {
    name: "GPT-5.4",
    baseUrl: "https://gmn.chuangzuoli.com/v1",
    model: "gpt-5.4",
    apiKeyEnv: "GPT_API_KEY",
    type: "openai-responses",
    reasoning: { effort: "low" },
  },
};

// Thresholds for translation strategy
const CHUNK_THRESHOLD = 15000; // Below this: single-call translation
const SUMMARIZE_THRESHOLD = 50000; // Above this: structured summary instead of full translation
const CHUNK_SIZE = 12000; // Target size per chunk
const LLM_TIMEOUT_MS = parseInt(process.env.LLM_TIMEOUT_MS, 10) || 120_000; // 120s per request, overridable via env

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

// ── Retry & Circuit Breaker ─────────────────────────────────────────
// Retry with backoff on transient failures (502, timeout, network).
// Circuit breaker: 3 failures → open (use fallback) → 10min cooldown → half-open (try primary once)
const RETRY_COUNT = 3;              // retries per call before giving up
const RETRY_BASE_DELAY_MS = 5_000;  // 5s → 10s → 20s (~35s total)
const RETRY_MAX_DELAY_MS = 30_000;  // cap individual delay at 30s

const CIRCUIT_FAILURE_THRESHOLD = 3;       // failures before opening circuit
const CIRCUIT_COOLDOWN_MS = 10 * 60_000;   // 10 minutes before half-open

// Circuit states: "closed" (normal) → "open" (fallback) → "half-open" (probe primary)
let circuitState = "closed";
let circuitFailures = 0;
let circuitOpenedAt = 0;

// ── Provider Resolution ──────────────────────────────────────────────

function resolveProvider(name) {
  const provider = PROVIDERS[name];
  if (!provider) {
    throw new Error(
      `Unknown LLM_PROVIDER: "${name}". Available: ${Object.keys(PROVIDERS).join(", ")}`
    );
  }
  const apiKey = process.env[provider.apiKeyEnv];
  if (!apiKey) return null; // key not available
  const baseUrl =
    (provider.baseUrlEnv && process.env[provider.baseUrlEnv]) || provider.baseUrl;
  return { ...provider, providerName: name, apiKey, baseUrl };
}

function getProvider() {
  const primaryName = process.env.LLM_PROVIDER || "gpt";
  const fallbackName = process.env.LLM_FALLBACK_PROVIDER;

  // Circuit open or half-open → use fallback if available
  if (circuitState !== "closed" && fallbackName) {
    // Half-open: check if cooldown elapsed, probe primary once
    if (circuitState === "open" && Date.now() - circuitOpenedAt >= CIRCUIT_COOLDOWN_MS) {
      circuitState = "half-open";
      console.log(`\x1b[33m[llm] Circuit half-open — probing primary provider\x1b[0m`);
      // Fall through to return primary
    } else if (circuitState === "open") {
      const fb = resolveProvider(fallbackName);
      if (fb) return fb;
    }
    // half-open: return primary for the probe attempt
    if (circuitState === "half-open") {
      const primary = resolveProvider(primaryName);
      if (primary) return primary;
    }
  }

  const primary = resolveProvider(primaryName);
  if (!primary) {
    throw new Error(
      `${PROVIDERS[primaryName]?.apiKeyEnv || primaryName} is not set. Required for provider "${primaryName}".`
    );
  }
  return primary;
}

function onCallSuccess() {
  if (circuitState !== "closed") {
    console.log(`\x1b[32m[llm] Circuit closed — primary provider recovered\x1b[0m`);
  }
  circuitState = "closed";
  circuitFailures = 0;
}

function onCallFailure() {
  circuitFailures++;
  const fallbackName = process.env.LLM_FALLBACK_PROVIDER;

  if (circuitState === "half-open") {
    // Probe failed → reopen circuit, reset cooldown
    circuitState = "open";
    circuitOpenedAt = Date.now();
    console.log(`\x1b[33m[llm] Half-open probe failed — circuit reopened for ${CIRCUIT_COOLDOWN_MS / 60000}min\x1b[0m`);
    return;
  }

  if (circuitState === "closed" && fallbackName && circuitFailures >= CIRCUIT_FAILURE_THRESHOLD) {
    const fb = resolveProvider(fallbackName);
    if (fb) {
      circuitState = "open";
      circuitOpenedAt = Date.now();
      console.log(
        `\x1b[33m[llm] ${circuitFailures} consecutive failures — circuit opened, switching to fallback: ${fb.name} (${fallbackName})\x1b[0m`
      );
    }
  }
}

/**
 * Get current provider info (for logging).
 * @returns {{ name: string, model: string, provider: string }}
 */
export function getProviderInfo() {
  const name = process.env.LLM_PROVIDER || "gpt";
  const provider = PROVIDERS[name];
  return provider
    ? { provider: name, name: provider.name, model: provider.model }
    : { provider: name, name: "unknown", model: "unknown" };
}

// ── LLM Call Implementations ─────────────────────────────────────────

/**
 * Call an OpenAI-compatible API (DeepSeek, OpenAI, etc.)
 * @param {boolean} [jsonMode=true] - Whether to request JSON response format
 */
async function callOpenAICompatible(provider, systemPrompt, userPrompt, maxTokens, jsonMode = true) {
  const effectiveMaxTokens = provider.maxOutputTokens
    ? Math.min(maxTokens, provider.maxOutputTokens)
    : maxTokens;
  const body = {
    model: provider.model,
    max_tokens: effectiveMaxTokens,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  };
  if (jsonMode) body.response_format = { type: "json_object" };

  const res = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${provider.name} API error ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

/**
 * Call OpenAI Responses API (e.g. GPT-5 via proxy).
 */
async function callOpenAIResponses(provider, systemPrompt, userPrompt, maxTokens) {
  const res = await fetch(`${provider.baseUrl}/responses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.apiKey}`,
    },
    signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
    body: JSON.stringify({
      model: provider.model,
      max_output_tokens: maxTokens,
      ...(provider.reasoning && { reasoning: provider.reasoning }),
      input: [
        {
          type: "message",
          role: "developer",
          content: [{ type: "input_text", text: systemPrompt }],
        },
        {
          type: "message",
          role: "user",
          content: [{ type: "input_text", text: userPrompt }],
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${provider.name} API error ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  // Responses API returns output[].content[].text
  const message = data.output?.find((o) => o.type === "message");
  const text = message?.content?.find((c) => c.type === "output_text")?.text;
  if (!text) {
    throw new Error(`${provider.name}: unexpected response structure: ${JSON.stringify(data).slice(0, 300)}`);
  }
  return text;
}

/**
 * Call the Anthropic API via SDK.
 */
async function callAnthropic(provider, systemPrompt, userPrompt, maxTokens) {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey: provider.apiKey, timeout: LLM_TIMEOUT_MS });

  const response = await client.messages.create({
    model: provider.model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  return response.content[0].text;
}

/**
 * Check if an error is transient (worth retrying).
 */
function isTransientError(err) {
  const msg = err.message || "";
  return /502|503|504|timeout|fetch failed|ECONNRESET|ETIMEDOUT|socket hang up/i.test(msg);
}

/**
 * Sleep for a given number of milliseconds.
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Call with retry + exponential backoff for transient errors.
 */
async function callWithRetry(provider, systemPrompt, userPrompt, maxTokens, jsonMode) {
  let lastErr;
  for (let attempt = 0; attempt <= RETRY_COUNT; attempt++) {
    try {
      const result = await dispatchCall(provider, systemPrompt, userPrompt, maxTokens, jsonMode);
      onCallSuccess();
      return result;
    } catch (err) {
      lastErr = err;
      onCallFailure();
      if (attempt < RETRY_COUNT && isTransientError(err)) {
        const delay = Math.min(RETRY_BASE_DELAY_MS * Math.pow(2, attempt), RETRY_MAX_DELAY_MS);
        console.log(
          `\x1b[33m[llm] Transient error (attempt ${attempt + 1}/${RETRY_COUNT + 1}): ${err.message.slice(0, 100)}. Retrying in ${delay / 1000}s...\x1b[0m`
        );
        await sleep(delay);
        continue;
      }
      break;
    }
  }
  throw lastErr;
}

/**
 * Unified LLM call dispatcher (JSON mode for openai-compatible providers).
 * Retries transient errors (502, timeout) with exponential backoff.
 */
export async function callLLM(systemPrompt, userPrompt, maxTokens = 16384) {
  const provider = getProvider();
  return callWithRetry(provider, systemPrompt, userPrompt, maxTokens, true);
}

/**
 * Unified LLM call dispatcher (plain text mode — no JSON format constraint).
 * Use this for classification tasks that return numbered lists, etc.
 */
export async function callLLMText(systemPrompt, userPrompt, maxTokens = 4096) {
  const provider = getProvider();
  return callWithRetry(provider, systemPrompt, userPrompt, maxTokens, false);
}

/**
 * Dispatch to the correct call implementation based on provider type.
 */
function dispatchCall(provider, systemPrompt, userPrompt, maxTokens, jsonMode) {
  if (provider.type === "anthropic") {
    return callAnthropic(provider, systemPrompt, userPrompt, maxTokens);
  }
  if (provider.type === "openai-responses") {
    return callOpenAIResponses(provider, systemPrompt, userPrompt, maxTokens);
  }
  return callOpenAICompatible(provider, systemPrompt, userPrompt, maxTokens, jsonMode);
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

  // Split by markdown headings (## or ###)
  const sections = withPlaceholders.split(/(?=\n#{2,3}\s)/);

  // Further split large sections by paragraphs
  const pieces = [];
  for (const section of sections) {
    if (section.length <= maxSize) {
      pieces.push(section);
    } else {
      const paragraphs = section.split(/\n\n/);
      for (const para of paragraphs) {
        if (para.length <= maxSize) {
          pieces.push(para);
        } else {
          // Last resort: split by sentence boundaries (Chinese or English)
          const sentences = para.split(/(?<=[。！？.!?])\s*/);
          pieces.push(...sentences);
        }
      }
    }
  }

  // Greedy merge: combine pieces into chunks up to maxSize
  const chunks = [];
  let current = "";
  for (const piece of pieces) {
    if (!current) {
      current = piece;
    } else if (current.length + piece.length + 2 <= maxSize) {
      current += "\n\n" + piece;
    } else {
      chunks.push(current);
      current = piece;
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
  return str.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
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
