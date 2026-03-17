import { siteConfig } from "@/lib/constants";
import { getSkills } from "@/lib/data";
import { getMcpServers } from "@/lib/data";
import { LEARN_CONCEPTS } from "@/data/learn";

export const dynamic = "force-static";
export const revalidate = 86400; // 24h

export async function GET() {
  const [skills, mcpServers] = await Promise.all([
    getSkills({ limit: 500, sort: "stars" }),
    getMcpServers({ limit: 500, sort: "stars" }),
  ]);

  const skillLines = skills.map(
    (s) =>
      `- [${s.name}](/skills/${s.slug}): ${s.description}${s.stars ? ` (${s.stars} stars)` : ""} — Category: ${s.category}, Platform: ${(s.platform ?? []).join(", ") || "claude"}`,
  );

  const mcpLines = mcpServers.map(
    (m) =>
      `- [${m.name}](/mcp/${m.slug}): ${m.description ?? ""}${m.stars ? ` (${m.stars} stars)` : ""} — Category: ${m.category ?? "general"}`,
  );

  const learnLines = LEARN_CONCEPTS.map(
    (c) => `- [${c.seoTitle}](/learn/what-is-${c.slug}): ${c.oneLiner}`,
  );

  const content = `# ${siteConfig.name} — Full Content Index

> Complete listing of all skills, MCP servers, and learning resources on skillnav.dev.
> For a summary, see /llms.txt

## Skills (${skills.length} curated)

${skillLines.join("\n")}

## MCP Servers (${mcpServers.length} published)

${mcpLines.join("\n")}

## Learning Center (${LEARN_CONCEPTS.length} concepts)

${learnLines.join("\n")}
`;

  return new Response(content, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
