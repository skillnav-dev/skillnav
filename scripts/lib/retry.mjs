/**
 * Check if an error is retryable.
 * Non-retryable: 400/401/403/404 (client errors where retry won't help).
 * Retryable: 408/429/5xx/524, network errors, timeout errors.
 */
function isRetryable(err) {
  const msg = err?.message || '';

  // Extract HTTP status from "API error {status}" pattern thrown by llm.mjs
  const statusMatch = msg.match(/API error (\d{3})/);
  if (statusMatch) {
    const status = Number(statusMatch[1]);
    // Client errors (except 408 Request Timeout and 429 Rate Limit) are not retryable
    if (status >= 400 && status < 500 && status !== 408 && status !== 429) {
      return false;
    }
  }

  // Everything else is retryable (network errors, timeouts, 5xx, 524, etc.)
  return true;
}

/**
 * Retry wrapper with exponential backoff.
 * @param {Function} fn - async function to retry
 * @param {object} options
 * @param {number} options.maxRetries - max retry attempts (default 3)
 * @param {number} options.baseDelay - base delay in ms (default 1000)
 * @param {string} options.label - label for log messages
 * @returns {Promise<*>} result of fn()
 */
export async function withRetry(fn, { maxRetries = 3, baseDelay = 1000, label = '' } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (!isRetryable(err)) {
        console.warn(
          `\x1b[31m[retry]\x1b[0m ${label ? `"${label}" ` : ''}non-retryable error: ${err.message}`
        );
        throw err;
      }
      if (attempt < maxRetries) {
        const delayMs = baseDelay * Math.pow(2, attempt);
        console.warn(
          `\x1b[33m[retry]\x1b[0m ${label ? `"${label}" ` : ''}attempt ${attempt + 1}/${maxRetries} failed: ${err.message}. Retrying in ${delayMs}ms...`
        );
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }
  throw lastError;
}
