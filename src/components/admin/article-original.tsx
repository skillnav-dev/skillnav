"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { ArticlePreview } from "./article-preview";

interface ArticleOriginalProps {
  title: string;
  content: string;
}

/**
 * Collapsible panel showing the original English article.
 * Helps editors compare with the Chinese translation.
 */
export function ArticleOriginal({ title, content }: ArticleOriginalProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-muted/50"
      >
        {open ? (
          <ChevronDown className="size-4 shrink-0" />
        ) : (
          <ChevronRight className="size-4 shrink-0" />
        )}
        查看原文
      </button>
      {open && (
        <div className="border-t px-4 py-4">
          <h3 className="mb-4 text-base font-semibold">{title}</h3>
          <div className="max-h-[600px] overflow-y-auto">
            <ArticlePreview content={content} />
          </div>
        </div>
      )}
    </div>
  );
}
