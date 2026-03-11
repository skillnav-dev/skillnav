import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/constants";
import {
  getSitemapSkills,
  getSitemapArticles,
  getSitemapMcpServers,
} from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [skills, articles, mcpServers] = await Promise.all([
    getSitemapSkills(),
    getSitemapArticles(),
    getSitemapMcpServers(),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteConfig.url,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteConfig.url}/skills`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteConfig.url}/articles`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${siteConfig.url}/mcp`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteConfig.url}/weekly`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${siteConfig.url}/about`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // English static pages (tools only — no English articles)
  const enStaticPages: MetadataRoute.Sitemap = [
    {
      url: `${siteConfig.url}/en/skills`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${siteConfig.url}/en/mcp`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  const skillPages: MetadataRoute.Sitemap = skills.flatMap((s) => [
    {
      url: `${siteConfig.url}/skills/${s.slug}`,
      lastModified: new Date(s.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
    {
      url: `${siteConfig.url}/en/skills/${s.slug}`,
      lastModified: new Date(s.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    },
  ]);

  const mcpPages: MetadataRoute.Sitemap = mcpServers.flatMap((m) => [
    {
      url: `${siteConfig.url}/mcp/${m.slug}`,
      lastModified: new Date(m.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
    {
      url: `${siteConfig.url}/en/mcp/${m.slug}`,
      lastModified: new Date(m.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    },
  ]);

  const articlePages: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${siteConfig.url}/articles/${a.slug}`,
    lastModified: new Date(a.updatedAt),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [
    ...staticPages,
    ...enStaticPages,
    ...skillPages,
    ...mcpPages,
    ...articlePages,
  ];
}
