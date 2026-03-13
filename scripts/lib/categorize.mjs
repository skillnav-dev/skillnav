/**
 * Shared skill categorization module.
 * Weighted keyword scoring across tags, name, and description.
 *
 * Categories: 10 scenario-based + 行业场景 vertical
 *   编码与调试 | AI 与智能体 | 数据与存储 | 搜索与获取 | DevOps
 *   内容与创意 | 效率与工作流 | 安全与合规 | 平台与服务 | 行业场景
 *   + 兜底 "其他"
 */

// Weights for each text source
const WEIGHTS = { tags: 3, name: 2, description: 1 };

// Minimum score required to assign a category (otherwise "其他")
const MIN_SCORE = 2;

/**
 * Category keyword mapping — 10 scenario-based categories + 行业场景.
 * Order matters for tie-breaking: earlier categories win on equal score.
 */
export const CATEGORY_KEYWORDS = {
  // --- 编码与调试 (Coding & Debugging) ---
  "编码与调试": [
    "code", "coding", "development", "developer", "programming",
    "debug", "debugger", "debugging", "test", "testing", "unittest",
    "lint", "linter", "format", "formatter", "refactor", "compile",
    "compiler", "build", "typescript", "javascript", "python", "rust",
    "golang", "java", "swift", "ruby", "php", "react", "vue", "angular",
    "nextjs", "node", "npm", "vscode", "ide", "git", "github",
    "gitlab", "bitbucket", "pull-request", "merge", "diff",
    "snippet", "boilerplate", "scaffold", "regex",
    "json", "yaml", "xml", "html", "css", "sass",
    "validate", "validator", "checker", "engineering", "engineer",
    "prototype", "sdk-builder", "sourcemap",
  ],

  // --- AI 与智能体 (AI & Agents) ---
  "AI 与智能体": [
    "ai", "llm", "gpt", "claude", "openai", "anthropic",
    "gemini", "mistral", "llama", "ollama", "huggingface",
    "model", "inference", "embedding", "vector", "rag",
    "prompt", "agent", "copilot", "assistant",
    "nlp", "ml", "machine-learning", "deep-learning",
    "neural", "transformer", "fine-tune", "finetune",
    "chatgpt", "langchain", "llamaindex", "semantic",
    "perplexity", "groq", "replicate", "cohere",
    "chatbot", "conversational", "agentic",
  ],

  // --- 数据与存储 (Data & Storage) ---
  "数据与存储": [
    "data", "dataset", "database", "sql", "postgres", "postgresql",
    "mysql", "sqlite", "mongodb", "redis", "supabase", "firebase",
    "analytics", "analysis", "visualization", "chart", "graph",
    "dashboard", "report", "csv", "excel", "spreadsheet", "parquet",
    "etl", "pipeline", "bigquery", "warehouse", "tableau",
    "statistics", "metric", "prisma", "drizzle", "typeorm",
    "analyzer", "analyse", "analyze",
    // Filesystem & storage
    "filesystem", "file-system", "storage", "s3", "blob",
    "backup", "migrate", "migration", "orm",
  ],

  // --- 搜索与获取 (Search & Fetch) ---
  "搜索与获取": [
    "search", "browse", "browsing", "browser", "crawler", "scrape", "scraping",
    "spider", "web-search", "google", "bing", "duckduckgo", "serp",
    "fetch", "indexing", "lookup", "finder", "discovery",
    "sitemap", "seo", "ranking", "tavily", "exa",
    "research", "researcher", "investigate",
    // RSS & API aggregation
    "rss", "feed", "aggregate", "aggregation", "api-fetch", "scraper",
  ],

  // --- DevOps ---
  "DevOps": [
    "docker", "container", "kubernetes", "k8s", "helm",
    "deploy", "deployment", "cicd", "ci-cd",
    "jenkins", "circleci", "terraform", "ansible",
    "cloudflare", "aws", "azure", "gcp", "vercel", "netlify",
    "heroku", "railway", "digitalocean",
    "nginx", "caddy", "load-balancer", "cdn",
    "devops", "infra", "infrastructure", "cloud",
    "serverless", "lambda", "worker", "edge",
    "ssh", "ops", "operations",
    // Absorbed from 基础
    "config", "configuration", "settings", "env", "environment",
    "init", "setup", "bootstrap", "daemon",
    "router", "routing", "runtime", "process",
  ],

  // --- 内容与创意 (Content & Creative) ---
  "内容与创意": [
    // Writing
    "write", "writer", "writing", "blog", "blogger", "article",
    "content", "copywriting", "copy", "editor", "editing",
    "markdown", "mdx", "readme", "documentation", "docs",
    "grammar", "spellcheck", "proofread", "rewrite", "summarize",
    "summary", "abstract", "essay", "story", "narrative",
    "translate", "translation", "translator", "localize",
    "i18n", "l10n", "paragraph", "journal",
    "publish", "publisher", "publishing", "news", "digest",
    "book", "ebook", "newsletter", "report-writer",
    // Creative & design
    "image", "photo", "video", "audio", "music", "sound",
    "design", "creative", "art", "draw", "drawing", "paint",
    "illustration", "icon", "logo", "banner", "thumbnail",
    "figma", "canva", "photoshop", "midjourney", "dalle",
    "stable-diffusion", "diffusion", "tts",
    "speech", "voice", "podcast", "animation", "3d", "render",
    "color", "palette", "font", "typography",
    "youtube", "tiktok", "bilibili", "instagram", "svg",
    "media", "camera", "screenshot", "wallpaper",
  ],

  // --- 效率与工作流 (Productivity & Workflow) ---
  "效率与工作流": [
    // Productivity
    "productivity", "file", "files", "pdf", "word",
    "notion", "obsidian", "todoist", "trello", "jira", "asana",
    "calendar", "schedule", "reminder", "bookmark", "clipboard",
    "note", "notes", "notepad", "organizer", "planner", "task",
    "kanban", "project-management", "timer", "pomodoro",
    "convert", "converter", "compress", "zip", "archive",
    "rename", "batch", "utility", "tool", "toolkit",
    "manager", "management", "tracker", "tracking",
    "optimizer", "optimize", "cleanup", "sorter",
    // Automation
    "automation", "automate", "automated", "workflow", "flow",
    "orchestrate", "orchestration", "scheduler",
    "cron", "trigger", "event", "hook", "listener",
    "bot", "robot", "rpa",
    "macro", "script", "cli", "command", "shell", "bash",
    "pipe", "chain", "sequence", "queue", "job",
  ],

  // --- 安全与合规 (Security & Compliance) ---
  "安全与合规": [
    "security", "secure", "encrypt", "encryption", "decrypt",
    "password", "credential", "vault", "secret",
    "audit", "scan", "scanner", "vulnerability", "malware",
    "firewall", "permission", "access-control", "rbac",
    "privacy", "anonymize", "sanitize", "verification",
    "certificate", "ssl", "tls", "2fa", "mfa", "otp",
    "pentest", "exploit", "threat", "vpn", "guard",
    // Monitoring (absorbed from 基础)
    "logging", "log", "logger", "monitor", "monitoring",
    "health", "ping", "sentry", "datadog", "newrelic",
    "grafana", "prometheus", "alert", "alerting",
  ],

  // --- 平台与服务 (Platforms & Services) ---
  "平台与服务": [
    // API & integration
    "api", "rest", "graphql", "webhook", "integration", "connect",
    "connector", "oauth", "zapier", "ifttt",
    "n8n", "make", "middleware", "bridge", "gateway", "proxy",
    "sdk", "client", "wrapper", "adapter", "plugin", "extension",
    "mcp", "server", "sync", "import", "export",
    // Communication & messaging
    "email", "mail", "gmail", "outlook", "smtp", "imap",
    "message", "messaging", "chat",
    "slack", "discord", "telegram", "whatsapp", "wechat",
    "teams", "signal", "notification", "notify", "push",
    "sms", "twilio", "sendgrid", "resend", "mailgun",
    "comment", "reply", "thread", "conversation", "inbox",
    "feishu", "lark", "dingtalk", "social", "twitter",
    // Payment/ecommerce platform integrations
    "stripe", "paypal", "shopify", "ecommerce",
  ],

  // --- 行业场景 (Vertical / Industry) ---
  "行业场景": [
    // Finance
    "finance", "fintech", "trading", "stock", "crypto", "blockchain",
    "payment", "accounting", "invoice",
    // Education
    "education", "learning", "tutorial", "course", "quiz", "exam",
    "student", "teacher",
    // Legal
    "legal", "law", "contract", "compliance", "regulation",
    // Medical / Healthcare
    "medical", "health", "healthcare", "clinical", "patient", "diagnosis",
    // Gaming
    "game", "gaming", "unity", "unreal", "godot", "3d-modeling",
    // Resume / HR
    "resume", "cv", "hiring", "interview", "recruitment", "job",
    // Real estate
    "real-estate", "property", "mortgage",
  ],
};

