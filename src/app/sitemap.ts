import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/constants";
import {
  getSitemapSkills,
  getSitemapArticles,
  getSitemapMcpServers,
  getSitemapWeeklies,
} from "@/lib/data";
import { LEARN_CONCEPTS } from "@/data/learn";
import { SERIES_META } from "@/data/series";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [skills, articles, mcpServers, weeklies] = await Promise.all([
    getSitemapSkills(),
    getSitemapArticles(),
    getSitemapMcpServers(),
    getSitemapWeeklies(),
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
      url: `${siteConfig.url}/learn`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...LEARN_CONCEPTS.map((c) => ({
      url: `${siteConfig.url}/learn/what-is-${c.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    {
      url: `${siteConfig.url}/guides`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...Object.entries(SERIES_META)
      .filter(([, meta]) => meta.isGuide)
      .map(([slug]) => ({
        url: `${siteConfig.url}/guides/${slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    {
      url: `${siteConfig.url}/github`,
      changeFrequency: "weekly",
      priority: 0.6,
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

  const weeklyPages: MetadataRoute.Sitemap = weeklies.map((w) => ({
    url: `${siteConfig.url}/weekly/${w.slug}`,
    lastModified: new Date(w.updatedAt),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [
    ...staticPages,
    ...enStaticPages,
    ...skillPages,
    ...mcpPages,
    ...articlePages,
    ...weeklyPages,
  ];
}
