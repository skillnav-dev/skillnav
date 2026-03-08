#!/usr/bin/env node

/**
 * Run raw SQL against remote Supabase via Management API.
 * Token from macOS Keychain (go-keyring-base64 encoded).
 *
 * Usage: node scripts/run-sql.mjs "SELECT 1"
 */

import { execSync } from "child_process";

const PROJECT_REF = "caapclmylemgbrtgfszd";

function getAccessToken() {
  const raw = execSync(
    'security find-generic-password -s "Supabase CLI" -a "supabase" -w',
    { encoding: "utf-8" }
  ).trim();

  // go-keyring stores as "go-keyring-base64:<base64>"
  const prefix = "go-keyring-base64:";
  if (raw.startsWith(prefix)) {
    return Buffer.from(raw.slice(prefix.length), "base64").toString("utf-8");
  }
  return raw;
}

async function runSQL(query) {
  const token = getAccessToken();

  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    console.error(`API error ${res.status}:`, body.slice(0, 500));
    process.exit(1);
  }

  const data = await res.json();
  return data;
}

const query = process.argv[2];
if (!query) {
  console.error("Usage: node scripts/run-sql.mjs \"SQL query\"");
  process.exit(1);
}

const result = await runSQL(query);
console.log(JSON.stringify(result, null, 2));
