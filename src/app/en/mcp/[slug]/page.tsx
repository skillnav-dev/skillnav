import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Star,
  Github,
  ExternalLink,
  Calendar,
  Clock,
  Award,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/shared/copy-button";
import {
  BreadcrumbJsonLd,
  SoftwareApplicationJsonLd,
  FAQJsonLd,
} from "@/components/shared/json-ld";
import { siteConfig } from "@/lib/constants";
import { getMcpServerBySlug, getMcpServers, getAllMcpSlugs } from "@/lib/data";
import { formatNumber } from "@/lib/utils";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = true;
export const revalidate = 86400; // 24h ISR

export async function generateStaticParams() {
  const slugs = await getAllMcpSlugs({ limit: 200 });
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const server = await getMcpServerBySlug(slug);
  if (!server) return {};

  const title = `${server.name} — MCP Server`;
  const description = server.description ?? `${server.name} MCP Server details`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `${siteConfig.url}/en/mcp/${server.slug}`,
    },
    alternates: {
      canonical: `${siteConfig.url}/en/mcp/${server.slug}`,
      languages: {
        "zh-CN": `${siteConfig.url}/mcp/${server.slug}`,
        en: `${siteConfig.url}/en/mcp/${server.slug}`,
      },
    },
  };
}

// Freshness labels in English
const freshnessLabels: Record<string, string> = {
  fresh: "Recently Updated",
  active: "Actively Maintained",
  stale: "Slow Updates",
  archived: "Archived",
};

// Source labels in English
const sourceLabels: Record<string, string> = {
  "official-registry": "Official Registry",
  smithery: "Smithery",
  glama: "Glama",
  manual: "Manual",
};

