import type {
  HFPaper,
  ArticleRow,
  CommunitySignal,
  TrendingData,
} from "@/lib/trending-data";
import type { TrendingTool } from "@/lib/get-trending-tools";

export type TopOneTrack = "paper" | "tool" | "news" | "community";

export interface TopOne {
  track: TopOneTrack;
  score: number;
  paper?: HFPaper;
  tool?: TrendingTool;
  article?: ArticleRow;
  signal?: CommunitySignal;
  // Position in that track's ordered list (1-indexed for display)
  rankInTrack: number;
  totalInTrack: number;
}

// Normalized max so each track's top item scores 1.0, comparable across tracks.
export function computeTopOne(data: TrendingData): TopOne | null {
  const candidates: TopOne[] = [];

  const paperMax = Math.max(...data.papers.map((p) => p.upvotes), 1);
  data.papers.forEach((p, i) => {
    candidates.push({
      track: "paper",
      score: p.upvotes / paperMax,
      paper: p,
      rankInTrack: i + 1,
      totalInTrack: data.papers.length,
    });
  });

  const toolMax = Math.max(
    ...data.tools.map((t) => t.weekly_stars_delta || 0),
    1,
  );
  data.tools.forEach((t, i) => {
    candidates.push({
      track: "tool",
      score: (t.weekly_stars_delta || 0) / toolMax,
      tool: t,
      rankInTrack: i + 1,
      totalInTrack: data.tools.length,
    });
  });

  const artMax = Math.max(
    ...data.articles.map((a) => a.relevance_score || 0),
    1,
  );
  data.articles.forEach((a, i) => {
    candidates.push({
      track: "news",
      score: (a.relevance_score || 0) / artMax,
      article: a,
      rankInTrack: i + 1,
      totalInTrack: data.articles.length,
    });
  });

  const sigMax = Math.max(...data.communitySignals.map((s) => s.score || 0), 1);
  data.communitySignals.forEach((s, i) => {
    candidates.push({
      track: "community",
      score: (s.score || 0) / sigMax,
      signal: s,
      rankInTrack: i + 1,
      totalInTrack: data.communitySignals.length,
    });
  });

  if (!candidates.length) return null;
  return candidates.sort((a, b) => b.score - a.score)[0];
}
