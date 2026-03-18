import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Star, Github, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { GiscusComments } from "@/components/shared/giscus-comments";
import {
  BreadcrumbJsonLd,
  SoftwareApplicationJsonLd,
  FAQJsonLd,
} from "@/components/shared/json-ld";
import { MCPCard } from "@/components/mcp/mcp-card";
import {
  McpWhatIs,
  McpHowToUse,
  McpToolsList,
} from "@/components/mcp/mcp-content-sections";
import { McpDetailSidebar } from "@/components/mcp/mcp-detail-sidebar";
import { McpFaq } from "@/components/mcp/mcp-faq";
import { McpReadme } from "@/components/mcp/mcp-readme";
import { SkillCard } from "@/components/skills/skill-card";
import { siteConfig } from "@/lib/constants";
import {
  getMcpServerBySlug,
  getMcpServers,
  getAllMcpSlugs,
  getSkills,
} from "@/lib/data";
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

  // B-tier pages have thin content — tell Google not to index them
  const isThinPage = server.qualityTier === "B" || server.qualityTier === "C";

  return {
    title,
    description,
    ...(isThinPage && {
      robots: { index: false, follow: true },
    }),
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

  // Parallel fetch: related servers + README + related skills
  const [allInCategory, readme, allSkills] = await Promise.all([
    server.category
      ? getMcpServers({ category: server.category, limit: 4 })
      : Promise.resolve([]),
    server.githubUrl ? fetchReadme(server.githubUrl) : Promise.resolve(null),
    server.category
      ? getSkills({ category: server.category, limit: 4 })
      : Promise.resolve([]),
  ]);
  const related = allInCategory.filter((s) => s.id !== server.id).slice(0, 3);
  const relatedSkills = allSkills.slice(0, 3);

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
          ...(server.tools && server.tools.length > 0
            ? [
                {
                  question: `${server.nameZh ?? server.name} 提供哪些工具？`,
                  answer: `提供 ${server.tools.length} 个工具，包括 ${server.tools
                    .slice(0, 5)
                    .map((t) => t.name)
                    .join("、")}${server.tools.length > 5 ? " 等" : ""}。`,
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
          {/* Editor one-liner comment */}
          {server.editorCommentZh && (
            <div className="mt-4 rounded-lg border-l-4 border-primary/50 bg-primary/5 px-4 py-3">
              <p className="text-sm italic text-foreground/80">
                {server.editorCommentZh}
              </p>
            </div>
          )}

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
            <McpWhatIs server={server} />
            <McpHowToUse server={server} />
            <McpToolsList server={server} />
            {readme && <McpReadme content={readme} />}
            <McpFaq server={server} />
          </div>

          {/* Right: sidebar */}
          <McpDetailSidebar server={server} />
        </div>
      </div>

      {/* Related Skills */}
      {relatedSkills.length > 0 && (
        <section className="border-t border-border/40">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <h2 className="mb-6 text-xl font-bold">相关 Skills</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {relatedSkills.map((s) => (
                <SkillCard key={s.id} skill={s} />
              ))}
            </div>
          </div>
        </section>
      )}
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
      {/* Comments (giscus) */}
      <section className="border-t border-border/40">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <GiscusComments />
        </div>
      </section>
    </>
  );
}
