import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import { getPermissionQueue, getPermissionStats } from "@/lib/data/permissions";
import { PermissionReviewCard } from "@/components/admin/permission-review-card";

export const metadata: Metadata = { title: "权限审核" };

const BATCH = 20;

export default async function AdminPermissionsPage() {
  await requireAdmin();
  const [stats, queue] = await Promise.all([
    getPermissionStats(),
    getPermissionQueue(BATCH),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">权限审核</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          AI 写的初稿，改好后点「通过并上线」，详情页才会显示，并标注审核日期。
          待审 {stats.pending} 条 · 已通过 {stats.reviewed} 条。每次显示 {BATCH}{" "}
          条，刷新页面载入下一批。
        </p>
      </div>

      {queue.length === 0 ? (
        <p className="rounded-lg bg-background p-8 text-center text-sm text-muted-foreground ring-1 ring-border">
          没有待审核的初稿。新上架的条目会在每周三的 Backfill Data Quality
          任务里自动生成初稿。
        </p>
      ) : (
        <div className="space-y-4">
          {queue.map((item) => (
            <PermissionReviewCard
              key={`${item.type}-${item.slug}`}
              item={item}
            />
          ))}
        </div>
      )}
    </div>
  );
}
