/**
 * Content quality scoring via LLM.
 * Used by sync-articles.mjs after translation, before DB insert.
 *
 * Two dimensions:
 *   - audience_fit (0-10): Would SkillNav readers care about this?
 *   - credibility (0-10): Serious analysis vs PR/satire/marketing?
 *
 * Decision rules:
 *   - Both >= 7 → "publish"
 *   - Either < 4 → "hidden"
 *   - Otherwise → "draft" (human review)
 */

import { callLLMText } from "./llm.mjs";
import { createLogger } from "./logger.mjs";

const log = createLogger("quality");

const SYSTEM_PROMPT = `You are a content quality auditor for SkillNav, a Chinese-language site for AI developers.
Core topics: AI Agent, Claude Code, MCP (Model Context Protocol), Skills, dev tools, AI programming.

Score this article on two dimensions (0-10):
1. audience_fit: Would AI tool developers (our readers) care about this topic?
   - 9-10: Directly about AI agents, coding tools, MCP, Skills
   - 6-8: Related AI/ML topic with developer relevance
   - 3-5: General AI news, company announcements, policy
   - 0-2: Unrelated, or about non-developer audiences (education, healthcare partnerships)

2. credibility: Is this serious, trustworthy content?
   - 9-10: Deep technical analysis, tutorial, benchmarks
   - 6-8: Product launch, industry report, news coverage
   - 3-5: PR/press release, promotional, shallow overview
   - 0-2: Satire, fiction, spam, joke article

Output ONLY a JSON object: {"audience_fit": N, "credibility": N, "reason": "one sentence"}`;

/**
 * Score an article using LLM.
 * @param {object} article - { title_zh, content_zh, source }
 * @returns {{ audience_fit: number, credibility: number, action: string, reason: string }}
 */
export async function scoreArticle(article) {
  const preview = (article.content_zh || "").slice(0, 600);
  const userMsg = JSON.stringify({
    title: article.title_zh,
    source: article.source,
    content_preview: preview,
  });

  try {
    const response = await callLLMText(SYSTEM_PROMPT, userMsg, 256);
    const cleaned = response.replace(/```json?/g, "").replace(/```/g, "").trim();
    const scores = JSON.parse(cleaned);

    const { audience_fit, credibility, reason } = scores;
    let action;
    if (audience_fit >= 7 && credibility >= 7) {
      action = "publish";
    } else if (audience_fit < 4 || credibility < 4) {
      action = "hidden";
    } else {
      action = "draft";
    }

    return { audience_fit, credibility, action, reason: reason || "" };
  } catch (e) {
    log.warn(`Score failed for "${article.title_zh?.slice(0, 30)}": ${e.message}`);
    return { audience_fit: 5, credibility: 5, action: "draft", reason: "scoring failed" };
  }
}

/**
 * Decide final status based on quality score + existing status.
 * Only downgrades (publish→draft, draft→hidden), never upgrades.
 */
export function applyQualityDecision(currentStatus, qualityAction) {
  const rank = { hidden: 0, draft: 1, publish: 2 };
  // Never upgrade: if quality says publish but current is draft, keep draft
  // Only downgrade: if quality says hidden but current is draft, make hidden
  if (rank[qualityAction] < rank[currentStatus]) {
    return qualityAction === "publish" ? "draft" : qualityAction;
  }
  return currentStatus;
}
