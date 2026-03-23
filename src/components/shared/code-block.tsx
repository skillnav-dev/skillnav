"use client";

import { type ReactNode } from "react";
import { CopyButton } from "@/components/shared/copy-button";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyElement = { props?: Record<string, any>; children?: ReactNode };

/** Extract language from rehype-highlight's className (e.g. "language-bash hljs") */
function extractLanguage(children: ReactNode): string | null {
  if (!children || typeof children !== "object") return null;
  const child = (
    Array.isArray(children) ? children[0] : children
  ) as AnyElement | null;
  const className: string | undefined = child?.props?.className;
  if (!className) return null;
  const match = className.match(/language-(\w+)/);
  return match ? match[1] : null;
}

/** Extract raw text from nested React children */
function extractText(node: ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (!node) return "";
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (typeof node === "object" && "props" in node) {
    return extractText((node as AnyElement).props?.children as ReactNode);
  }
  return "";
}

/** Custom <pre> renderer for ReactMarkdown with copy button and language label */
export function CodeBlock({ children, ...props }: React.ComponentProps<"pre">) {
  const language = extractLanguage(children);
  const rawText = extractText(children).replace(/\n$/, "");

  return (
    <div className="not-prose group relative my-4 rounded-lg ring-1 ring-gray-950/10 bg-muted/50 dark:ring-gray-50/10 dark:bg-muted/30">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border/40 px-4 py-1.5">
        <span className="font-mono text-xs text-muted-foreground">
          {language ?? "code"}
        </span>
        <CopyButton text={rawText} />
      </div>
      {/* Code area */}
      <pre
        {...props}
        className="overflow-x-auto p-4 font-mono text-[13px] leading-6"
      >
        {children}
      </pre>
    </div>
  );
}
