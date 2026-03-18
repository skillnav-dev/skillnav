import { getArticleBySlug } from "@/lib/data";
import { generateOgImage, ogSize, ogContentType } from "@/lib/og-image";

export const runtime = "edge";
export const alt = "文章详情";
export const size = ogSize;
export const contentType = ogContentType;

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) {
    return generateOgImage({ title: "Article Not Found", label: "资讯" });
  }

  return generateOgImage({
    title: article.titleZh ?? article.title,
    label: "资讯",
    description: article.summaryZh ?? article.summary,
  });
}
