/**
 * Shared LLM utility module.
 * Supports multiple providers via LLM_PROVIDER env var.
 *
 * Providers:
 *   - deepseek (default): DEEPSEEK_API_KEY, model deepseek-chat
 *   - gemini:             GEMINI_API_KEY, model gemini-2.0-flash
 *   - anthropic:          ANTHROPIC_API_KEY, model claude-haiku-4-5-20251001
 *   - openai:             OPENAI_API_KEY, model gpt-4o-mini (OPENAI_BASE_URL for proxy)
 *   - gpt:                GPT_API_KEY, model gpt-5 (OpenAI Responses API via proxy)
 */

// ── Provider Configuration ───────────────────────────────────────────

const PROVIDERS = {
  deepseek: {
    name: "DeepSeek V3",
    baseUrl: "https://api.deepseek.com/v1",
    model: "deepseek-chat",
    apiKeyEnv: "DEEPSEEK_API_KEY",
    type: "openai-compatible",
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
    name: "GPT-4o-mini",
    baseUrl: "https://api.openai.com/v1",
    baseUrlEnv: "OPENAI_BASE_URL",
    model: "gpt-4o-mini",
    apiKeyEnv: "OPENAI_API_KEY",
    type: "openai-compatible",
  },
  gpt: {
    name: "GPT-5.3 Codex",
    baseUrl: "https://gmn.chuangzuoli.com/v1",
    model: "gpt-5.3-codex",
    apiKeyEnv: "GPT_API_KEY",
    type: "openai-responses",
  },
};

// Thresholds for translation strategy
const CHUNK_THRESHOLD = 15000; // Below this: single-call translation
const SUMMARIZE_THRESHOLD = 50000; // Above this: structured summary instead of full translation
const CHUNK_SIZE = 12000; // Target size per chunk

const VALID_ARTICLE_TYPES = ["news", "tutorial", "analysis"];

// ── Provider Resolution ──────────────────────────────────────────────

function getProvider() {
  const name = process.env.LLM_PROVIDER || "deepseek";
  const provider = PROVIDERS[name];
  if (!provider) {
    throw new Error(
      `Unknown LLM_PROVIDER: "${name}". Available: ${Object.keys(PROVIDERS).join(", ")}`
    );
  }
  const apiKey = process.env[provider.apiKeyEnv];
  if (!apiKey) {
    throw new Error(
      `${provider.apiKeyEnv} is not set. Required for provider "${name}".`
    );
  }
  // Allow base URL override via env var (e.g. OPENAI_BASE_URL for proxies)
  const baseUrl =
    (provider.baseUrlEnv && process.env[provider.baseUrlEnv]) || provider.baseUrl;
  return { ...provider, apiKey, baseUrl };
}

/**
 * Get current provider info (for logging).
 * @returns {{ name: string, model: string, provider: string }}
 */
export function getProviderInfo() {
  const name = process.env.LLM_PROVIDER || "deepseek";
  const provider = PROVIDERS[name];
  return provider
    ? { provider: name, name: provider.name, model: provider.model }
    : { provider: name, name: "unknown", model: "unknown" };
}

// ── LLM Call Implementations ─────────────────────────────────────────

/**
 * Call an OpenAI-compatible API (DeepSeek, OpenAI, etc.)
 */
