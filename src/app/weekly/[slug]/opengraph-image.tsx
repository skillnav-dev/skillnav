import { getWeeklyBySlug } from "@/lib/data";
import { generateOgImage, ogSize, ogContentType } from "@/lib/og-image";

export const runtime = "edge";
export const alt = "周刊详情";
export const size = ogSize;
export const contentType = ogContentType;

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const issue = await getWeeklyBySlug(slug);
  if (!issue) {
    return generateOgImage({ title: "周刊 Not Found", label: "周刊" });
  }

  return generateOgImage({
    title: issue.titleZh ?? issue.title,
    label: "周刊",
    description: issue.summaryZh ?? issue.summary,
  });
}
