"use client";

import {
  useMemo,
  useEffect,
  useState,
  useCallback,
  lazy,
  Suspense,
} from "react";
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

type ArticleContentProps =
  | { content: string; slug?: never }
  | { slug: string; content?: never };

function MarkdownRenderer({ content }: { content: string }) {
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

function ContentSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-4 bg-muted rounded w-full" />
      <div className="h-4 bg-muted rounded w-5/6" />
      <div className="h-4 bg-muted rounded w-4/6" />
      <div className="h-32 bg-muted/50 rounded" />
      <div className="h-4 bg-muted rounded w-full" />
      <div className="h-4 bg-muted rounded w-3/4" />
    </div>
  );
}

// Fetch content directly from Supabase (bypasses CF Worker CPU limits)
async function fetchArticleContent(
  slug: string,
  signal: AbortSignal,
): Promise<{ content: string; hasMath: boolean }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const res = await fetch(
    `${url}/rest/v1/articles?slug=eq.${encodeURIComponent(slug)}&status=eq.published&select=content_zh,content&limit=1`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      signal,
    },
  );

  if (!res.ok) throw new Error(`Supabase ${res.status}`);
  const rows = await res.json();
  if (!rows.length) throw new Error("not found");

  const content = rows[0].content_zh ?? rows[0].content ?? "";
  return { content, hasMath: /\$[\s\S]+?\$/.test(content) };
}

function LazyContent({ slug }: { slug: string }) {
  const [content, setContent] = useState<string | null>(null);
  const [hasMath, setHasMath] = useState(false);
  const [error, setError] = useState(false);

  const fetchContent = useCallback(() => {
    setError(false);
    const controller = new AbortController();

    fetchArticleContent(slug, controller.signal)
      .then((data) => {
        setContent(data.content);
        setHasMath(data.hasMath);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(true);
      });

    return () => controller.abort();
  }, [slug]);

  useEffect(() => {
    return fetchContent();
  }, [fetchContent]);

  if (error) {
    return (
      <div className="rounded-lg border border-border/40 bg-muted/30 p-8 text-center">
        <p className="text-muted-foreground">正文加载失败</p>
        <button
          onClick={fetchContent}
          className="mt-3 text-sm text-primary hover:underline"
        >
          点击重试
        </button>
      </div>
    );
  }

  if (content === null) return <ContentSkeleton />;

  if (hasMath) {
    return (
      <Suspense fallback={<MarkdownRenderer content={content} />}>
        <MathArticleContent content={content} />
      </Suspense>
    );
  }

  return <MarkdownRenderer content={content} />;
}

export function ArticleContent(props: ArticleContentProps) {
  if ("slug" in props && props.slug) {
    return <LazyContent slug={props.slug} />;
  }
  return <MarkdownRenderer content={props.content!} />;
}
