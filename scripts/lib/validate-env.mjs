/**
 * Validate that required environment variables are set.
 * Exits with code 2 if any are missing.
 * @param {string[]} required - list of env var names
 */
export function validateEnv(required) {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`\x1b[31m[env] Missing required environment variables:\x1b[0m`);
    for (const key of missing) {
      console.error(`  - ${key}`);
    }
    process.exit(2);
  }
}
