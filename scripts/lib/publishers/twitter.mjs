/**
 * X/Twitter thread formatter.
 * Converts a daily brief into a series of tweets following the design spec template.
 *
 * Template (from /plan-design-review):
 *   Tweet 1 (opener): 📊 AI Daily Brief | {date} \n 今天 {N} 条值得关注的 AI 动态 \n 🧵 Thread ↓
 *   Tweet 2-N (items): {N}️⃣ {title} \n {1-2句摘要} \n 🔗 {link}
 *   Tweet N+1 (closer): ☕ That's today's brief. \n Subscribe: skillnav.dev \n #AI #DevTools #AIDaily
 */

const MAX_TWEET_LENGTH = 280;
const HASHTAGS = "#AI #DevTools #AIDaily";

/**
 * @typedef {object} BriefItem
 * @property {string} title - Article title (Chinese)
 * @property {string} summary - 1-2 sentence summary
 * @property {string} url - Full URL to article
 */

/**
 * Generate an X thread from brief items.
 *
 * @param {BriefItem[]} items - Articles to include in the thread
 * @param {object} meta - { date: string }
 * @returns {string[]} Array of tweet texts
 */
export function formatXThread(items, meta = {}) {
  const { date = new Date().toISOString().slice(0, 10) } = meta;
  const tweets = [];

  // Tweet 1: opener
  tweets.push(
    `📊 AI Daily Brief | ${date}\n今天 ${items.length} 条值得关注的 AI 动态\n\n🧵 Thread ↓`
  );

  // Tweet 2-N: items
  const numberEmojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const num = i < numberEmojis.length ? numberEmojis[i] : `${i + 1}.`;
    const link = item.url ? `\n🔗 ${item.url}` : "";

    let tweet = `${num} ${item.title}`;
    if (item.summary) {
      tweet += `\n${item.summary}`;
    }
    tweet += link;

    // Truncate summary if tweet exceeds limit
    if (tweet.length > MAX_TWEET_LENGTH && item.summary) {
      const availableForSummary =
        MAX_TWEET_LENGTH - `${num} ${item.title}\n`.length - link.length - 3; // 3 for "..."
      if (availableForSummary > 20) {
        const truncatedSummary = item.summary.slice(0, availableForSummary) + "...";
        tweet = `${num} ${item.title}\n${truncatedSummary}${link}`;
      } else {
        // Drop summary entirely
        tweet = `${num} ${item.title}${link}`;
      }
    }

    tweets.push(tweet);
  }

  // Final tweet: closer
  tweets.push(`☕ That's today's brief.\nSubscribe: skillnav.dev\n\n💻 在 Claude Code 中使用：/skillnav brief\n\n${HASHTAGS}`);

  return tweets;
}

/**
 * Format a thread as a single copyable text block with separators.
 * @param {string[]} tweets
 * @returns {string}
 */
export function threadToText(tweets) {
  return tweets
    .map((t, i) => `--- Tweet ${i + 1}/${tweets.length} ---\n${t}`)
    .join("\n\n");
}
