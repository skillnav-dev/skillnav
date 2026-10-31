/**
 * Static curated content for the Grok Bot section (/grok-bot).
 * Product facts move fast — bump GROK_BOT_LAST_VERIFIED whenever facts are re-checked.
 */

export const GROK_BOT_LAST_VERIFIED = "2026-10-31";

export const GROK_BOT_LINKS = {
  home: "https://x.ai/bot",
  download: "https://x.ai/bot#download",
  guides: "https://x.ai/bot/guides",
  gettingStarted: "https://x.ai/bot/guides/getting-started",
} as const;

export interface GrokBotFact {
  label: string;
  value: string;
}

export const grokBotFacts: GrokBotFact[] = [
  { label: "厂商", value: "xAI（SpaceXAI），通过 Cursor 账号开通" },
  { label: "上线", value: "2026 年 8 月 11 日开放 Beta" },
  { label: "客户端", value: "macOS / Windows 桌面端 + iOS / Android" },
  {
    label: "套餐",
    value: "Cursor Ultra（$200/月）、Cursor Premium Teams、SuperGrok Heavy",
  },
  { label: "运行位置", value: "每个 bot 一台独立云电脑，本机关机也能跑" },
];

export type GrokBotCapabilityIcon =
  | "monitor"
  | "clock"
  | "users"
  | "plug"
  | "shield"
  | "hand";

export interface GrokBotCapability {
  icon: GrokBotCapabilityIcon;
  title: string;
  description: string;
}

export const grokBotCapabilities: GrokBotCapability[] = [
  {
    icon: "monitor",
    title: "自带一台云电脑",
    description:
      "每个 bot 有自己的桌面、文件系统、终端和应用，你能实时看它的屏幕，凡是人能在电脑上做的操作它都能做。",
  },
  {
    icon: "clock",
    title: "定时 & 事件触发",
    description:
      "Routine 可以按时间跑（如每天 7 点出简报），也可以由 Slack 消息、GitHub PR 等外部事件触发。",
  },
  {
    icon: "users",
    title: "多 bot 协作",
    description:
      "按职责建多个 bot，它们能互相发消息、转交任务，也能拉进同一个群聊协作。",
  },
  {
    icon: "plug",
    title: "MCP / 插件 / Skills",
    description:
      "支持与 Cursor 相同的 MCP Server、插件和 Skills，Gmail、Slack、Notion、GitHub 等服务可连多个账号。",
  },
  {
    icon: "shield",
    title: "自然语言权限规则",
    description:
      "在 Settings › General › Agent 用自然语言写允许 / 禁止规则，由独立的审查 Agent 执行把关。",
  },
  {
    icon: "hand",
    title: "随时人工接管",
    description:
      "遇到验证码、二次验证时 bot 会把桌面交还给你；密码、API Key 通过安全表单提交，不进聊天记录。",
  },
];

export interface GrokBotStep {
  title: string;
  description: string;
}

export const grokBotSteps: GrokBotStep[] = [
  {
    title: "下载客户端并登录 Cursor 账号",
    description:
      "从官网下载桌面端（macOS / Windows），用开通了对应套餐的 Cursor 账号登录。",
  },
  {
    title: "给 bot 定岗位",
    description:
      "在聊天或右上角 Settings 里设置名称、职位和描述。描述写得越具体，多 bot 之间转交任务越准。",
  },
  {
    title: "教它一遍工作流",
    description:
      "用文字精确描述，或者直接录一段屏幕演示，Grok Bot 会把它变成可复用的技能。",
  },
  {
    title: "接工具、设边界、配 Routine",
    description:
      "连上需要的 MCP / 插件，写好权限规则，再把任务挂到定时或事件触发上，让它自己跑。",
  },
];

export interface GrokBotScenario {
  title: string;
  trigger: string;
  description: string;
  tools: string[];
}

// Editor-written example bots, not official templates
export const grokBotScenarios: GrokBotScenario[] = [
  {
    title: "晨间简报 bot",
    trigger: "每天 07:00",
    description: "汇总邮件、日历和关注的信息源，生成当天待办和要点，发到 Slack。",
    tools: ["Gmail", "Google Calendar", "Slack"],
  },
  {
    title: "PR 巡检 bot",
    trigger: "GitHub 新 PR",
    description: "拉代码跑测试、对照团队规范做初审，把结论和风险点评论到 PR 里。",
    tools: ["GitHub", "终端"],
  },
  {
    title: "竞品监控 bot",
    trigger: "每周一",
    description: "用浏览器巡一遍竞品官网、定价页和更新日志，整理变化写进 Notion。",
    tools: ["浏览器", "Notion"],
  },
  {
    title: "客服分诊 bot",
    trigger: "Slack 新消息",
    description: "读懂用户问题，能答的直接答，需要研发的转给 PR 巡检 bot 或人工。",
    tools: ["Slack", "Google Drive"],
  },
];

