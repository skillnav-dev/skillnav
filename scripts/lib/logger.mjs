/**
 * Simple colored logger with timing and progress display.
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
    /**
     * Overwrite current line with progress info.
     * @param {number} current - current item index (1-based)
     * @param {number} total - total items
     * @param {number} errors - error count
     * @param {string} label - current item label
     */
    progress: (current, total, errors, label = "") => {
      const pct = ((current / total) * 100).toFixed(1);
      const elapsed = (Date.now() - start) / 1000;
      const speed = (current / elapsed).toFixed(1);
      const remaining = current > 0 ? ((total - current) / (current / elapsed)) : 0;
      const eta = formatDuration(remaining);

      const barWidth = 20;
      const filled = Math.round((current / total) * barWidth);
      const bar = "█".repeat(filled) + "░".repeat(barWidth - filled);

      const line = `\x1b[36m[${prefix}]\x1b[0m [${current}/${total}] ${pct}% ${bar} ${speed}/s ETA ${eta} Err:${errors}  ${label}`;
      // Overwrite current line in TTY, append in non-TTY (CI logs)
      if (process.stderr.isTTY) {
        process.stderr.clearLine(0);
        process.stderr.cursorTo(0);
        process.stderr.write(line);
      } else if (current % 200 === 0 || current === total) {
        console.log(line);
      }
    },
    /** Print a newline after progress to avoid overwriting. */
    progressEnd: () => {
      if (process.stderr.isTTY) {
        process.stderr.write("\n");
      }
    },
  };
}

function formatDuration(seconds) {
  if (!isFinite(seconds) || seconds < 0) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}m${s.toString().padStart(2, "0")}s`;
}
