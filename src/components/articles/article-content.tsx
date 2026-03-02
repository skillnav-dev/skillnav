interface ArticleContentProps {
  content: string;
}

export function ArticleContent({ content }: ArticleContentProps) {
  // Simple markdown-like rendering for mock data
  // Will be replaced by MDX or rich text renderer later
  const html = content
    .replace(/^### (.+)$/gm, '<h3 class="mt-8 mb-3 text-lg font-semibold">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="mt-10 mb-4 text-xl font-bold">$1</h2>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-muted-foreground">$1</li>')
    .replace(
      /\*\*(.+?)\*\*/g,
      '<strong class="font-semibold text-foreground">$1</strong>'
    )
    .replace(
      /```(\w+)?\n([\s\S]*?)```/g,
      '<pre class="my-4 overflow-x-auto rounded-lg bg-muted p-4"><code class="text-sm font-mono">$2</code></pre>'
    )
    .replace(
      /`([^`]+)`/g,
      '<code class="rounded bg-muted px-1.5 py-0.5 text-sm font-mono">$1</code>'
    )
    .replace(/\n\n/g, '</p><p class="mt-4 leading-relaxed text-muted-foreground">')
    .replace(/^\d+\. \*\*(.+?)\*\*：(.+)$/gm, '<li class="ml-4 list-decimal"><strong class="font-semibold text-foreground">$1</strong>：$2</li>');

  return (
    <div
      className="prose-custom"
      dangerouslySetInnerHTML={{
        __html: `<p class="leading-relaxed text-muted-foreground">${html}</p>`,
      }}
    />
  );
}