export interface GrokBotCompareRow {
  name: string;
  what: string;
  runsOn: string;
  bestFor: string;
  href?: string;
}

// Positioning against what SkillNav already covers
export const grokBotCompare: GrokBotCompareRow[] = [
  {
    name: "Skill",
    what: "给 Agent 的能力说明书（SKILL.md）",
    runsOn: "依附在 Claude Code 等 Agent 内",
    bestFor: "沉淀可复用的做事方法",
    href: "/skills",
  },
  {
    name: "MCP Server",
    what: "让 Agent 调用外部工具的协议接口",
    runsOn: "被任意支持 MCP 的客户端调用",
    bestFor: "把数据源 / API 接给 AI",
    href: "/mcp",
  },
  {
    name: "Claude Code 等编码 Agent",
    what: "面向代码仓库的 Agent",
    runsOn: "终端 / IDE / 云端会话",
    bestFor: "写代码、改代码、跑测试",
  },
  {
    name: "Grok Bot",
    what: "带一台云电脑的通用工作 Agent",
    runsOn: "xAI 云端，桌面 / 手机客户端操控",
    bestFor: "跨应用、长期、定时自动跑的日常工作",
  },
];

export interface GrokBotResource {
  title: string;
  description: string;
  href: string;
  source: "官方" | "社区";
}

export const grokBotResources: GrokBotResource[] = [
  {
    title: "Grok Bot 101",
    description: "官方入门：bot 是什么、Routine、多 bot、连接器和权限规则。",
    href: "https://x.ai/bot/guides/grok-bot-101",
    source: "官方",
  },
  {
    title: "Getting started",
    description: "官方上手指南，从下载到跑通第一个 bot。",
    href: GROK_BOT_LINKS.gettingStarted,
    source: "官方",
  },
  {
    title: "Grok Bot Guides",
    description: "官方指南合集，持续更新。",
    href: GROK_BOT_LINKS.guides,
    source: "官方",
  },
  {
    title: "learn-grok-bot",
    description:
      "16 课拆解桌面 Agent 架构：进程隔离、Turn Loop、推理路由、沙箱、MCP（非官方）。",
    href: "https://github.com/yuanyijie/learn-grok-bot",
    source: "社区",
  },
  {
    title: "How to Set Up Grok Bot",
    description: "MindStudio 的英文实操教程：建第一批 bot、配 Routine。",
    href: "https://www.mindstudio.ai/blog/grok-bot-setup-guide",
    source: "社区",
  },
];

export interface GrokBotFaq {
  question: string;
  answer: string;
}

export const grokBotFaqs: GrokBotFaq[] = [
  {
    question: "Grok Bot 是什么？",
    answer:
      "Grok Bot 是 xAI 推出的通用工作 Agent。每个 bot 拥有一台独立云电脑（桌面、文件系统、终端），可以按定时或事件自动执行任务，也能多个 bot 分工协作。",
  },
  {
    question: "Grok Bot 怎么收费？",
    answer:
      "目前没有单独售卖，需要通过 Cursor 账号开通，包含在 Cursor Ultra（$200/月）、Cursor Premium Teams 和 SuperGrok Heavy 等套餐里。价格变动较快，请以官网为准。",
  },
  {
    question: "Grok Bot 和 MCP、Skills 是什么关系？",
    answer:
      "MCP 和 Skills 是给 Agent 加能力的「零件」，Grok Bot 是能装这些零件的「整机」：它支持与 Cursor 相同的 MCP Server、插件和 Skills。",
  },
  {
    question: "Grok Bot 和 Claude Code 有什么区别？",
    answer:
      "Claude Code 主要面向代码仓库；Grok Bot 面向跨应用的日常工作，自带云电脑和定时触发，更像一个能长期在线的数字同事。",
  },
  {
    question: "支持哪些平台？",
    answer:
      "桌面端支持 macOS（Apple 芯片 / Intel）和 Windows（x64 / Arm64），另有 iOS 和 Android 客户端，暂无 Linux 桌面版。",
  },
];
