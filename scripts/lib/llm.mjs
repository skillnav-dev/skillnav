/**
 * Shared LLM utility module.
 * Wraps the Anthropic SDK for translation and classification tasks.
 */
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic(); // auto-reads ANTHROPIC_API_KEY from env

const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

// Truncation limit for article content (~4K tokens, cost-efficient for Haiku)
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

/**
 * Translate and classify an article in a single LLM call.
 * Returns structured JSON with Chinese translations + metadata.
 *
 * @param {{ title: string, summary: string, content: string }} article
 * @param {{ model?: string }} options
 * @returns {Promise<{ titleZh: string, summaryZh: string, contentZh: string, articleType: string, readingTime: number }>}
 */
export async function translateArticle(
  { title, summary, content },
  options = {}
) {
  const model = options.model || DEFAULT_MODEL;

  // Truncate content if too long (Haiku context is 200K but we want cost efficiency)
  const truncatedContent =
    content.length > MAX_CONTENT_LENGTH
      ? content.slice(0, MAX_CONTENT_LENGTH) + "\n\n[... content truncated ...]"
      : content;

  const systemPrompt = `You are a professional Chinese tech media translator. Your task is to translate English tech articles into natural, fluent Chinese suitable for a Chinese tech news site.

Translation style:
- Natural Chinese expression, NOT word-for-word translation
- Keep technical terms in English when they are commonly used as-is (e.g., API, SDK, LLM, Agent, Token)
- Use established Chinese translations for well-known concepts (e.g., machine learning → 机器学习)
- Maintain the original article's structure (headings, lists, code blocks)
- Preserve all code snippets, URLs, and technical references unchanged

You must respond with valid JSON only, no markdown fences.`;

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

  const response = await client.messages.create({
    model,
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = response.content[0].text;
  return parseTranslationResponse(text);
}

/**
 * Parse and validate the LLM translation response JSON.
 *
 * @param {string} text - Raw LLM response text
 * @returns {{ titleZh: string, summaryZh: string, contentZh: string, articleType: string, readingTime: number }}
 */
function parseTranslationResponse(text) {
  // Strip potential markdown fences the model may include despite instructions
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
  const required = [
    "titleZh",
    "summaryZh",
    "contentZh",
    "articleType",
    "readingTime",
  ];
  for (const field of required) {
    if (result[field] === undefined) {
      throw new Error(
        `LLM response missing required field: "${field}".\n` +
          `Received keys: ${Object.keys(result).join(", ")}`
      );
    }
  }

  // Normalize articleType — fallback to "news" if unrecognized
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

/**
 * Generic text translation.
 *
 * @param {string} text - Text to translate
 * @param {{ from?: string, to?: string, model?: string }} options
 * @returns {Promise<string>}
 */
export async function translate(text, options = {}) {
  const { from = "English", to = "Chinese", model = DEFAULT_MODEL } = options;

  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content:
          `Translate the following ${from} text to ${to}. ` +
          `Return only the translation, no explanations.\n\n${text}`,
      },
    ],
  });

  return response.content[0].text.trim();
}
