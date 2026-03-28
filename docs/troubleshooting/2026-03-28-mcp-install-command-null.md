# MCP install_command 全 null

Date: 2026-03-28

## 症状

8424 条 ClawHub MCP 记录中 8289 条 `install_command` 为 null，135 条为垃圾数据（如 `- id: deps`、`- kind: node`）。

## 根因

两个问题叠加：

1. **sync-clawhub.mjs YAML 解析误匹配** — 正则 `/[ \t]+install:\s*(.+)/` 太宽泛，匹配到 `requires` 块里的 YAML list items，写入脏数据
2. **backfill-install-command.mjs 不支持 monorepo URL** — `extractOwnerRepo()` 只能提取 `owner/repo`，对 `github.com/openclaw/skills/tree/main/skills/{author}/{name}` 这种 monorepo 路径全部解析为 `openclaw/skills`，无法生成正确命令

## 修复

1. 清理 135 条脏 `install_command`（全部置 null）
2. `backfill-install-command.mjs`: `extractOwnerRepo()` → `buildInstallCommand()`，直接从完整 GitHub URL 路径生成 `claude skill add --url github.com/{full-path}`
3. `sync-clawhub.mjs:95`: install 正则加 `(?![-\[])` 负向前瞻，排除 YAML list items
4. 跑 `--apply` 回填 1338 条 published skills，0 错误

## 预防

- sync-clawhub 的正则已收紧，不会再写入脏数据
- backfill 脚本现在支持任意 GitHub URL 格式
