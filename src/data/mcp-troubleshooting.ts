/**
 * Shared MCP install troubleshooting Q&A for Chinese developers
 * (registry mirrors, proxies, Node version, Windows quirks).
 * Shown in the FAQ on every MCP detail page and mirrored into FAQ JSON-LD.
 */

import type { ServerSpec } from "@/lib/install-spec";

export interface TroubleshootingItem {
  id: string;
  question: string;
  answer: string;
  /** Copy-ready commands or config, one block per entry. */
  code?: { label: string; lang: string; code: string }[];
}

const NPM_RUNNERS = new Set(["npx", "bunx", "pnpm", "node"]);
const PY_RUNNERS = new Set(["uvx", "uv", "python", "python3", "pip"]);

export const NPM_MIRROR = "https://registry.npmmirror.com";
export const PYPI_MIRROR = "https://mirrors.aliyun.com/pypi/simple/";

function packageFromArgs(args: string[]): string | undefined {
  return args.find((a) => !a.startsWith("-") && a !== "dlx" && a !== "exec");
}

const npmMirror = (pkg: string): TroubleshootingItem => ({
  id: "npm-mirror",
  question: "npx 拉包很慢、超时或报 ETIMEDOUT 怎么办？",
  answer:
    "国内直连 npm 官方源经常超时。把 registry 切到 npmmirror（淘宝镜像）即可。全局切换对所有客户端生效；只想对这个 MCP 生效，就在配置的 env 里加 NPM_CONFIG_REGISTRY。bun 和 pnpm 用各自的写法。",
  code: [
    {
      label: "全局切换（npm / npx）",
      lang: "bash",
      code: `npm config set registry ${NPM_MIRROR}`,
    },
    {
      label: "单次使用",
      lang: "bash",
      code: `npx --registry=${NPM_MIRROR} -y ${pkg}`,
    },
    {
      label: "只对这个 MCP 生效（写进配置的 env）",
      lang: "json",
      code: `"env": {\n  "NPM_CONFIG_REGISTRY": "${NPM_MIRROR}"\n}`,
    },
    {
      label: "pnpm",
      lang: "bash",
      code: `pnpm config set registry ${NPM_MIRROR}`,
    },
    {
      label: "bunx（~/.bunfig.toml）",
      lang: "toml",
      code: `[install]\nregistry = "${NPM_MIRROR}"`,
    },
  ],
});

const pyMirror: TroubleshootingItem = {
  id: "pypi-mirror",
  question: "uvx / pip 安装 Python 包超时怎么办？",
  answer:
    "把 PyPI 源切到国内镜像（阿里云、清华均可）。uv 读取 UV_DEFAULT_INDEX 环境变量（旧版本 uv 用 UV_INDEX_URL），可以直接写进 MCP 配置的 env；pip 用 pip config 全局设置。",
  code: [
    {
      label: "uvx：写进配置的 env",
      lang: "json",
      code: `"env": {\n  "UV_DEFAULT_INDEX": "${PYPI_MIRROR}"\n}`,
    },
    {
      label: "uv：全局（~/.config/uv/uv.toml）",
      lang: "toml",
      code: `[[index]]\nurl = "${PYPI_MIRROR}"\ndefault = true`,
    },
    {
      label: "pip",
      lang: "bash",
      code: `pip config set global.index-url ${PYPI_MIRROR}`,
    },
  ],
};

const proxy: TroubleshootingItem = {
  id: "proxy",
  question: "终端里开了代理，客户端里的 MCP 还是连不上？",
  answer:
    "从 Dock、开始菜单启动的 Claude Desktop、Cursor 等客户端不会继承终端里 export 的代理变量，MCP 进程拿不到代理。把代理地址写进该 MCP 配置的 env（端口换成你自己的）。注意 Node 自带的 fetch 默认不读 HTTPS_PROXY，Node 24 及以上可再加 NODE_USE_ENV_PROXY=1；仍不行就开代理软件的 TUN / 增强模式。",
  code: [
    {
      label: "写进配置的 env",
      lang: "json",
      code: `"env": {\n  "HTTPS_PROXY": "http://127.0.0.1:7890",\n  "HTTP_PROXY": "http://127.0.0.1:7890",\n  "NODE_USE_ENV_PROXY": "1"\n}`,
    },
    {
      label: "只让 npm 下载走代理",
      lang: "bash",
      code: "npm config set proxy http://127.0.0.1:7890\nnpm config set https-proxy http://127.0.0.1:7890",
    },
  ],
};

const nodeVersion: TroubleshootingItem = {
  id: "node-version",
  question: "报 SyntaxError、fetch is not defined 或 Unsupported engine？",
  answer:
    "多半是 Node 版本太低。大多数 MCP Server 需要 Node 18 以上，建议用 LTS（20 或 22）。用 nvm 装好后，客户端可能仍在用系统自带的旧 Node：用 which npx 查出完整路径，把配置里的 command 换成这个绝对路径。",
  code: [
    { label: "查看版本", lang: "bash", code: "node -v" },
    {
      label: "用 nvm 安装 LTS",
      lang: "bash",
      code: "nvm install --lts\nnvm alias default 'lts/*'",
    },
    { label: "查出 npx 绝对路径", lang: "bash", code: "which npx" },
  ],
};

const windowsCmd = (command: string, args: string[]): TroubleshootingItem => ({
  id: "windows-cmd",
  question: `Windows 上提示 spawn ${command} ENOENT 或客户端无法启动？`,
  answer: `Windows 下 ${command} 实际是 ${command}.cmd，部分客户端不能直接启动它。把 command 改成 cmd，在 args 前面加上 /c 和 ${command}。`,
  code: [
    {
      label: "Windows 配置写法",
      lang: "json",
      code: `"command": "cmd",\n"args": ${JSON.stringify(["/c", command, ...args])}`,
    },
  ],
});

const proxyRemote: TroubleshootingItem = {
  id: "proxy-remote",
  question: "远程 MCP 连接超时或一直转圈怎么办？",
  answer:
    "远程（HTTP）MCP 由客户端自己发起连接，不经过终端。终端里 export 的代理对它无效：请在客户端的网络 / 代理设置里配置代理，或开启代理软件的 TUN / 增强模式，再重启客户端。",
};

/** Pick the troubleshooting items that apply to how this server is launched. */
export function getTroubleshootingItems(
  spec: ServerSpec | null,
): TroubleshootingItem[] {
  if (!spec) return [];
  if (spec.kind === "http") return [proxyRemote];

  const pkg = packageFromArgs(spec.args) ?? "<包名>";
  if (NPM_RUNNERS.has(spec.command)) {
    const items = [npmMirror(pkg), proxy, nodeVersion];
    if (spec.command !== "node") items.push(windowsCmd(spec.command, spec.args));
    return items;
  }
  if (PY_RUNNERS.has(spec.command)) return [pyMirror, proxy];
  return [proxy];
}

/** Plain-text answer (with commands) for FAQ JSON-LD. */
export function troubleshootingAnswerText(item: TroubleshootingItem): string {
  const code = (item.code ?? []).map((c) => `${c.label}：${c.code}`).join("\n");
  return code ? `${item.answer}\n${code}` : item.answer;
}
