"use client";

import { useMemo, lazy, Suspense } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { CodeBlock } from "@/components/shared/code-block";

// Lazy-load math plugins only when content contains formulas
const MathArticleContent = lazy(() => import("./article-content-math"));

const linkComponent = ({
  href,
  children,
  ...props
}: React.ComponentProps<"a">) => (
  <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
    {children}
  </a>
);

interface ArticleContentProps {
  content: string;
}

export function ArticleContent({ content }: ArticleContentProps) {
  const hasMath = useMemo(() => /\$[\s\S]+?\$/.test(content), [content]);

  if (hasMath) {
    return (
      <Suspense
        fallback={
          <div className="prose prose-neutral dark:prose-invert max-w-none leading-relaxed">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{ pre: CodeBlock, a: linkComponent }}
            >
              {content}
            </ReactMarkdown>
          </div>
        }
      >
        <MathArticleContent content={content} />
      </Suspense>
    );
  }

  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{ pre: CodeBlock, a: linkComponent }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
