"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/shared/code-block";

/** Strip leaked frontmatter and detect empty/trivial content */
function cleanContent(raw: string | undefined): string | null {
  if (!raw) return null;
  // Strip YAML frontmatter
  const stripped = raw.replace(/^---[\s\S]*?---\s*/, "").trim();
  // Too short to be useful
  if (stripped.length < 20) return null;
  return stripped;
}

interface SkillContentProps {
  content?: string;
  contentZh?: string;
}

export function SkillContent({ content, contentZh }: SkillContentProps) {
  // Default to Chinese if available
  const [showZh, setShowZh] = useState(true);

  const cleanedZh = cleanContent(contentZh);
  const cleanedEn = cleanContent(content);

  const hasZh = Boolean(cleanedZh);
  const hasEn = Boolean(cleanedEn);
  const hasBoth = hasZh && hasEn;

  // Determine which text to display
  const displayText = hasBoth
    ? showZh
      ? cleanedZh
      : cleanedEn
    : (cleanedZh ?? cleanedEn);

  if (!displayText) {
    return (
      <div className="rounded-xl border border-border/40 bg-card p-6">
        <h2 className="mb-3 text-lg font-semibold">文档</h2>
        <p className="text-sm text-muted-foreground">暂无文档内容。</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/40 bg-card p-6">
      {/* Header row: title + language toggle */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">文档</h2>
        {hasBoth && (
          <div className="flex gap-1 rounded-md border border-border p-0.5">
            <Button
              variant={showZh ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2.5 text-xs"
              onClick={() => setShowZh(true)}
            >
              中文
            </Button>
            <Button
              variant={!showZh ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2.5 text-xs"
              onClick={() => setShowZh(false)}
            >
              English
            </Button>
          </div>
        )}
      </div>

      {/* Markdown content */}
      <div className="prose prose-neutral dark:prose-invert max-w-none text-sm leading-relaxed">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={{ pre: CodeBlock }}
        >
          {displayText}
        </ReactMarkdown>
      </div>
    </div>
  );
}
