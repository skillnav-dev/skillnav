import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/constants";
import { mockArticles } from "@/data/mock-articles";

export default function sitemap(): MetadataRoute.Sitemap {
  const articles = mockArticles.map((article) => ({
    url: `${siteConfig.url}/articles/${article.slug}`,
    lastModified: new Date(article.publishedAt),
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
      url: `${siteConfig.url}/articles`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    ...articles,
  ];
}
