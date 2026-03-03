/**
 * Shared skill categorization module.
 * Weighted keyword scoring across tags, name, and description.
 *
 * Categories: 16 (expanded from original 9)
 * Keywords: ~400+ (expanded from original 23)
 */

// Weights for each text source
const WEIGHTS = { tags: 3, name: 2, description: 1 };

// Minimum score required to assign a category (otherwise "其他")
const MIN_SCORE = 2;

/**
 * Category keyword mapping.
 * Order matters for tie-breaking: earlier categories win on equal score.
 */
export const CATEGORY_KEYWORDS = {
  // --- 开发 (Development & Programming) ---
  "开发": [
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

  // --- AI (AI & Machine Learning) ---
  "AI": [
    "ai", "llm", "gpt", "claude", "openai", "anthropic",
    "gemini", "mistral", "llama", "ollama", "huggingface",
    "model", "inference", "embedding", "vector", "rag",
    "prompt", "agent", "copilot",
    "nlp", "ml", "machine-learning", "deep-learning",
    "neural", "transformer", "fine-tune", "finetune",
    "chatgpt", "langchain", "llamaindex", "semantic",
    "perplexity", "groq", "replicate", "cohere",
  ],

  // --- 数据 (Data & Analytics) ---
  "数据": [
    "data", "dataset", "database", "sql", "postgres", "postgresql",
    "mysql", "sqlite", "mongodb", "redis", "supabase", "firebase",
    "analytics", "analysis", "visualization", "chart", "graph",
    "dashboard", "report", "csv", "excel", "spreadsheet", "parquet",
    "etl", "pipeline", "bigquery", "warehouse", "tableau",
    "statistics", "metric", "prisma", "drizzle", "typeorm",
    "analyzer", "analyse", "analyze",
  ],

  // --- 安全 (Security & Privacy) ---
  "安全": [
    "security", "secure", "encrypt", "encryption", "decrypt",
    "password", "credential", "vault", "secret",
    "audit", "scan", "scanner", "vulnerability", "malware",
    "firewall", "permission", "access-control", "rbac",
    "privacy", "anonymize", "sanitize", "verification",
    "certificate", "ssl", "tls", "2fa", "mfa", "otp",
    "pentest", "exploit", "threat", "vpn", "guard",
  ],

  // --- 搜索 (Search & Browsing) ---
  "搜索": [
    "search", "browse", "browsing", "browser", "crawler", "scrape", "scraping",
    "spider", "web-search", "google", "bing", "duckduckgo", "serp",
    "fetch", "indexing", "lookup", "finder", "discovery",
    "sitemap", "seo", "ranking", "tavily", "exa",
    "research", "researcher", "investigate",
  ],

  // --- 写作 (Writing & Content) ---
  "写作": [
    "write", "writer", "writing", "blog", "blogger", "article",
    "content", "copywriting", "copy", "editor", "editing",
    "markdown", "mdx", "readme", "documentation", "docs",
    "grammar", "spellcheck", "proofread", "rewrite", "summarize",
    "summary", "abstract", "essay", "story", "narrative",
    "translate", "translation", "translator", "localize",
    "i18n", "l10n", "paragraph", "journal",
    "publish", "publisher", "publishing", "news", "digest",
    "book", "ebook", "newsletter", "report-writer",
  ],

  // --- DevOps (DevOps & Cloud) ---
  "DevOps": [
    "docker", "container", "kubernetes", "k8s", "helm",
    "deploy", "deployment", "cicd", "ci-cd",
    "jenkins", "circleci", "terraform", "ansible",
    "cloudflare", "aws", "azure", "gcp", "vercel", "netlify",
    "heroku", "railway", "digitalocean",
    "nginx", "caddy", "load-balancer", "cdn",
    "devops", "infra", "infrastructure", "cloud",
    "serverless", "lambda", "worker", "edge",
    "sentry", "datadog", "newrelic", "grafana", "prometheus",
    "ssh", "ops", "operations",
  ],

  // --- 效率 (Productivity & Tools) ---
  "效率": [
    "productivity", "file", "files", "pdf", "word",
    "notion", "obsidian", "todoist", "trello", "jira", "asana",
    "calendar", "schedule", "reminder", "bookmark", "clipboard",
    "note", "notes", "notepad", "organizer", "planner", "task",
    "kanban", "project-management", "timer", "pomodoro",
    "convert", "converter", "compress", "zip", "archive",
    "rename", "batch", "utility", "tool", "toolkit",
    "manager", "management", "tracker", "tracking",
    "optimizer", "optimize", "cleanup", "sorter",
  ],

  // --- 自动化 (Automation & Workflow) ---
  "自动化": [
    "automation", "automate", "automated", "workflow", "flow",
    "orchestrate", "orchestration", "scheduler",
    "cron", "trigger", "event", "hook", "listener",
    "scraper", "bot", "robot", "rpa",
    "macro", "script", "cli", "command", "shell", "bash",
    "pipe", "chain", "sequence", "queue", "job",
  ],

  // --- 集成 (Integration & API) ---
  "集成": [
    "api", "rest", "graphql", "webhook", "integration", "connect",
    "connector", "oauth", "zapier", "ifttt",
    "n8n", "make", "middleware", "bridge", "gateway", "proxy",
    "sdk", "client", "wrapper", "adapter", "plugin", "extension",
    "mcp", "server", "sync", "import", "export",
  ],

  // --- 创意 (Creative & Design) ---
  "创意": [
    "image", "photo", "video", "audio", "music", "sound",
    "design", "creative", "art", "draw", "drawing", "paint",
    "illustration", "icon", "logo", "banner", "thumbnail",
    "figma", "canva", "photoshop", "midjourney", "dalle",
    "stable-diffusion", "diffusion", "tts",
    "speech", "voice", "podcast", "animation", "3d", "render",
    "color", "palette", "font", "typography", "ui", "ux",
    "youtube", "tiktok", "bilibili", "instagram", "svg",
    "media", "camera", "screenshot", "wallpaper",
  ],

  // --- 通讯 (Communication & Messaging) ---
  "通讯": [
    "email", "mail", "gmail", "outlook", "smtp", "imap",
    "message", "messaging", "chat", "chatbot",
    "slack", "discord", "telegram", "whatsapp", "wechat",
    "teams", "signal", "notification", "notify", "push",
    "sms", "twilio", "sendgrid", "resend", "mailgun",
    "comment", "reply", "thread", "conversation", "inbox",
    "feishu", "lark", "dingtalk", "social", "twitter",
  ],

  // --- 金融 (Finance & Crypto) ---
  "金融": [
    "crypto", "bitcoin", "btc", "ethereum", "eth", "solana", "sol",
    "defi", "nft", "token", "wallet", "blockchain", "web3",
    "trading", "trade", "trader", "exchange", "swap", "dex",
    "finance", "financial", "fintech", "payment", "invoice",
    "accounting", "budget", "expense", "stock", "market",
    "portfolio", "invest", "investment", "bank", "stripe",
    "paypal", "ledger", "binance", "coinbase", "uniswap",
    "revenue", "pricing", "cost", "shopify", "ecommerce",
  ],

  // --- 教育 (Education & Learning) ---
  "教育": [
    "learn", "learning", "education", "teach", "teaching",
    "tutorial", "course", "lesson", "quiz", "flashcard",
    "study", "student", "school", "university", "academic",
    "exam", "homework", "textbook", "lecture",
    "mentor", "tutor", "training", "certification",
  ],

  // --- 基础 (Core & Infrastructure) ---
  "基础": [
    "memory", "context", "session", "state", "cache",
    "config", "configuration", "settings", "env", "environment",
    "logging", "log", "logger", "monitor", "health", "ping",
    "router", "routing", "daemon",
    "init", "setup", "bootstrap", "core", "base", "foundation",
    "framework", "system", "runtime", "process",
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
