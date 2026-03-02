import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/constants";
import { getAllArticleSlugs, getAllSkillSlugs } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articleSlugs, skillSlugs] = await Promise.all([
    getAllArticleSlugs(),
    getAllSkillSlugs(),
  ]);

  const articles = articleSlugs.map((slug) => ({
    url: `${siteConfig.url}/articles/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const skills = skillSlugs.map((slug) => ({
    url: `${siteConfig.url}/skills/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [
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
    ...skills,
    ...articles,
  ];
}
