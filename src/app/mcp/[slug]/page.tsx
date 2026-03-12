import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Star, Github, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { CopyButton } from "@/components/shared/copy-button";
import { GiscusComments } from "@/components/shared/giscus-comments";
import {
  BreadcrumbJsonLd,
  SoftwareApplicationJsonLd,
  FAQJsonLd,
} from "@/components/shared/json-ld";
import { MCPCard } from "@/components/mcp/mcp-card";
import { McpDetailSidebar } from "@/components/mcp/mcp-detail-sidebar";
import { McpReadme } from "@/components/mcp/mcp-readme";
import { siteConfig } from "@/lib/constants";
import { getMcpServerBySlug, getMcpServers, getAllMcpSlugs } from "@/lib/data";
import { fetchReadme } from "@/lib/github-readme";
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

  const title = `${server.nameZh ?? server.name} — MCP Server | ${siteConfig.name}`;
  const description =
    server.descriptionZh ??
    server.description ??
    `${server.name} MCP Server 详情`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `${siteConfig.url}/mcp/${server.slug}`,
    },
    alternates: {
      canonical: `${siteConfig.url}/mcp/${server.slug}`,
      languages: {
        "zh-CN": `${siteConfig.url}/mcp/${server.slug}`,
        en: `${siteConfig.url}/en/mcp/${server.slug}`,
      },
    },
  };
}

export default async function McpDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const server = await getMcpServerBySlug(slug);
  if (!server) notFound();

  // Parallel fetch: related servers + README
  const [allInCategory, readme] = await Promise.all([
    server.category
      ? getMcpServers({ category: server.category, limit: 4 })
      : Promise.resolve([]),
    server.githubUrl ? fetchReadme(server.githubUrl) : Promise.resolve(null),
  ]);
  const related = allInCategory.filter((s) => s.id !== server.id).slice(0, 3);

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "首页", href: "/" },
          { name: "MCP", href: "/mcp" },
          {
            name: server.nameZh ?? server.name,
            href: `/mcp/${server.slug}`,
          },
        ]}
      />
      <SoftwareApplicationJsonLd
        name={server.nameZh ?? server.name}
        description={server.descriptionZh ?? server.description ?? ""}
        url={`${siteConfig.url}/mcp/${server.slug}`}
        author={server.author}
        category={server.category ?? "DeveloperApplication"}
        stars={server.stars}
        installCommand={server.installCommand}
      />
      <FAQJsonLd
        questions={[
          {
            question: `${server.nameZh ?? server.name} 是什么？`,
            answer:
              server.descriptionZh ??
              server.description ??
              `${server.name} 是一个 MCP Server。`,
          },
          ...(server.installCommand
            ? [
                {
                  question: `如何安装 ${server.nameZh ?? server.name}？`,
                  answer: `运行命令：${server.installCommand}`,
                },
              ]
            : []),
        ]}
      />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <PageBreadcrumb
          items={[
            { label: "首页", href: "/" },
            { label: "MCP", href: "/mcp" },
            { label: server.nameZh ?? server.name },
          ]}
        />

        {/* Hero section */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {server.nameZh ?? server.name}
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
                编辑精选
              </Badge>
            )}
            {server.isFeatured && server.qualityTier !== "S" && (
              <Badge
                variant="secondary"
                className="border-amber-200 bg-amber-50 text-amber-700 text-xs dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
              >
                精选
              </Badge>
            )}
          </div>
          {server.nameZh && server.name && (
            <p className="mt-1 text-lg text-muted-foreground">{server.name}</p>
          )}
          {server.author && (
            <p className="mt-2 text-sm text-muted-foreground">
              by {server.author}
            </p>
          )}
          <p className="mt-4 text-base leading-relaxed text-foreground/85">
            {server.introZh ?? server.descriptionZh ?? server.description}
          </p>

          {/* Badges row */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {server.isVerified && (
              <Badge variant="secondary" className="text-xs">
                已验证
              </Badge>
            )}
            {server.stars > 0 && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="size-3.5" />
                {formatNumber(server.stars)}
              </span>
            )}
            {server.githubUrl && (
              <a
                href={server.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <Github className="size-3.5" />
                GitHub
              </a>
            )}
          </div>
        </div>

        {/* Two-column layout: main content + sidebar */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px]">
          {/* Left: main content */}
          <div className="min-w-0 space-y-6">
            {/* Editor review card */}
            {server.editorCommentZh && (
              <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-6 dark:border-amber-800/50 dark:bg-amber-950/20">
                <div className="mb-3 flex items-center gap-2">
                  <Award className="size-5 text-amber-600 dark:text-amber-400" />
                  <h2 className="text-lg font-semibold">编辑评测</h2>
                </div>
                <p className="text-sm leading-relaxed text-foreground/85">
                  {server.editorCommentZh}
                </p>
                {server.editorRating && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">评分:</span>
                    <span className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`size-4 ${
                            i < Number(server.editorRating)
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      ({server.editorRating}/5)
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Install command block */}
            {server.installCommand && (
              <div className="rounded-lg border border-border/40 bg-card p-6">
                <h2 className="mb-3 text-lg font-semibold">安装命令</h2>
                <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2.5 font-mono text-sm">
                  <code className="min-w-0 flex-1 truncate text-muted-foreground">
                    {server.installCommand}
                  </code>
                  <CopyButton text={server.installCommand} />
                </div>
              </div>
            )}

            {/* Install config JSON (if present) */}
            {server.installConfig && (
              <div className="rounded-lg border border-border/40 bg-card p-6">
                <h2 className="mb-3 text-lg font-semibold">配置示例</h2>
                <pre className="overflow-x-auto rounded-md border bg-muted/50 p-3 text-xs">
                  <code>{JSON.stringify(server.installConfig, null, 2)}</code>
                </pre>
              </div>
            )}

            {/* Intro */}
            {server.introZh && (
              <div className="rounded-lg border border-border/40 bg-card p-6">
                <h2 className="mb-3 text-lg font-semibold">简介</h2>
                <div className="prose prose-sm max-w-none text-foreground/85">
                  {server.introZh.split("\n").map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Tools list */}
            {server.tools && server.tools.length > 0 ? (
              <div className="rounded-lg border border-border/40 bg-card p-6">
                <h2 className="mb-3 text-lg font-semibold">
                  提供的工具 ({server.tools.length})
                </h2>
                <div className="space-y-3">
                  {server.tools.map((tool) => (
                    <div
                      key={tool.name}
                      className="rounded-md border border-border/30 bg-muted/30 px-4 py-3"
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
              <div className="rounded-lg border border-border/40 bg-card p-6">
                <h2 className="mb-3 text-lg font-semibold">提供的工具</h2>
                <p className="text-sm text-foreground/85">
                  该 MCP Server 提供{" "}
                  <span className="font-semibold">{server.toolsCount}</span>{" "}
                  个工具。
                  {server.githubUrl && (
                    <>
                      查看{" "}
                      <a
                        href={server.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        GitHub 仓库
                      </a>{" "}
                      了解详细工具列表。
                    </>
                  )}
                </p>
              </div>
            ) : null}

            {/* README from GitHub */}
            {readme && <McpReadme content={readme} />}

            {/* Comments (giscus) */}
            <GiscusComments />
          </div>

          {/* Right: sidebar */}
          <McpDetailSidebar server={server} />
        </div>
      </div>

      {/* Related MCP servers */}
      {related.length > 0 && (
        <section className="border-t border-border/40">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <h2 className="mb-6 text-xl font-bold">相关 MCP Server</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((s) => (
                <MCPCard key={s.id} server={s} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