async function callOpenAICompatible(provider, systemPrompt, userPrompt, maxTokens) {
  const res = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model: provider.model,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
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
    body: JSON.stringify({
      model: provider.model,
      max_output_tokens: maxTokens,
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
  const client = new Anthropic({ apiKey: provider.apiKey });

  const response = await client.messages.create({
    model: provider.model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  return response.content[0].text;
}

/**
 * Unified LLM call dispatcher.
 */
async function callLLM(systemPrompt, userPrompt, maxTokens = 16384) {
  const provider = getProvider();
  if (provider.type === "anthropic") {
    return callAnthropic(provider, systemPrompt, userPrompt, maxTokens);
  }
  if (provider.type === "openai-responses") {
    return callOpenAIResponses(provider, systemPrompt, userPrompt, maxTokens);
  }
  return callOpenAICompatible(provider, systemPrompt, userPrompt, maxTokens);
}

// ── Shared Prompts ───────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a professional Chinese tech media translator. Your task is to translate English tech articles into natural, fluent Chinese suitable for a Chinese tech news site.

Translation style:
- Natural Chinese expression, NOT word-for-word translation
- Keep technical terms in English when they are commonly used as-is (e.g., API, SDK, LLM, Agent, Token)
- Use established Chinese translations for well-known concepts (e.g., machine learning → 机器学习)
- Maintain the original article's structure (headings, lists, code blocks)
- Preserve all code snippets, URLs, and technical references unchanged

You must respond with valid JSON only, no markdown fences.`;

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
  const userPrompt = `Translate this article and classify it. Return JSON with these exact fields:

{
  "titleZh": "Chinese title (concise, news-headline style)",
  "summaryZh": "Chinese summary (2-3 sentences, capture key points)",
  "contentZh": "Full Chinese translation (preserve markdown formatting)",
  "articleType": "one of: news, tutorial, analysis",
  "readingTime": <estimated minutes to read the Chinese version>,
  "relevanceScore": <1-5 integer, see criteria below>
}

Relevance scoring criteria:
5 = Core AI Agent/Skills/MCP content (tutorials, deep analysis)
4 = AI dev tools (Claude Code, Cursor, Codex practices)
3 = AI industry trends (insightful analysis articles)
2 = Generic AI news (product announcements, brief updates)
1 = Not related to AI Agent ecosystem (company PR, hiring, policy)

Article to translate:

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

  // Chunk 0: full translation prompt (returns all fields)
  const firstPrompt = `Translate this article and classify it. Return JSON with these exact fields:

{
  "titleZh": "Chinese title (concise, news-headline style)",
  "summaryZh": "Chinese summary (2-3 sentences, capture key points)",
  "contentZh": "Full Chinese translation (preserve markdown formatting)",
  "articleType": "one of: news, tutorial, analysis",
  "readingTime": <estimated minutes to read the FULL Chinese version, not just this part>,
  "relevanceScore": <1-5 integer, see criteria below>
}

Relevance scoring criteria:
5 = Core AI Agent/Skills/MCP content (tutorials, deep analysis)
4 = AI dev tools (Claude Code, Cursor, Codex practices)
3 = AI industry trends (insightful analysis articles)
2 = Generic AI news (product announcements, brief updates)
1 = Not related to AI Agent ecosystem (company PR, hiring, policy)

Note: This is part 1 of ${chunks.length} of a multi-part article. Translate this portion completely.

Article to translate:

Title: ${title}

Summary: ${summary || "N/A"}

Content (Part 1/${chunks.length}):
${chunks[0]}`;

  const firstText = await callLLM(SYSTEM_PROMPT, firstPrompt, 16384);
  const result = parseTranslationResponse(firstText);
  const contentParts = [result.contentZh];

  // Chunks 1..N: continuation prompts (only contentZh)
  for (let i = 1; i < chunks.length; i++) {
    const contPrompt = `Continue translating the following article content into Chinese. This is part ${i + 1} of ${chunks.length} of the article titled "${title}".

Return JSON with only one field:
{ "contentZh": "Chinese translation of this part (preserve markdown formatting)" }

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
Extract and translate the key insights into a structured Chinese summary.

Return JSON with these exact fields:
{
  "titleZh": "Chinese title (concise, news-headline style)",
  "summaryZh": "Chinese summary (2-3 sentences, capture key points)",
  "contentZh": "Structured Chinese summary using ## headings for each key topic, include direct quotes where impactful",
  "articleType": "one of: news, tutorial, analysis",
  "readingTime": <estimated minutes to read the Chinese summary>,
  "relevanceScore": <1-5 integer, see criteria below>
}

Relevance scoring criteria:
5 = Core AI Agent/Skills/MCP content (tutorials, deep analysis)
4 = AI dev tools (Claude Code, Cursor, Codex practices)
3 = AI industry trends (insightful analysis articles)
2 = Generic AI news (product announcements, brief updates)
1 = Not related to AI Agent ecosystem (company PR, hiring, policy)

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

  const userPrompt = `Score this article's relevance to the AI Agent ecosystem. Return JSON:

{
  "relevanceScore": <1-5 integer>,
  "reason": "brief explanation in English"
}

Scoring criteria:
5 = Core AI Agent/Skills/MCP content (tutorials, deep analysis)
4 = AI dev tools (Claude Code, Cursor, Codex practices)
3 = AI industry trends (insightful analysis articles)
2 = Generic AI news (product announcements, brief updates)
1 = Not related to AI Agent ecosystem (company PR, hiring, policy)

Title: ${title}
Summary: ${summary || "N/A"}
Content preview: ${contentPreview}`;

  const text = await callLLM(systemPrompt, userPrompt, 256);
  const parsed = parseJsonResponse(text);

  const score = typeof parsed.relevanceScore === "number"
    ? Math.max(1, Math.min(5, Math.round(parsed.relevanceScore)))
    : 3;

  return { relevanceScore: score, reason: parsed.reason || "" };
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

  // Validate required fields
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
    result.articleType = "news";
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
