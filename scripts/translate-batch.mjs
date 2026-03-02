#!/usr/bin/env node

/**
 * Batch translate untranslated skill/article names and descriptions to Chinese.
 * Uses Anthropic Claude API.
 *
 * Usage:
 *   node scripts/translate-batch.mjs                          # Default: 50 skills
 *   node scripts/translate-batch.mjs --table articles         # Translate articles
 *   node scripts/translate-batch.mjs --table both --limit 20  # Both tables
 *   node scripts/translate-batch.mjs --dry-run                # Preview only
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "./lib/supabase-admin.mjs";
import { createLogger } from "./lib/logger.mjs";

const log = createLogger("translate");

const SYSTEM_PROMPT = `You are a professional translator specializing in AI Agent and developer tools.
Translate the following English text to Simplified Chinese.

Rules:
- Keep proper nouns (brand names, product names) in English
- Use standard Chinese tech terminology (e.g., "repository" → "仓库", "deploy" → "部署")
- Keep the translation concise and natural for Chinese developers
- Only output the translation, no explanations
- If the input is already in Chinese, return it as-is`;

function createAnthropicClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "Missing ANTHROPIC_API_KEY. Add it to .env.local for the translation pipeline."
    );
  }
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

async function translateText(client, text) {
  if (!text || text.trim().length === 0) return null;

  // Skip if already mostly Chinese
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  if (chineseChars > text.length * 0.3) return text;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: text }],
  });

  return response.content[0].text.trim();
}

async function translateSkills(supabase, client, limit, dryRun) {
  const { data: skills, error } = await supabase
    .from("skills")
    .select("id, name, description, name_zh, description_zh")
    .or("name_zh.is.null,description_zh.is.null")
    .limit(limit);

  if (error) throw error;
  log.info(`Found ${skills.length} skills needing translation`);

  let translated = 0;

  for (const skill of skills) {
    try {
      const updates = {};

      if (!skill.name_zh) {
        updates.name_zh = await translateText(client, skill.name);
      }
      if (!skill.description_zh && skill.description) {
        updates.description_zh = await translateText(client, skill.description);
      }

      if (Object.keys(updates).length === 0) continue;

      if (dryRun) {
        log.info(`[DRY RUN] "${skill.name}" → "${updates.name_zh || "(skip)"}"`);
        if (updates.description_zh) {
          log.info(`  desc → "${updates.description_zh.slice(0, 60)}..."`);
        }
      } else {
        await supabase.from("skills").update(updates).eq("id", skill.id);
        translated++;
        log.success(`"${skill.name}" → "${updates.name_zh || skill.name_zh}"`);
      }

      // Rate limit: ~50 req/min for Claude API
      await new Promise((r) => setTimeout(r, 1200));
    } catch (e) {
      log.warn(`Error translating "${skill.name}": ${e.message}`);
    }
  }

  return translated;
}

async function translateArticles(supabase, client, limit, dryRun) {
  const { data: articles, error } = await supabase
    .from("articles")
    .select("id, title, summary, title_zh, summary_zh")
    .or("title_zh.is.null,summary_zh.is.null")
    .limit(limit);

  if (error) throw error;
  log.info(`Found ${articles.length} articles needing translation`);

  let translated = 0;

  for (const article of articles) {
    try {
      const updates = {};

      if (!article.title_zh) {
        updates.title_zh = await translateText(client, article.title);
      }
      if (!article.summary_zh && article.summary) {
        updates.summary_zh = await translateText(client, article.summary);
      }

      if (Object.keys(updates).length === 0) continue;

      if (dryRun) {
        log.info(
          `[DRY RUN] "${article.title}" → "${updates.title_zh || "(skip)"}"`
        );
      } else {
        await supabase.from("articles").update(updates).eq("id", article.id);
        translated++;
        log.success(
          `"${article.title}" → "${updates.title_zh || article.title_zh}"`
        );
      }

      await new Promise((r) => setTimeout(r, 1200));
    } catch (e) {
      log.warn(`Error translating "${article.title}": ${e.message}`);
    }
  }

  return translated;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx !== -1 ? Number(args[limitIdx + 1]) : 50;
  const tableIdx = args.indexOf("--table");
  const table = tableIdx !== -1 ? args[tableIdx + 1] : "skills";

  const supabase = createAdminClient();
  const client = createAnthropicClient();

  if (table === "skills" || table === "both") {
    const count = await translateSkills(supabase, client, limit, dryRun);
    log.success(`Translated ${count} skills`);
  }

  if (table === "articles" || table === "both") {
    const count = await translateArticles(supabase, client, limit, dryRun);
    log.success(`Translated ${count} articles`);
  }

  log.done();
}

main().catch((e) => {
  log.error(e.message);
  process.exit(1);
});
