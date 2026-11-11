import type { Metadata } from "next";
import { SectionHeader } from "@/components/shared/section-header";
import { BreadcrumbJsonLd } from "@/components/shared/json-ld";
import { PackCard } from "@/components/packs/pack-card";
import { PACKS } from "@/data/packs";
import { siteConfig } from "@/lib/constants";

export const metadata: Metadata = {
  title: "装机包",
  description:
    "按场景打包的 Skills + MCP 组合：前端、全栈 SaaS、数据分析、运维、内容创作、论文研究，一次复制全部配置，附中文上手教程。",
  alternates: { canonical: `${siteConfig.url}/packs` },
  openGraph: {
    title: "装机包 | SkillNav",
    description: "按场景打包的 Skills + MCP 组合，一次复制全部配置。",
    url: `${siteConfig.url}/packs`,
  },
};

export default function PacksPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "首页", href: "/" },
          { name: "装机包", href: "/packs" },
        ]}
      />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <SectionHeader
          as="h1"
          title="装机包"
          description="按场景挑好的 Skills + MCP 组合。一次复制全部配置，再照着教程跑通第一个任务。"
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PACKS.map((pack) => (
            <PackCard key={pack.slug} pack={pack} />
          ))}
        </div>
      </div>
    </>
  );
}
