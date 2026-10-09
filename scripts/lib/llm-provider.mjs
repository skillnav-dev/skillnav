import { generateText, wrapLanguageModel, APICallError, RetryError } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createFallback, defaultShouldRetryThisError } from "ai-fallback";

/**
 * LLM provider layer on top of the Vercel AI SDK.
 *
 * Primary provider: LLM_PROVIDER (default "gpt").
 * Optional fallback: LLM_FALLBACK_PROVIDER. When the primary cannot serve the
 * call (401/402/403/408/429/5xx, network failure) ai-fallback switches to the
 * fallback and stays there for FALLBACK_RESET_MS before probing the primary again.
 * Retries: AI SDK exponential backoff (honours retry-after), MAX_RETRIES per call.
 *
 * Evaluated against the previous hand-rolled retry/circuit breaker in
 * HuiW86/ai-colab evidence/2026-10-08-skillnav-wheels (E1).
 */

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
    name: "GPT-5.5",
    baseUrl: "https://api.openai.com/v1",
    baseUrlEnv: "OPENAI_BASE_URL",
    model: "gpt-5.5",
    apiKeyEnv: "OPENAI_API_KEY",
    type: "openai-responses",
    reasoning: { effort: "xhigh" },
  },
  gpt: {
    name: "GPT-5.5",
    baseUrl: "https://gmn.chuangzuoli.com/v1",
    model: "gpt-5.5",
    apiKeyEnv: "GPT_API_KEY",
    type: "openai-responses",
    reasoning: { effort: "low" },
  },
};

const DEFAULT_PROVIDER = "gpt";
const MAX_RETRIES = 3;
const FALLBACK_RESET_MS = 10 * 60_000; // probe the primary again after 10 minutes
const LLM_TIMEOUT_MS = parseInt(process.env.LLM_TIMEOUT_MS, 10) || 120_000; // per request

/**
 * fetch with a per-request timeout. A timeout is surfaced as HTTP 408 so the
 * AI SDK retries it (and ai-fallback may switch), matching the old behaviour;
 * a plain AbortError would not be retried.
 */
function timedFetch(input, init = {}) {
  const timeout = AbortSignal.timeout(LLM_TIMEOUT_MS);
  const signal = init.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
  return fetch(input, { ...init, signal }).catch((err) => {
    if (err?.name !== "TimeoutError") throw err;
    return new Response(
      JSON.stringify({ error: { message: `request timed out after ${LLM_TIMEOUT_MS / 1000}s` } }),
      { status: 408, headers: { "content-type": "application/json" } }
    );
  });
}

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

// JSON mode is only requested from OpenAI-compatible providers (same as before):
// the Responses and Anthropic paths never asked for a JSON response format.
const jsonResponseFormat = {
  transformParams: async ({ params }) => ({ ...params, responseFormat: { type: "json" } }),
};

// Per-provider output cap (e.g. DeepSeek 8192), applied only to that provider.
function capOutputTokens(cap) {
  return {
    transformParams: async ({ params }) => ({
      ...params,
      maxOutputTokens: params.maxOutputTokens ? Math.min(params.maxOutputTokens, cap) : cap,
    }),
  };
}

function buildBaseModel(p) {
  if (p.type === "anthropic") {
    return createAnthropic({ apiKey: p.apiKey, fetch: timedFetch })(p.model);
  }
  if (p.type === "openai-responses") {
    return createOpenAI({ apiKey: p.apiKey, baseURL: p.baseUrl, fetch: timedFetch }).responses(p.model);
  }
  return createOpenAICompatible({
    name: p.providerName,
    apiKey: p.apiKey,
    baseURL: p.baseUrl,
    fetch: timedFetch,
  })(p.model);
}

function buildModel(p, jsonMode) {
  const middleware = [];
  if (jsonMode && p.type === "openai-compatible") middleware.push(jsonResponseFormat);
  if (p.maxOutputTokens) middleware.push(capOutputTokens(p.maxOutputTokens));
  const model = buildBaseModel(p);
  return middleware.length ? wrapLanguageModel({ model, middleware }) : model;
}

