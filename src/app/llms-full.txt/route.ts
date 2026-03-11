import { siteConfig } from "@/lib/constants";
import { getSkills } from "@/lib/data";
import { mcpServers } from "@/data/mcp-servers";

export const dynamic = "force-static";
export const revalidate = 86400; // 24h

export async function GET() {
  const skills = await getSkills({ limit: 500, sort: "stars" });

  const skillLines = skills.map(
    (s) =>
      `- [${s.name}](/skills/${s.slug}): ${s.description}${s.stars ? ` (${s.stars} stars)` : ""} — Category: ${s.category}, Platform: ${(s.platform ?? []).join(", ") || "claude"}`,
  );

  const mcpLines = mcpServers.map(
    (m) => `- [${m.name}](/mcp#${m.slug}): ${m.description} — by ${m.author}`,
  );

  const content = `# ${siteConfig.name} — Full Content Index

> Complete listing of all skills and MCP servers on skillnav.dev.
> For a summary, see /llms.txt

## Skills (${skills.length} curated)

${skillLines.join("\n")}

## MCP Servers (${mcpServers.length} curated)

${mcpLines.join("\n")}
`;

  return new Response(content, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
