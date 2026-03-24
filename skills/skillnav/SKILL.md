---
name: skillnav
description: "Search 3,900+ MCP servers with install commands, get daily AI brief, and discover trending tools — in Chinese. Data from skillnav.dev editorial team."
argument-hint: "brief | mcp <keyword> | trending"
allowed-tools: WebFetch
---

Route based on $ARGUMENTS[0]:

| Command   | Action                                                       |
|-----------|--------------------------------------------------------------|
| brief     | WebFetch https://skillnav.dev/api/skill/query?type=brief     |
| mcp       | WebFetch https://skillnav.dev/api/skill/query?type=mcp&q=$ARGUMENTS[1] |
| trending  | WebFetch https://skillnav.dev/api/skill/query?type=trending  |
| (other)   | Show usage message — do NOT fetch any URL                    |

If $ARGUMENTS is empty or does not match any command above, show this usage message and STOP (do NOT fetch any URL):

```
SkillNav — AI 开发者工具站 (skillnav.dev)

Usage:
  /skillnav brief            今日 AI 日报
  /skillnav mcp <keyword>    搜索 MCP Server（如 database, github, slack）
  /skillnav trending         本周热门工具

Install:
  mkdir -p ~/.claude/skills/skillnav && curl -sL https://raw.githubusercontent.com/skillnav-dev/skillnav-skill/main/SKILL.md -o ~/.claude/skills/skillnav/SKILL.md
```

---

## Format Rules

### brief

Format the JSON response as:

1. **TL;DR**: One bold sentence summarizing the headline
2. Headline title with `> why_important` in blockquote
3. Bulleted highlights, each with editor comment in parentheses
4. If `is_fallback` is true, note the actual date: "(注意：这是 {date} 的日报，今日暂无更新)"
5. Footer: "完整日报 → {url}"

### mcp

Format each result as a numbered list with one blank line between items:

1. **{name}** `{category}` ⭐ {stars}
   {description_zh}
   > {editor_comment_zh}
   ```
   {install_command}
   ```

If `editor_comment_zh` is null, skip the blockquote line.
If results are empty: "未找到匹配的 MCP Server，试试更宽泛的关键词。"
Footer: "共 {returned} 个结果{has_more ? '（更多结果请访问 skillnav.dev）' : ''}"

### trending

Format as a ranked list grouped by tool_type:

**MCP Server**
1. **{name}** ⭐ {stars} (+{weekly_stars_delta} this week)
   > {editor_comment_zh}

**Skill**
1. **{name}** ⭐ {stars} (+{weekly_stars_delta} this week)
   > {editor_comment_zh}

If a group has no items, omit it entirely.

---

## Error Handling

- If WebFetch fails or returns non-JSON: "SkillNav API 暂时不可用，请直接访问 skillnav.dev"
- If API returns `{ "error": ... }`: Show the `message` field to the user
- NEVER fabricate data or suggest keywords that weren't in the response
