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

// Truncation limit for article content (~4K tokens)
const MAX_CONTENT_LENGTH = 15000;

const VALID_ARTICLE_TYPES = [
  "news",
  "tutorial",
  "analysis",
  "release",
  "review",
  "comparison",
  "weekly",
];

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
async function callLLM(systemPrompt, userPrompt, maxTokens = 8192) {
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

// ── Public API ───────────────────────────────────────────────────────

/**
 * Translate and classify an article in a single LLM call.
 * Returns structured JSON with Chinese translations + metadata.
 *
 * @param {{ title: string, summary: string, content: string }} article
 * @returns {Promise<{ titleZh: string, summaryZh: string, contentZh: string, articleType: string, readingTime: number }>}
 */
export async function translateArticle({ title, summary, content }) {
  const truncatedContent =
    content.length > MAX_CONTENT_LENGTH
      ? content.slice(0, MAX_CONTENT_LENGTH) + "\n\n[... content truncated ...]"
      : content;

  const userPrompt = `Translate this article and classify it. Return JSON with these exact fields:

{
  "titleZh": "Chinese title (concise, news-headline style)",
  "summaryZh": "Chinese summary (2-3 sentences, capture key points)",
  "contentZh": "Full Chinese translation (preserve markdown formatting)",
  "articleType": "one of: news, tutorial, analysis, release, review, comparison, weekly",
  "readingTime": <estimated minutes to read the Chinese version>
}

Article to translate:

Title: ${title}

Summary: ${summary || "N/A"}

Content:
${truncatedContent}`;

  const text = await callLLM(SYSTEM_PROMPT, userPrompt, 8192);
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

// ── Response Parsing ─────────────────────────────────────────────────

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
  } catch (err) {
    throw new Error(
      `Failed to parse LLM response as JSON: ${err.message}\n` +
        `Raw response (first 500 chars): ${text.slice(0, 500)}`
    );
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

  return result;
}
