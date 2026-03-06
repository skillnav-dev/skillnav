"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { CodeBlock } from "@/components/shared/code-block";

interface ArticlePreviewProps {
  content: string;
}

/**
 * Markdown preview panel for article editor.
 * Reuses the same ReactMarkdown config as the public article page.
 */
export function ArticlePreview({ content }: ArticlePreviewProps) {
  if (!content.trim()) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        在左侧编辑区输入内容后，这里会实时预览
      </div>
    );
  }

  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          pre: CodeBlock,
          a: ({ href, children, ...props }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
