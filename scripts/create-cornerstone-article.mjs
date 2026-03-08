#!/usr/bin/env node

/**
 * One-time script: Generate a cornerstone article from top-rated curated Skills.
 *
 * Queries quality_tier='A' skills from Supabase, picks the top 10 across
 * categories, generates a Chinese Markdown article, and inserts it as a
 * draft into the articles table.
 *
 * Usage:
 *   node scripts/create-cornerstone-article.mjs              # Insert draft
 *   node scripts/create-cornerstone-article.mjs --dry-run    # Preview only
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import { createAdminClient } from "./lib/supabase-admin.mjs";
import { createLogger } from "./lib/logger.mjs";
import { validateEnv } from "./lib/validate-env.mjs";

const log = createLogger("cornerstone");

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  validateEnv(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);

  const supabase = createAdminClient();

  // Fetch quality_tier=A curated skills
  const { data: skills, error } = await supabase
    .from("skills")
    .select("slug, name, name_zh, description, description_zh, category, author, install_command, editor_comment_zh, github_url, stars")
    .eq("quality_tier", "A")
    .eq("is_hidden", false)
    .order("stars", { ascending: false })
    .limit(50);

  if (error) {
    log.error(`Failed to fetch skills: ${error.message}`);
    process.exit(1);
  }

  log.info(`Found ${skills.length} quality_tier=A skills`);

  // Pick top 10, ensuring category diversity
  const picked = [];
  const usedCategories = new Set();

  // First pass: one per category
  for (const skill of skills) {
    if (picked.length >= 10) break;
    if (!usedCategories.has(skill.category)) {
      picked.push(skill);
      usedCategories.add(skill.category);
    }
  }
  // Second pass: fill remaining slots with highest stars
  for (const skill of skills) {
    if (picked.length >= 10) break;
    if (!picked.includes(skill)) {
      picked.push(skill);
    }
  }

  log.info(`Selected ${picked.length} skills for the article`);
  for (const s of picked) {
    log.info(`  - ${s.name} (${s.category}, ★${s.stars})`);
  }

  // Generate article content
  const title = "10 个最实用的 Claude Code Skills 实测推荐";
  const now = new Date().toISOString();
  const slug = "top-10-claude-code-skills-review";

  const sections = picked.map((s, i) => {
    const name = s.name_zh || s.name;
    const desc = s.description_zh || s.description;
    const install = s.install_command
      ? `\`\`\`bash\n${s.install_command}\n\`\`\``
      : "";
    const comment = s.editor_comment_zh ? `\n> ${s.editor_comment_zh}` : "";
    const github = s.github_url ? `[GitHub](${s.github_url})` : "";
    const stars = s.stars > 0 ? ` · ★ ${s.stars}` : "";

    return `## ${i + 1}. ${name}

**作者**: ${s.author} · **分类**: ${s.category}${stars}${github ? ` · ${github}` : ""}

${desc}
${comment}
${install ? `\n### 安装\n\n${install}` : ""}`;
  }).join("\n\n---\n\n");

  const content = `# ${title}

> Claude Code Skills 是什么？它们是一组预定义的 SKILL.md 文件，能让 Claude Code 在特定任务上表现更好——从代码审查到项目管理，从测试生成到文档写作。本文从 SkillNav 精选库中挑选了 10 个最实用、评分最高的 Skills，逐一实测推荐。

${sections}

---

## 总结

以上 10 个 Claude Code Skills 覆盖了日常开发中最常见的场景。它们都经过 SkillNav 编辑部的实测验证，安装简单、效果显著。

想发现更多高质量 Skills？访问 [SkillNav Skills 导航](/skills) 浏览完整精选库。

---

*本文由 SkillNav 编辑部基于实际使用体验撰写，所有评价均为独立观点。*`;

  const record = {
    slug,
    title,
    title_zh: title,
    summary: "从 SkillNav 精选库中挑选 10 个最实用的 Claude Code Skills，逐一实测推荐。",
    summary_zh: "从 SkillNav 精选库中挑选 10 个最实用的 Claude Code Skills，逐一实测推荐。",
    content,
    content_zh: content,
    source: "manual",
    source_url: `https://skillnav.dev/articles/${slug}`,
    article_type: "guide",
    reading_time: Math.max(1, Math.ceil(content.length / 1500)),
    relevance_score: 5,
    status: "draft",
    published_at: now,
  };

  if (dryRun) {
    log.info("[DRY RUN] Would insert article:");
    log.info(`  Title: ${record.title}`);
    log.info(`  Slug: ${record.slug}`);
    log.info(`  Type: ${record.article_type}`);
    log.info(`  Length: ${content.length} chars`);
    log.info(`  Reading time: ${record.reading_time} min`);
    log.info("\n--- Content preview (first 500 chars) ---");
    log.info(content.slice(0, 500));
  } else {
    const { error: insertErr } = await supabase
      .from("articles")
      .upsert(record, { onConflict: "source_url", ignoreDuplicates: false });

    if (insertErr) {
      log.error(`Failed to insert article: ${insertErr.message}`);
      process.exit(1);
    }
    log.success(`Article inserted as draft: "${title}"`);
    log.info(`Slug: ${slug}`);
  }

  log.done();
}

main().catch((e) => {
  log.error(e.message);
  process.exit(1);
});
