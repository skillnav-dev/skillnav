"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { changeArticleStatus } from "@/app/admin/articles/actions";

interface StatusToggleFormProps {
  articleId: string;
  currentStatus: string;
}

const STATUS_OPTIONS = [
  { value: "published", label: "发布" },
  { value: "draft", label: "草稿" },
  { value: "hidden", label: "隐藏" },
] as const;

export function StatusToggleForm({
  articleId,
  currentStatus,
}: StatusToggleFormProps) {
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(newStatus: string) {
    if (newStatus === currentStatus) return;

    const formData = new FormData();
    formData.set("id", articleId);
    formData.set("newStatus", newStatus);

    startTransition(async () => {
      await changeArticleStatus(formData);
    });
  }

  const otherStatuses = STATUS_OPTIONS.filter(
    (opt) => opt.value !== currentStatus,
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isPending}>
          {isPending ? "..." : "切换"}
          <ChevronDown className="ml-1 size-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {otherStatuses.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => handleStatusChange(opt.value)}
          >
            {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
