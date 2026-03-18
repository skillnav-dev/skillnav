import { getMcpServerBySlug } from "@/lib/data";
import { generateOgImage, ogSize, ogContentType } from "@/lib/og-image";

export const runtime = "edge";
export const alt = "MCP Server 详情";
export const size = ogSize;
export const contentType = ogContentType;

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const server = await getMcpServerBySlug(slug);
  if (!server) {
    return generateOgImage({ title: "MCP Server Not Found", label: "MCP" });
  }

  return generateOgImage({
    title: server.nameZh ?? server.name,
    label: server.category ? `MCP · ${server.category}` : "MCP Server",
    description: server.descriptionZh ?? server.description,
  });
}