export default async function EnMcpDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const server = await getMcpServerBySlug(slug);
  if (!server) notFound();

  // Fetch related servers in the same category
  const allInCategory = server.category
    ? await getMcpServers({ category: server.category, limit: 4 })
    : [];
  const related = allInCategory.filter((s) => s.id !== server.id).slice(0, 3);

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/en" },
          { name: "MCP Servers", href: "/en/mcp" },
          { name: server.name, href: `/en/mcp/${server.slug}` },
        ]}
      />
      <SoftwareApplicationJsonLd
        name={server.name}
        description={server.description ?? ""}
        url={`${siteConfig.url}/en/mcp/${server.slug}`}
        author={server.author}
        category={server.category ?? "DeveloperApplication"}
        stars={server.stars}
        installCommand={server.installCommand}
      />
      <FAQJsonLd
        questions={[
          {
            question: `What is ${server.name}?`,
            answer: server.description ?? `${server.name} is an MCP Server.`,
          },
          ...(server.installCommand
            ? [
                {
                  question: `How to install ${server.name}?`,
                  answer: `Run: ${server.installCommand}`,
                },
              ]
            : []),
        ]}
      />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <nav className="mb-6 text-sm text-muted-foreground">
          <Link href="/en/mcp" className="hover:text-primary">
            MCP Servers
          </Link>
          <span className="mx-2">/</span>
          <span>{server.name}</span>
        </nav>

        {/* Hero section */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {server.name}
            </h1>
            {server.category && (
              <Badge variant="secondary" className="text-xs">
                {server.category}
              </Badge>
            )}
            {server.qualityTier === "S" && (
              <Badge
                variant="secondary"
                className="border-amber-200 bg-amber-100 text-amber-800 text-xs dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
              >
                <Award className="mr-0.5 size-3" />
                Editor&apos;s Pick
              </Badge>
            )}
            {server.isFeatured && server.qualityTier !== "S" && (
              <Badge
                variant="secondary"
                className="border-amber-200 bg-amber-50 text-amber-700 text-xs dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
              >
                Featured
              </Badge>
            )}
          </div>
          {server.author && (
            <p className="mt-2 text-sm text-muted-foreground">
              by {server.author}
            </p>
          )}
          <p className="mt-4 text-base leading-relaxed text-foreground/85">
            {server.description}
          </p>
          {server.isVerified && (
            <div className="mt-3">
              <Badge variant="secondary" className="text-xs">
                Verified
              </Badge>
            </div>
          )}
          <p className="mt-4 text-sm text-muted-foreground">
            <Link
              href={`/mcp/${server.slug}`}
              className="text-primary hover:underline"
            >
              View Chinese version with editor review
            </Link>
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px]">
          {/* Left: main content */}
          <div className="min-w-0 space-y-6">
            {/* Install command */}
            {server.installCommand && (
              <div className="rounded-xl border border-border/40 bg-card p-6">
                <h2 className="mb-3 text-lg font-semibold">Install</h2>
                <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2.5 font-mono text-sm">
                  <code className="min-w-0 flex-1 truncate text-muted-foreground">
                    {server.installCommand}
                  </code>
                  <CopyButton text={server.installCommand} label="Copy" />
                </div>
              </div>
            )}

            {/* Install config JSON */}
            {server.installConfig && (
              <div className="rounded-xl border border-border/40 bg-card p-6">
                <h2 className="mb-3 text-lg font-semibold">
                  Configuration Example
                </h2>
                <pre className="overflow-x-auto rounded-md border bg-muted/50 p-3 text-xs">
                  <code>{JSON.stringify(server.installConfig, null, 2)}</code>
                </pre>
              </div>
            )}

            {/* Tools list */}
            {server.tools && server.tools.length > 0 ? (
              <div className="rounded-xl border border-border/40 bg-card p-6">
                <h2 className="mb-3 text-lg font-semibold">
                  Tools ({server.tools.length})
                </h2>
                <div className="space-y-3">
                  {server.tools.map((tool) => (
                    <div
                      key={tool.name}
                      className="rounded-md border border-border/40 bg-muted/30 px-4 py-3"
                    >
                      <code className="text-sm font-semibold text-primary">
                        {tool.name}
                      </code>
                      {tool.description && (
                        <p className="mt-1 text-sm text-foreground/75">
                          {tool.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : server.toolsCount > 0 ? (
              <div className="rounded-xl border border-border/40 bg-card p-6">
                <h2 className="mb-3 text-lg font-semibold">Tools</h2>
                <p className="text-sm text-foreground/85">
                  This MCP Server provides{" "}
                  <span className="font-semibold">{server.toolsCount}</span>{" "}
                  tools.
                  {server.githubUrl && (
                    <>
                      {" "}
                      See the{" "}
                      <a
                        href={server.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        GitHub repository
                      </a>{" "}
                      for the full tool list.
                    </>
                  )}
                </p>
              </div>
            ) : null}
          </div>

          {/* Right: sidebar */}
          <aside className="space-y-4">
            {server.githubUrl && (
              <a
                href={server.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border border-border/40 bg-card p-4 text-sm hover:border-primary/30"
              >
                <p className="font-medium">GitHub Repository</p>
                <p className="mt-1 text-muted-foreground">
                  {server.stars > 0 && `${formatNumber(server.stars)} stars`}
                </p>
              </a>
            )}
            <div className="rounded-lg border border-border/40 bg-card p-4 text-sm">
              <p className="font-medium">Details</p>
              <dl className="mt-2 space-y-2 text-muted-foreground">
                {server.category && (
                  <div>
                    <dt className="text-xs uppercase">Category</dt>
                    <dd>{server.category}</dd>
                  </div>
                )}
                {server.source && (
                  <div>
                    <dt className="text-xs uppercase">Source</dt>
                    <dd>{sourceLabels[server.source] ?? server.source}</dd>
                  </div>
                )}
                {server.toolsCount > 0 && (
                  <div>
                    <dt className="text-xs uppercase">Tools</dt>
                    <dd>{server.toolsCount}</dd>
                  </div>
                )}
                {server.version && (
                  <div>
                    <dt className="text-xs uppercase">Version</dt>
                    <dd>v{server.version}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs uppercase">Freshness</dt>
                  <dd>
                    {freshnessLabels[server.freshness] ?? server.freshness}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase">Added</dt>
                  <dd>
                    {new Date(server.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
      </div>

      {/* Related MCP servers */}
      {related.length > 0 && (
        <section className="border-t border-border/40">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <h2 className="mb-6 text-xl font-bold">Related MCP Servers</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((s) => (
                <div
                  key={s.slug}
                  className="rounded-lg border border-border/40 bg-card p-4"
                >
                  <Link
                    href={`/en/mcp/${s.slug}`}
                    className="font-semibold hover:text-primary"
                  >
                    {s.name}
                  </Link>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {s.description ?? ""}
                  </p>
                  {s.stars > 0 && (
                    <span className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="size-3" />
                      {formatNumber(s.stars)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
