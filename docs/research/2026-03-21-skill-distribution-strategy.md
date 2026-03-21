# Skill 分发策略 + SkillNav 定位反思

Date: 2026-03-21
Tags: strategy, distribution, positioning

## 背景信号

三个同时发生的案例：
1. 归藏：1 天做 CodePilot（Claude Code 桌面端），微信爆文
2. Follow Builders：小 Skill，7 天 248 stars，小红书视频引爆
3. VaultX：19 小时做密码管理器，Tauri + Rust + React

共同信号：AI 把创造成本压到接近零，供给爆炸。

## 核心洞察

### 稀缺资源转移
- 旧世界：谁能造 → 有价值
- 新世界：谁能选 → 有价值（供给爆炸，注意力恒定）

### SkillNav 的核心资产
不是网站、代码、数据库。是**编辑判断力**——哪个工具值得用，哪条新闻重要。

但目前包在最没壁垒的形态里：
- 翻译资讯：AI 人人能做
- 工具目录：爬 GitHub 谁都行
- 网站：142 visitors/month，被 Google 掐流量

### 时代错配
SkillNav 为 Google 搜索时代设计（建站 → SEO → 等流量），用户活在 Claude Code 时代（Skill → 工作流内消费 → 即时价值）。

## 战略方向

### 从工具目录 → 编辑品牌
终局：「SkillNav 推荐 = 值得用」（类比 Wirecutter）
品牌力可输出到任何载体：网站、Skill、Newsletter、社交媒体

### 内容策略调整
- 原创 > 翻译（VaultX 复盘、工具深度评测、"本周 3 选 1"）
- 人格化 > 官方号（有态度的编辑人格）
- 去到用户在的地方（小红书、X、Skill），网站是沉淀地不是入口

### Skill 分发（新增渠道）
- SkillNav Skill MVP：daily brief 查询 + MCP 推荐 + trending
- 架构：Centrally Fetch, Locally Remix（已有基础设施）
- 网站数据 API 化 → Skill 读取 → 用户工作流内消费

## 优先级建议
1. 原创内容 + 社交媒体人格（立即可做）
2. SkillNav Skill MVP（1-2 周）
3. 内容质量自动化（持续迭代）
