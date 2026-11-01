import { createStaticClient } from "@/lib/supabase/static";
import { createAdminClient } from "@/lib/data/admin";
import {
  normalizePermissions,
  type PermissionItemType,
  type Permissions,
} from "@/lib/permissions";

// tool_permissions is not in the generated Database types yet.
const TABLE = "tool_permissions" as "skills";

export interface ReviewedPermissions {
  permissions: Permissions;
  reviewedAt: string;
}

/**
 * Editor-reviewed permissions for a detail page, or null.
 * Failure-tolerant: returns null if the table doesn't exist yet.
 */
export async function getReviewedPermissions(
  type: PermissionItemType,
  slug: string,
): Promise<ReviewedPermissions | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const { data, error } = await createStaticClient()
    .from(TABLE)
    .select("final, reviewed_at" as "slug")
    .eq("item_type" as "slug", type)
    .eq("slug", slug)
    .not("reviewed_at" as "slug", "is", null)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as unknown as { final: unknown; reviewed_at: string };
  const permissions = normalizePermissions(row.final);
  return permissions ? { permissions, reviewedAt: row.reviewed_at } : null;
}

export interface PermissionQueueItem {
  type: PermissionItemType;
  slug: string;
  name: string;
  githubUrl: string | null;
  draft: Permissions;
  generatedAt: string;
}

export interface PermissionStats {
  pending: number;
  reviewed: number;
}

export async function getPermissionStats(): Promise<PermissionStats> {
  const supabase = createAdminClient();
  const [pending, reviewed] = await Promise.all([
    supabase
      .from(TABLE)
      .select("slug", { count: "exact", head: true })
      .is("reviewed_at" as "slug", null),
    supabase
      .from(TABLE)
      .select("slug", { count: "exact", head: true })
      .not("reviewed_at" as "slug", "is", null),
  ]);
  return { pending: pending.count ?? 0, reviewed: reviewed.count ?? 0 };
}

/** Oldest pending drafts first, with the listing's display name. */
export async function getPermissionQueue(
  limit = 20,
): Promise<PermissionQueueItem[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("item_type, slug, draft, generated_at" as "slug")
    .is("reviewed_at" as "slug", null)
    .order("generated_at" as "created_at", { ascending: true })
    .limit(limit);
  if (error || !data) return [];

  const rows = data as unknown as {
    item_type: PermissionItemType;
    slug: string;
    draft: unknown;
    generated_at: string;
  }[];

  const names = new Map<string, { name: string; githubUrl: string | null }>();
  for (const [type, table] of [
    ["skill", "skills"],
    ["mcp", "mcp_servers"],
  ] as const) {
    const slugs = rows.filter((r) => r.item_type === type).map((r) => r.slug);
    if (slugs.length === 0) continue;
    const { data: items } = await supabase
      .from(table as "skills")
      .select("slug, name, name_zh, github_url")
      .in("slug", slugs);
    type NameRow = {
      slug: string;
      name: string;
      name_zh: string | null;
      github_url: string | null;
    };
    for (const it of (items ?? []) as unknown as NameRow[]) {
      names.set(`${type}:${it.slug}`, {
        name: it.name_zh ? `${it.name_zh}（${it.name}）` : it.name,
        githubUrl: it.github_url,
      });
    }
  }

  return rows.flatMap((r) => {
    const draft = normalizePermissions(r.draft);
    if (!draft) return [];
    const meta = names.get(`${r.item_type}:${r.slug}`);
    return [
      {
        type: r.item_type,
        slug: r.slug,
        name: meta?.name ?? r.slug,
        githubUrl: meta?.githubUrl ?? null,
        draft,
        generatedAt: r.generated_at,
      },
    ];
  });
}

/** Publish the editor's version and stamp the review date. */
export async function approvePermissions(
  type: PermissionItemType,
  slug: string,
  final: Permissions,
): Promise<void> {
  const supabase = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from(TABLE) as any)
    .update({ final, reviewed_at: new Date().toISOString() })
    .eq("item_type", type)
    .eq("slug", slug);
  if (error) throw new Error(error.message);
}
