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
            | "manual";
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
          quality_tier: "A" | "B" | "C" | null;
          is_hidden: boolean;
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
          source_url: string | null;
          cover_image: string | null;
          reading_time: number;
          article_type:
            | "news"
            | "review"
            | "comparison"
            | "tutorial"
            | "analysis"
            | "weekly";
          published_at: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["articles"]["Row"],
          "id" | "created_at"
        > & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["articles"]["Insert"]>;
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
export type SubmissionRow = Database["public"]["Tables"]["submissions"]["Row"];
