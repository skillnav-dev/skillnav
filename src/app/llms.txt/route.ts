import { siteConfig } from "@/lib/constants";
import { getSkillsCount } from "@/lib/data";

export const dynamic = "force-static";
export const revalidate = 86400; // 24h

export async function GET() {
  const skillsCount = await getSkillsCount();

  const content = `# ${siteConfig.name}

> Curated AI Agent tools directory for developers — Skills, MCP Servers, and tech news compiled in Chinese.

## About

SkillNav (skillnav.dev) is an editorially curated directory of AI agent tools, focused on Claude Code Skills, MCP Servers, and open-source AI projects. All editorial content is in Chinese, targeting Chinese-speaking developers. Tool data (Skills, MCP) is available in both English and Chinese.

## Sections

- [Skills](/skills): ${skillsCount} curated AI agent skills for Claude Code, Codex, and more
- [Skills (English)](/en/skills): English version of the skills directory
- [MCP Servers](/mcp): Hand-picked MCP (Model Context Protocol) servers
- [MCP Servers (English)](/en/mcp): English version of the MCP directory
- [Articles](/articles): AI agent news and analysis, compiled in Chinese
- [GitHub Projects](/github): 50 curated open-source AI projects
- [Weekly Digest](/weekly): Weekly roundup of AI agent ecosystem

## Key Topics

- Claude Code Skills (SKILL.md, custom slash commands)
- MCP Servers (Model Context Protocol, tool integration)
- AI Agent frameworks (LangChain, CrewAI, AutoGen, etc.)
- AI coding tools (Claude Code, Cursor, GitHub Copilot, Codex)
- Context engineering and prompt engineering

## Data

- Skills include: name, description, author, category, platform, install command, GitHub URL, stars
- MCP Servers include: name, description, author, category, install command, GitHub URL
- Articles include: title, summary, source URL, article type (tutorial/analysis/guide)

## Formats

- Skill detail: /skills/{slug}
- Skill detail (English): /en/skills/{slug}
- Article detail: /articles/{slug}
- MCP directory: /mcp
- Sitemap: /sitemap.xml

## Contact

- GitHub: ${siteConfig.links.github}
- Twitter: ${siteConfig.links.twitter}
`;

  return new Response(content, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
