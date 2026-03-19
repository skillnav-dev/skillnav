import { createServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import type { DailyBriefRow, BriefPublicationRow } from "@/lib/supabase/types";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const statusConfig: Record<string, { label: string; variant: "secondary" | "outline" | "default"; className?: string }> = {
  draft: { label: "Draft", variant: "secondary" },
  approved: { label: "Approved", variant: "outline", className: "border-blue-500 text-blue-600" },
  published: { label: "Published", variant: "default", className: "bg-green-600" },
};

const channelEmoji: Record<string, string> = {
  rss: "📡",
  wechat: "💬",
  x: "𝕏",
};

export default async function DailyBriefsPage() {
  await requireAdmin();
  const supabase = await createServerClient();

  // Fetch recent briefs with publication status
  const { data: briefsRaw } = await supabase
    .from("daily_briefs" as "skills")
    .select("id, brief_date, title, summary, status, article_ids, created_at")
    .order("brief_date" as "created_at", { ascending: false })
    .limit(14);
  const briefs = briefsRaw as unknown as Pick<DailyBriefRow, "id" | "brief_date" | "title" | "summary" | "status" | "article_ids" | "created_at">[] | null;

  // Fetch publications for these briefs
  const briefIds = (briefs || []).map((b) => b.id);
  const { data: pubsRaw } = briefIds.length
    ? await supabase
        .from("brief_publications" as "skills")
        .select("brief_id, channel, status")
        .in("brief_id" as "id", briefIds)
    : { data: [] };
  const publications = pubsRaw as unknown as Pick<BriefPublicationRow, "brief_id" | "channel" | "status">[] | null;

  // Group publications by brief_id
  const pubMap = new Map<string, Record<string, string>>();
  for (const pub of publications || []) {
    if (!pubMap.has(pub.brief_id)) pubMap.set(pub.brief_id, {});
    pubMap.get(pub.brief_id)![pub.channel] = pub.status;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Daily Briefs</h1>
          <p className="text-sm text-muted-foreground">AI 每日简报管理</p>
        </div>
      </div>

      {!briefs?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="mb-2 text-lg font-medium">今天还没有简报</p>
            <p className="mb-4 text-sm text-muted-foreground">
              运行 <code className="rounded bg-muted px-1.5 py-0.5 text-xs">node scripts/generate-daily.mjs</code> 生成
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {briefs.map((brief) => {
            const sc = statusConfig[brief.status as keyof typeof statusConfig] || statusConfig.draft;
            const pubs = pubMap.get(brief.id) || {};
            const articleCount = brief.article_ids?.length || 0;

            return (
              <Card key={brief.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          📅 {brief.brief_date}
                        </span>
                        <Badge variant={sc.variant} className={sc.className}>
                          {sc.label}
                        </Badge>
                      </div>
                      <h2 className="truncate text-lg font-semibold">{brief.title}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {articleCount} articles ·{" "}
                        {new Date(brief.created_at).toLocaleTimeString("zh-CN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        generated
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {["rss", "wechat", "x"].map((ch) => {
                        const status = pubs[ch];
                        const emoji = channelEmoji[ch] || ch;
                        const color = status === "published" ? "text-green-600" : "text-muted-foreground/40";
                        return (
                          <span key={ch} className={`text-sm ${color}`} title={`${ch}: ${status || "not started"}`}>
                            {emoji}
                          </span>
                        );
                      })}
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/admin/daily/${brief.id}`}>
                        <Button variant="outline" size="sm">
                          Preview
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
