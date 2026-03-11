import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/constants";
import { getSitemapSkills, getSitemapArticles } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [skills, articles] = await Promise.all([
    getSitemapSkills(),
    getSitemapArticles(),
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

  const skillPages: MetadataRoute.Sitemap = skills.map((s) => ({
    url: `${siteConfig.url}/skills/${s.slug}`,
    lastModified: new Date(s.updatedAt),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const articlePages: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${siteConfig.url}/articles/${a.slug}`,
    lastModified: new Date(a.updatedAt),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticPages, ...skillPages, ...articlePages];
}
