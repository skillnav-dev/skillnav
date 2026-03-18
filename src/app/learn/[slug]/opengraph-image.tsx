import { LEARN_CONCEPTS } from "@/data/learn";
import { generateOgImage, ogSize, ogContentType } from "@/lib/og-image";

export const runtime = "edge";
export const alt = "学习中心";
export const size = ogSize;
export const contentType = ogContentType;

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // slug format: "what-is-{concept}"
  const concept = LEARN_CONCEPTS.find((c) => `what-is-${c.slug}` === slug);
  if (!concept) {
    return generateOgImage({ title: "概念详情", label: "学习中心" });
  }

  return generateOgImage({
    title: concept.seoTitle ?? `什么是${concept.term}`,
    label: "学习中心",
    description: concept.seoDescription,
  });
}
