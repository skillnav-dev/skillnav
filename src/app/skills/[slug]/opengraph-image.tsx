import { getSkillBySlug } from "@/lib/data";
import { generateOgImage, ogSize, ogContentType } from "@/lib/og-image";

export const runtime = "edge";
export const alt = "Skill 详情";
export const size = ogSize;
export const contentType = ogContentType;

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const skill = await getSkillBySlug(slug);
  if (!skill) {
    return generateOgImage({ title: "Skill Not Found", label: "Skill" });
  }

  return generateOgImage({
    title: skill.nameZh ?? skill.name,
    label: skill.category ? `Skill · ${skill.category}` : "Skill",
    description: skill.descriptionZh ?? skill.description,
  });
}
