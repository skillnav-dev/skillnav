#!/usr/bin/env node
/**
 * Fails if any admin server action or admin API handler skips the auth guard.
 *
 * - Every exported function in a "use server" file under src/app/admin
 *   must call `await requireAdmin()` as its first statement
 *   (login and logout are the only exceptions).
 * - Every exported HTTP handler under src/app/api/admin must call `isAdmin()`.
 *
 * Usage: node scripts/check-admin-guards.mjs
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const PUBLIC_ACTIONS = new Set(["loginAction", "logoutAction"]);
const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(e.name) ? [p] : [];
  });
}

// Return [name, body] for each `export async function`, body = text up to the next export.
function exportedFunctions(src) {
  const re = /export\s+async\s+function\s+(\w+)/g;
  const hits = [...src.matchAll(re)];
  return hits.map((m, i) => [
    m[1],
    src.slice(m.index, i + 1 < hits.length ? hits[i + 1].index : src.length),
  ]);
}

// The signature ends on the first line that opens the body: `export ... {` or `): ... {`.
function firstStatement(fnText) {
  const lines = fnText.split("\n");
  const end = lines.findIndex(
    (l) => /^(export|\))/.test(l) && l.trimEnd().endsWith("{"),
  );
  if (end === -1) return "";
  return lines
    .slice(end + 1)
    .join("\n")
    .trimStart();
}

const problems = [];

for (const file of walk(path.join(ROOT, "src/app/admin"))) {
  const src = fs.readFileSync(file, "utf8");
  if (!/^\s*["']use server["']/.test(src)) continue;
  for (const [name, text] of exportedFunctions(src)) {
    if (PUBLIC_ACTIONS.has(name)) continue;
    if (!firstStatement(text).startsWith("await requireAdmin();")) {
      problems.push(
        `${path.relative(ROOT, file)}: ${name}() must start with \`await requireAdmin();\``,
      );
    }
  }
}

for (const file of walk(path.join(ROOT, "src/app/api/admin"))) {
  const src = fs.readFileSync(file, "utf8");
  for (const [name, text] of exportedFunctions(src)) {
    if (!HTTP_METHODS.includes(name)) continue;
    if (!/await\s+isAdmin\(\)/.test(text)) {
      problems.push(
        `${path.relative(ROOT, file)}: ${name} handler must check \`await isAdmin()\``,
      );
    }
  }
}

if (problems.length) {
  console.error(
    "Admin auth guard check failed:\n" +
      problems.map((p) => `  - ${p}`).join("\n"),
  );
  process.exit(1);
}
console.log("Admin auth guard check passed.");
