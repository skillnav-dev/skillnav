# Follow Builders 项目分析

Date: 2026-03-21
Tags: skill, distribution, signals, competitive-intel

## 项目概况

- **Repo**: github.com/zarazhangrui/follow-builders
- **定位**: AI builders digest — 追踪 25 个 AI builder 的 X 动态 + 5 个播客，AI 摘要推送
- **Stars**: 248（7 天内）
- **形态**: Claude Code Skill（安装到 ~/.claude/skills/）
- **分发**: 小红书视频 → GitHub → 用户 Agent 自动运行

## 架构演变（来自作者视频）

### V1（失败）: 分布式爬取
- 信息源写进 Skill，让每个用户的 Agent 自己爬
- 问题：爬内容需要 API Key（YouTube 用 Supadata API，X 用官方付费 API）
- 用户拿 Key 门槛高，X API 还付费

### V2（成功）: Centrally Fetch, Locally Remix
- 作者自己有 API Key，脚本每天抓取存到 JSON
- 用户 Agent 只读这个 JSON
- 个性化在本地：用户 remix 成自己喜欢的格式（语言、长度、风格）
- 信息源由作者集中控制 = Skill 的核心价值

## 与 SkillNav 的关系

### 互补维度
| | Follow Builders | SkillNav |
|---|---|---|
| 信息源 | 25 builder X + 5 播客 | 10 RSS + 5 newsletter |
| 覆盖 | 人物动态 | 工具生态 + 资讯 + 教程 |
| 数据深度 | 摘要 | 结构化（评分、分级、安全审计） |
| 分发 | Skill → 飞书/Telegram | 网站 + 社交媒体 |

### 可借鉴
1. **感知源扩展**: 他追踪的 builder list 和播客可以纳入我们的信号层
2. **Skill 分发模式**: "Centrally Fetch, Locally Remix" 和我们的 scrape-signals → generate-daily 架构完全一致，做成 Skill 路径短
3. **小红书视频引爆**: 248 stars / 7 天，一个视频就完成了 SkillNav Growth Sprint 的目标

## 战略启示

- Skill 本身是分发渠道，不只是产品品类
- 编辑判断力（精选源）比技术实现更有价值
- "Centrally Fetch, Locally Remix" 是 Skill 产品的标准架构模式
