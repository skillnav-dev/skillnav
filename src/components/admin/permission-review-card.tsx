"use client";

import { useState, useTransition } from "react";
import { Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { approvePermissionsAction } from "@/app/admin/permissions/actions";
import { FILE_ACCESS_LABELS, type FileAccess } from "@/lib/permissions";
import type { PermissionQueueItem } from "@/lib/data/permissions";

/** One pending draft: editable fields + approve. Approved cards disappear. */
export function PermissionReviewCard({ item }: { item: PermissionQueueItem }) {
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();
  const d = item.draft;
  const id = `${item.type}-${item.slug}`;
  const detailHref = `/${item.type === "skill" ? "skills" : "mcp"}/${item.slug}`;

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await approvePermissionsAction(formData);
      if (result.ok) {
        toast.success(`已通过：${item.name}`);
        setDone(true);
      } else {
        toast.error(`保存失败：${result.error ?? "未知错误"}`);
      }
    });
  }

  if (done) return null;

  return (
    <form
      action={handleSubmit}
      className="space-y-4 rounded-lg bg-background p-5 ring-1 ring-border"
    >
      <input type="hidden" name="type" value={item.type} />
      <input type="hidden" name="slug" value={item.slug} />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">
          {item.type === "skill" ? "Skill" : "MCP"}
        </Badge>
        <a
          href={detailHref}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold hover:underline"
        >
          {item.name}
        </a>
        {item.githubUrl && (
          <a
            href={item.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="size-3" />
            GitHub
          </a>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-files`}>读写文件</Label>
          <Select name="files" defaultValue={d.files}>
            <SelectTrigger id={`${id}-files`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(FILE_ACCESS_LABELS) as FileAccess[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {FILE_ACCESS_LABELS[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input name="files_note" defaultValue={d.files_note} />
        </div>
        <div className="space-y-1.5">
          <Label className="flex items-center gap-2">
            <Checkbox name="exec" defaultChecked={d.exec} />
            执行命令
          </Label>
          <Input name="exec_note" defaultValue={d.exec_note} />
        </div>
        <div className="space-y-1.5">
          <Label className="flex items-center gap-2">
            <Checkbox name="network" defaultChecked={d.network} />
            联网
          </Label>
          <Input name="network_note" defaultValue={d.network_note} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${id}-secrets`}>
          需要的密钥（逗号分隔，没有就留空）
        </Label>
        <Input
          id={`${id}-secrets`}
          name="secrets"
          defaultValue={d.secrets.join(", ")}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-risk`}>风险提示</Label>
        <Textarea
          id={`${id}-risk`}
          name="risk_zh"
          defaultValue={d.risk_zh}
          rows={2}
        />
      </div>

      <Button type="submit" size="sm" disabled={isPending}>
        <Check className="size-4" />
        {isPending ? "保存中…" : "通过并上线"}
      </Button>
    </form>
  );
}