function providerOptionsFor(p) {
  if (p.type !== "openai-responses" || !p.reasoning) return undefined;
  // reasoningSummary: null keeps the request body identical to the old one
  // (the SDK would otherwise add summary: "detailed").
  return { openai: { reasoningEffort: p.reasoning.effort, reasoningSummary: null } };
}

/**
 * Switch to the fallback provider on ai-fallback's defaults (401, 403, 408,
 * 429, 5xx, overload messages) plus 402 (account out of credit) and network
 * failures, which carry no status code but are marked retryable.
 * 400 and other request errors still fail fast.
 */
function shouldSwitchProvider(error) {
  if (error?.statusCode === 402) return true;
  if (APICallError.isInstance(error) && error.isRetryable) return true;
  return defaultShouldRetryThisError(error);
}

function modelEntry(p, jsonMode) {
  return { model: buildModel(p, jsonMode), providerOptions: providerOptionsFor(p) };
}

// One model per mode for the whole process, so the fallback state persists across calls.
const modelCache = new Map();

function getModel(jsonMode) {
  if (modelCache.has(jsonMode)) return modelCache.get(jsonMode);

  const primaryName = process.env.LLM_PROVIDER || DEFAULT_PROVIDER;
  const primary = resolveProvider(primaryName);
  if (!primary) {
    throw new Error(
      `${PROVIDERS[primaryName].apiKeyEnv} is not set. Required for provider "${primaryName}".`
    );
  }

  const fallbackName = process.env.LLM_FALLBACK_PROVIDER;
  const fallback = fallbackName ? resolveProvider(fallbackName) : null;

  let entry;
  if (fallback) {
    entry = {
      model: createFallback({
        models: [primary, fallback].map((p) => modelEntry(p, jsonMode)),
        modelResetInterval: FALLBACK_RESET_MS,
        shouldRetryThisError: shouldSwitchProvider,
        onError: (error, modelId) => {
          console.log(
            `\x1b[33m[llm] ${modelId} failed (${error?.statusCode ?? error?.name}): switching to next provider\x1b[0m`
          );
        },
      }),
      providerOptions: undefined, // per-model options are applied by ai-fallback
    };
  } else {
    entry = modelEntry(primary, jsonMode);
  }

  modelCache.set(jsonMode, entry);
  return entry;
}

/**
 * Keep the old error contract: callers (e.g. retry.mjs) parse "API error <status>".
 */
function toLegacyError(err) {
  const cause = RetryError.isInstance(err) ? err.lastError : err;
  if (APICallError.isInstance(cause) && cause.statusCode) {
    const name = getProviderInfo().name;
    const wrapped = new Error(`${name} API error ${cause.statusCode}: ${cause.message.slice(0, 300)}`);
    wrapped.cause = err;
    return wrapped;
  }
  return err;
}

async function call(systemPrompt, userPrompt, maxTokens, jsonMode) {
  const { model, providerOptions } = getModel(jsonMode);
  try {
    const result = await generateText({
      model,
      system: systemPrompt,
      prompt: userPrompt,
      maxOutputTokens: maxTokens,
      maxRetries: MAX_RETRIES,
      providerOptions,
    });
    return result.text;
  } catch (err) {
    throw toLegacyError(err);
  }
}

/**
 * Get current provider info (for logging).
 * @returns {{ name: string, model: string, provider: string }}
 */
export function getProviderInfo() {
  const name = process.env.LLM_PROVIDER || DEFAULT_PROVIDER;
  const provider = PROVIDERS[name];
  return provider
    ? { provider: name, name: provider.name, model: provider.model }
    : { provider: name, name: "unknown", model: "unknown" };
}

/**
 * Unified LLM call (JSON mode for openai-compatible providers).
 */
export function callLLM(systemPrompt, userPrompt, maxTokens = 16384) {
  return call(systemPrompt, userPrompt, maxTokens, true);
}

/**
 * Unified LLM call in plain text mode (no JSON format constraint).
 * Use this for classification tasks that return numbered lists, etc.
 */
export function callLLMText(systemPrompt, userPrompt, maxTokens = 4096) {
  return call(systemPrompt, userPrompt, maxTokens, false);
}
