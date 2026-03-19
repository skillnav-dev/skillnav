"use client";

import { useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Brief {
  id: string;
  brief_date: string;
  title: string;
  summary: string | null;
  content_md: string;
  content_wechat: string | null;
  content_x: string | null;
  status: string;
  article_ids: string[] | null;
  created_at: string;
  updated_at: string;
}

interface Publication {
  id: string;
  brief_id: string;
  channel: string;
  status: string;
  published_at: string | null;
  external_url: string | null;
}

const statusConfig: Record<string, { label: string; variant: "secondary" | "outline" | "default"; className?: string }> = {
  draft: { label: "Draft", variant: "secondary" },
  approved: { label: "Approved", variant: "outline", className: "border-blue-500 text-blue-600" },
  published: { label: "Published", variant: "default", className: "bg-green-600" },
};

export function BriefDetail({ brief: initialBrief, publications }: { brief: Brief; publications: Publication[] }) {
  const [brief, setBrief] = useState(initialBrief);
  const [editContent, setEditContent] = useState(brief.content_md);
  const [saving, setSaving] = useState(false);

  const sc = statusConfig[brief.status] || statusConfig.draft;

  async function handleApprove() {
    const res = await fetch(`/api/admin/daily/${brief.id}/approve`, { method: "POST" });
    if (res.ok) {
      setBrief({ ...brief, status: "approved" });
      toast.success("已审核通过");
    } else {
      toast.error("审核失败");
    }
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/admin/daily/${brief.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content_md: editContent }),
    });
    if (res.ok) {
      setBrief({ ...brief, content_md: editContent });
      toast.success("已保存");
    } else {
      toast.error("保存失败");
    }
    setSaving(false);
  }

  async function copyToClipboard(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`已复制${label}`);
    } catch {
      toast.error("复制失败");
    }
  }

  async function handleMarkPublished(channel: string) {
    const res = await fetch(`/api/admin/daily/${brief.id}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel }),
    });
    if (res.ok) {
      toast.success(`已标记 ${channel} 已发布`);
      // Optimistic: reload would be cleaner but toast is enough for now
    } else {
      toast.error("标记失败");
    }
  }

  const pubMap = new Map(publications.map((p) => [p.channel, p]));

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/daily">
            <Button variant="ghost" size="sm">← Back</Button>
          </Link>
          <Badge variant={sc.variant} className={sc.className}>{sc.label}</Badge>
          <span className="text-sm text-muted-foreground">{brief.brief_date}</span>
        </div>
        <div className="flex gap-2">
          {brief.status === "draft" && (
            <Button onClick={handleApprove} size="sm">Approve</Button>
          )}
        </div>
      </div>

      <h1 className="mb-6 text-xl font-bold">{brief.title}</h1>

      {/* Tabs */}
      <Tabs defaultValue="preview">
        <TabsList className="mb-4 w-full overflow-x-auto sm:w-auto">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="wechat">WeChat</TabsTrigger>
          <TabsTrigger value="x">X Thread</TabsTrigger>
          <TabsTrigger value="edit">Edit Source</TabsTrigger>
        </TabsList>

        <TabsContent value="preview">
          <Card>
            <CardContent className="prose prose-sm max-w-none py-6 dark:prose-invert">
              <ReactMarkdown>{brief.content_md}</ReactMarkdown>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wechat">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <span className="text-sm font-medium">公众号 HTML 预览</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(brief.content_wechat || "", "公众号 HTML")}
                disabled={!brief.content_wechat}
              >
                Copy HTML
              </Button>
            </CardHeader>
            <CardContent>
              {brief.content_wechat ? (
                <div
                  className="rounded-lg border bg-white p-4"
                  dangerouslySetInnerHTML={{ __html: brief.content_wechat }}
                />
              ) : (
                <p className="py-8 text-center text-muted-foreground">
                  未生成公众号格式。请先 Approve 后重新生成。
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="x">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <span className="text-sm font-medium">X Thread 预览</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(brief.content_x || "", "X Thread")}
                disabled={!brief.content_x}
              >
                Copy All
              </Button>
            </CardHeader>
            <CardContent>
              {brief.content_x ? (
                <div className="space-y-3">
                  {brief.content_x.split(/--- Tweet \d+\/\d+ ---/).filter(Boolean).map((tweet, i) => (
                    <div
                      key={i}
                      className="rounded-lg border p-3 text-sm"
                    >
                      <div className="mb-1 text-xs text-muted-foreground">Tweet {i + 1}</div>
                      <p className="whitespace-pre-wrap">{tweet.trim()}</p>
                      <div className="mt-2 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => copyToClipboard(tweet.trim(), `Tweet ${i + 1}`)}
                        >
                          Copy
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-muted-foreground">
                  未生成 Thread。请先 Approve 后重新生成。
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="edit">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <span className="text-sm font-medium">Markdown 编辑</span>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </CardHeader>
            <CardContent>
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[400px] font-mono text-sm"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Publication Status */}
      <Card className="mt-6">
        <CardHeader>
          <span className="text-sm font-medium">Publication Status</span>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {["rss", "wechat", "x"].map((channel) => {
              const pub = pubMap.get(channel);
              const isPublished = pub?.status === "published";
              return (
                <div key={channel} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <span className={isPublished ? "text-green-600" : "text-muted-foreground"}>
                      {isPublished ? "✅" : "⚪"}
                    </span>
                    <span className="text-sm font-medium uppercase">{channel}</span>
                    <span className="text-xs text-muted-foreground">
                      {isPublished
                        ? `Published ${pub?.published_at ? new Date(pub.published_at).toLocaleString("zh-CN") : ""}`
                        : "Pending"}
                    </span>
                  </div>
                  {!isPublished && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkPublished(channel)}
                    >
                      Mark Done
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
