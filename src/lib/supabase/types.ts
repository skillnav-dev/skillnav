/**
 * Supabase database type definitions.
 * Generate with: npx supabase gen types typescript --project-id <id>
 * This is the manual version matching our migration schema.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      skills: {
        Row: {
          id: string;
          slug: string;
          name: string;
          name_zh: string | null;
          description: string | null;
          description_zh: string | null;
          author: string | null;
          category: string | null;
          tags: string[];
          source:
            | "clawhub"
            | "skills_sh"
            | "anthropic"
            | "skillsmp"
            | "agentskill"
            | "manual"
            | "curated";
          source_url: string | null;
          github_url: string | null;
          stars: number;
          downloads: number;
          weekly_downloads: number;
          security_score: "safe" | "warning" | "danger" | "unscanned";
          is_verified: boolean;
          is_featured: boolean;
          pricing_type: "free" | "freemium" | "paid";
          platform: string[];
          version: string | null;
          screenshot_urls: string[];
          similar_skills: string[];
          content: string | null;
          content_zh: string | null;
          install_command: string | null;
          requires_env: string[];
          requires_bins: string[];
          editor_rating: string | null;
          editor_review_zh: string | null;
          editor_comment_zh: string | null;
          repo_source: string | null;
          quality_tier: "A" | "B" | "C" | null;
          is_hidden: boolean;
          status: "draft" | "published" | "hidden";
          intro_zh: string | null;
          quality_score: number | null;
          quality_reason: string | null;
          discovered_at: string;
          pushed_at: string | null;
          forks_count: number;
          is_archived: boolean;
          is_trending: boolean;
          weekly_stars_delta: number;
          freshness: "fresh" | "active" | "stale" | "archived";
          install_count: number;
          last_synced_at: string | null;
          last_verified_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["skills"]["Row"],
          "id" | "created_at" | "updated_at"
        > & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["skills"]["Insert"]>;
      };
      articles: {
        Row: {
          id: string;
          slug: string;
          title: string;
          title_zh: string | null;
          summary: string | null;
          summary_zh: string | null;
          content: string | null;
          content_zh: string | null;
          intro_zh: string | null;
          source: string | null;
          source_url: string | null;
          cover_image: string | null;
          reading_time: number;
          article_type: "tutorial" | "analysis" | "guide";
          status: "published" | "draft" | "hidden";
          relevance_score: number | null;
          content_tier: "editorial" | "translated";
          series: string | null;
          series_number: number | null;
          published_at: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["articles"]["Row"],
          "id" | "created_at" | "content_tier"
        > & {
          id?: string;
          created_at?: string;
          content_tier?: "editorial" | "translated";
        };
        Update: Partial<Database["public"]["Tables"]["articles"]["Insert"]>;
      };
      mcp_servers: {
        Row: {
          id: string;
          slug: string;
          name: string;
          name_zh: string | null;
          author: string | null;
          description: string | null;
          description_zh: string | null;
          intro_zh: string | null;
          category: string | null;
          tags: string[];
          github_url: string | null;
          npm_package: string | null;
          install_command: string | null;
          install_config: Record<string, unknown> | null;
          tools_count: number;
          tools:
            | {
                name: string;
                description?: string;
                inputSchema?: Record<string, unknown>;
              }[]
            | null;
          version: string | null;
          stars: number;
          forks_count: number;
          weekly_downloads: number;
          quality_score: number | null;
          quality_tier: "S" | "A" | "B" | "C";
          quality_reason: string | null;
          editor_comment_zh: string | null;
          editor_rating: string | null;
          status: "draft" | "published" | "hidden";
          source: string | null;
          source_url: string | null;
          is_verified: boolean;
          is_featured: boolean;
          is_trending: boolean;
          is_archived: boolean;
          weekly_stars_delta: number;
          freshness: "fresh" | "active" | "stale" | "archived";
          pushed_at: string | null;
          discovered_at: string;
          last_synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["mcp_servers"]["Row"],
          "id" | "created_at" | "updated_at"
        > & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["mcp_servers"]["Insert"]>;
      };
      daily_briefs: {
        Row: {
          id: string;
          brief_date: string;
          title: string;
          summary: string | null;
          content_md: string;
          content_wechat: string | null;
          content_x: string | null;
          content_zhihu: string | null;
          content_xhs: string | null;
          article_ids: string[];
          status: "draft" | "approved" | "published";
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["daily_briefs"]["Row"],
          "id" | "created_at" | "updated_at"
        > & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["daily_briefs"]["Insert"]>;
      };
      brief_publications: {
        Row: {
          id: string;
          brief_id: string;
          channel:
            | "wechat"
            | "x"
            | "rss"
            | "xiaohongshu"
            | "zhihu"
            | "email"
            | "openclaw";
          status: "pending" | "published" | "failed";
          published_at: string | null;
          external_url: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["brief_publications"]["Row"],
          "id" | "created_at"
        > & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["brief_publications"]["Insert"]
        >;
      };
      submissions: {
        Row: {
          id: string;
          skill_name: string;
          skill_url: string;
          submitter_email: string | null;
          description: string | null;
          is_fast_track: boolean;
          status: "pending" | "approved" | "rejected";
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["submissions"]["Row"],
          "id" | "created_at"
        > & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["submissions"]["Insert"]>;
      };
    };
  };
}

// Convenience aliases
export type SkillRow = Database["public"]["Tables"]["skills"]["Row"];
export type ArticleRow = Database["public"]["Tables"]["articles"]["Row"];
export type McpServerRow = Database["public"]["Tables"]["mcp_servers"]["Row"];
export type SubmissionRow = Database["public"]["Tables"]["submissions"]["Row"];
export type DailyBriefRow = Database["public"]["Tables"]["daily_briefs"]["Row"];
export type BriefPublicationRow =
  Database["public"]["Tables"]["brief_publications"]["Row"];
