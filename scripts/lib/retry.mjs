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
