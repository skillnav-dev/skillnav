"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/shared/code-block";

interface McpReadmeProps {
  content: string;
}

/** Strip YAML frontmatter and trivial content */
function cleanReadme(raw: string): string | null {
  const stripped = raw.replace(/^---[\s\S]*?---\s*/, "").trim();
  if (stripped.length < 30) return null;
  return stripped;
}

export function McpReadme({ content }: McpReadmeProps) {
  const [expanded, setExpanded] = useState(false);
  const cleaned = cleanReadme(content);
  if (!cleaned) return null;

  return (
    <div className="rounded-xl ring-1 ring-border/40 bg-card p-6 shadow-sm">
      {/* Header with toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">README</h2>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1 text-xs text-muted-foreground"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              收起 <ChevronUp className="size-3.5" />
            </>
          ) : (
            <>
              展开 <ChevronDown className="size-3.5" />
            </>
          )}
        </Button>
      </div>

      {/* Content area */}
      <div
        className={expanded ? "mt-4" : "relative mt-4 max-h-64 overflow-hidden"}
      >
        <div className="prose prose-neutral dark:prose-invert max-w-none text-sm leading-relaxed">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{ pre: CodeBlock }}
          >
            {cleaned}
          </ReactMarkdown>
        </div>

        {/* Gradient overlay when collapsed */}
        {!expanded && (
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-card to-transparent" />
        )}
      </div>

      {/* Bottom expand button when collapsed */}
      {!expanded && (
        <div className="mt-2 text-center">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 text-xs text-muted-foreground"
            onClick={() => setExpanded(true)}
          >
            查看完整 README <ChevronDown className="size-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