/**
 * All category names in display order.
 */
export const ALL_CATEGORIES = [...Object.keys(CATEGORY_KEYWORDS), "其他"];

/**
 * Tokenize a text string into lowercase words.
 * Splits on whitespace and punctuation. For hyphenated words like
 * "weather-api", produces both the full form and individual parts:
 * ["weather-api", "weather", "api"].
 */
function tokenize(text) {
  if (!text) return [];
  const raw = text
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff-]+/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 0);

  const tokens = [];
  for (const t of raw) {
    tokens.push(t);
    // Split hyphenated words into sub-tokens
    if (t.includes("-")) {
      for (const part of t.split("-")) {
        if (part.length > 0) tokens.push(part);
      }
    }
  }
  return tokens;
}

/**
 * Categorize a skill based on its name, tags, and description.
 * Uses weighted keyword scoring across all three text sources.
 *
 * @param {string} name - Skill name
 * @param {string[]} tags - Skill tags
 * @param {string} [description] - Skill description
 * @returns {string} Category name in Chinese
 */
export function categorize(name, tags, description) {
  const nameTokens = tokenize(name);
  const tagTokens = (tags || []).map((t) => t.toLowerCase());
  const descTokens = tokenize(description);
  const nameLower = (name || "").toLowerCase();
  const descLower = (description || "").toLowerCase();

  const scores = {};

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;

    for (const kw of keywords) {
      // Tags: full word match, weight 3
      if (tagTokens.includes(kw)) {
        score += WEIGHTS.tags;
      }

      // Name: full token match (weight 2) or substring match (weight 1)
      if (nameTokens.includes(kw)) {
        score += WEIGHTS.name;
      } else if (kw.length >= 3 && nameLower.includes(kw)) {
        score += WEIGHTS.name * 0.5;
      }

      // Description: full token match (weight 1) or substring match (weight 0.5)
      if (descTokens.includes(kw)) {
        score += WEIGHTS.description;
      } else if (kw.length >= 4 && descLower.includes(kw)) {
        score += WEIGHTS.description * 0.5;
      }
    }

    if (score > 0) scores[category] = score;
  }

  // Pick the highest-scoring category
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  if (sorted.length === 0 || sorted[0][1] < MIN_SCORE) {
    return "其他";
  }

  return sorted[0][0];
}
