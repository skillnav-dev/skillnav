/**
 * Simple colored logger with timing.
 */
export function createLogger(prefix) {
  const start = Date.now();

  return {
    info: (msg) => console.log(`\x1b[36m[${prefix}]\x1b[0m ${msg}`),
    success: (msg) => console.log(`\x1b[32m[${prefix}] ✓\x1b[0m ${msg}`),
    warn: (msg) => console.log(`\x1b[33m[${prefix}] ⚠\x1b[0m ${msg}`),
    error: (msg) => console.error(`\x1b[31m[${prefix}] ✗\x1b[0m ${msg}`),
    done: () => {
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      console.log(`\x1b[32m[${prefix}] Done in ${elapsed}s\x1b[0m`);
    },
  };
}
