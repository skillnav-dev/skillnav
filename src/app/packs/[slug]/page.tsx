import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { BreadcrumbJsonLd } from "@/components/shared/json-ld";
import { SkillCard } from "@/components/skills/skill-card";
import { MCPCard } from "@/components/mcp/mcp-card";
import { PackInstallPanel } from "@/components/packs/pack-install-panel";
import { PackSteps } from "@/components/packs/pack-steps";
import { PACKS, getPack } from "@/data/packs";
import { resolvePublishedTools } from "@/lib/data/collections";
import { buildPackInstall } from "@/lib/pack-install";
import { siteConfig } from "@/lib/constants";

export const revalidate = 3600;
export const dynamicParams = false;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return PACKS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const pack = getPack((await params).slug);
  if (!pack) return {};
  const url = `${siteConfig.url}/packs/${pack.slug}`;
  return {
    title: pack.title,
    description: pack.summary,
    alternates: { canonical: url },
    openGraph: {
      title: `${pack.title} | SkillNav`,
      description: pack.summary,
      url,
    },
  };
}

export default async function PackDetailPage({ params }: PageProps) {
  const pack = getPack((await params).slug);
  if (!pack) notFound();

  const tools = await resolvePublishedTools(pack.items);
  const install = buildPackInstall(tools);

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "首页", href: "/" },
          { name: "装机包", href: "/packs" },
          { name: pack.title, href: `/packs/${pack.slug}` },
        ]}
      />
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <PageBreadcrumb
          items={[
            { label: "首页", href: "/" },
            { label: "装机包", href: "/packs" },
            { label: pack.title },
          ]}
        />
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {pack.title}
        </h1>
        <p className="mt-3 text-base text-foreground/85">{pack.summary}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          适合：{pack.audience}
        </p>

        <div className="mt-8 space-y-6">
          <section>
            <h2 className="mb-4 text-lg font-semibold">
              包含 {tools.length} 个工具
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((t) =>
                t.type === "skill" ? (
                  <SkillCard key={`s-${t.slug}`} skill={t.item} />
                ) : (
                  <MCPCard key={`m-${t.slug}`} server={t.item} />
                ),
              )}
            </div>
          </section>
          {tools.length > 0 && (
            <PackInstallPanel slug={pack.slug} install={install} />
          )}
          <PackSteps steps={pack.steps} />
        </div>
      </div>
    </>
  );
}
