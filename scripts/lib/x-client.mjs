/**
 * X/Twitter API abstraction layer.
 * Default provider: TwitterAPI.io (unofficial, $0.15/1k requests).
 * Abstraction allows switching to official API or twikit later.
 *
 * Supports HTTP_PROXY / HTTPS_PROXY env for GFW bypass.
 */

import { ProxyAgent } from "undici";

const FETCH_TIMEOUT = 15_000;

function getProxyDispatcher() {
  const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.https_proxy || process.env.http_proxy;
  if (!proxy) return undefined;
  return new ProxyAgent(proxy);
}

/**
 * Fetch recent original tweets for a given handle.
 * Excludes retweets and replies.
 * @param {string} handle - X username (without @)
 * @param {number} [limit=3] - max tweets to return
 * @returns {Promise<Array<{id: string, text: string, author: string, author_handle: string, likes: number, retweets: number, views: number, comments: number, created_at: string, url: string}>>}
 */
export async function fetchUserTweets(handle, limit = 3) {
  const apiKey = process.env.X_API_KEY;
  if (!apiKey) throw new Error("X_API_KEY is not set in environment");

  const params = new URLSearchParams({
    userName: handle,
    queryType: "Latest",
  });

  const fetchOpts = {
    headers: {
      "X-API-Key": apiKey,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT),
  };
  const dispatcher = getProxyDispatcher();
  if (dispatcher) fetchOpts.dispatcher = dispatcher;

  const res = await fetch(
    `https://api.twitterapi.io/twitter/user/last_tweets?${params}`,
    fetchOpts
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`TwitterAPI.io ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();

  // Normalize response — API returns { data: { tweets: [...] } } or { tweets: [...] } or [...]
  let tweets = [];
  if (Array.isArray(data?.data?.tweets)) tweets = data.data.tweets;
  else if (Array.isArray(data.tweets)) tweets = data.tweets;
  else if (Array.isArray(data.data)) tweets = data.data;
  else if (Array.isArray(data)) tweets = data;
  // If API returns an object with no array, return empty
  if (!Array.isArray(tweets)) return [];

  // Filter: original tweets only (no RT, no replies)
  return tweets
    .filter((t) => {
      const text = t.text || t.full_text || "";
      const isRT = text.startsWith("RT @");
      const isReply = !!(t.in_reply_to_status_id || t.in_reply_to_user_id);
      return !isRT && !isReply;
    })
    .slice(0, limit)
    .map((t) => ({
      id: String(t.id || t.id_str || ""),
      text: t.text || t.full_text || "",
      author: t.author?.name || t.user?.name || handle,
      author_handle: handle,
      likes: t.likeCount ?? t.favorite_count ?? 0,
      retweets: t.retweetCount ?? t.retweet_count ?? 0,
      views: t.viewCount ?? t.views?.count ?? 0,
      comments: t.replyCount ?? 0,
      created_at: t.createdAt || t.created_at || new Date().toISOString(),
      url: `https://x.com/${handle}/status/${t.id || t.id_str}`,
    }));
}
