# 翻译质量审校报告

基于 `audit-data/articles-sample-30.json` 中的 30 条样本进行人工审校。评分范围为 1-5 分，1=差，5=优。

说明：
- 本报告只比对 `title_en/title_zh`、`content_en_preview/content_zh_preview` 和 `intro_zh`。
- `content_*_preview` 是截断预览，因此本报告反映的是“预览段落的翻译质量”，不是全文逐段校对结果。

## 总体结论

整体呈现出比较明显的“两头高、中间低”特征：
- 中文自然度均分 `4.07`，说明译文普遍顺滑、像中文稿。
- `intro_zh` 均分 `4.07`，说明导语普遍会写，也知道如何包装“为什么值得看”。
- 标题均分 `3.57`、翻译准确度均分 `3.63`，说明主要问题不在语言本身，而在“过度改写”和“媒体化包装”。

一句话概括：这批样本更像“中文科技媒体改写稿”，而不是“忠实、克制的技术翻译稿”。

## 30 篇文章评分总表

| 序号 | slug | 中文标题 | 标题 | 准确 | 自然 | 导语 | 总分 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `interactive-explanations` | 用动画解释代码：Agentic Engineering 如何化解认知债务 | 4 | 4 | 4 | 4 | 16 |
| 2 | `linear-walkthroughs` | AI 代码导读：用 Showboat 让 Agent 为你生成结构化代码解析 | 4 | 4 | 5 | 4 | 17 |
| 3 | `hoard-things-you-know-how-to-do` | Agentic 工程模式：积累代码解决方案，让 AI 编码更高效 | 3 | 4 | 4 | 4 | 15 |
| 4 | `prompts-i-use` | Simon Willison 自用的 3 套 Prompt：Artifacts 原型、校对、Alt Text | 5 | 4 | 4 | 5 | 18 |
| 5 | `first-run-the-tests` | 别让 AI 盲改代码：先让 Agent 跑测试 | 4 | 4 | 4 | 5 | 17 |
| 6 | `red-green-tdd` | 红/绿TDD：让编程Agent少写废代码 | 4 | 4 | 4 | 4 | 16 |
| 7 | `anti-patterns-things-to-avoid` | 别让同事替你审AI代码：Agent PR四大雷区 | 3 | 4 | 4 | 4 | 15 |
| 8 | `ai-should-help-us-produce-better-code` | 别让AI拉低代码质量：4个Agent工程模式 | 3 | 3 | 4 | 4 | 14 |
| 9 | `writing-code-is-cheap-now` | 代码近乎免费后，Agent工程最贵的仍是质量 | 4 | 4 | 5 | 5 | 18 |
| 10 | `what-is-agentic-engineering` | 什么是Agentic Engineering？AI编程代理如何重塑软件开发 | 4 | 4 | 4 | 4 | 16 |
| 11 | `why-ai-systems-are-failing-in-familiar-ways` | 多Agent也没用：项目失败的根因是批次太大 | 3 | 3 | 4 | 4 | 14 |
| 12 | `my-fireside-chat-about-agentic-engineering-at-the-pragmatic-summit` | Agentic Engineering实战：开发者如何高效利用AI编码工具 | 3 | 4 | 4 | 4 | 15 |
| 13 | `ainews-the-high-return-activity-of-raising-your-aspirations-for-llms` | 把LLM用到极限：2026代理生态关键拐点 | 3 | 2 | 4 | 4 | 13 |
| 14 | `retrieval-after-rag-hybrid-search-agents-and-database-design-simon-h-rup-eskilds` | RAG之后怎么做检索：混合搜索与Agent并发新范式 | 4 | 3 | 4 | 4 | 15 |
| 15 | `before-you-let-ai-agents-loose-you-d-better-know-what-they-re-capable-of` | 企业上AI Agent前，先补上这3道风控闸门 | 3 | 4 | 4 | 4 | 15 |
| 16 | `surepath-ai-advances-mcp-policy-controls-to-tighten-the-cable-on-ai-s-usb-c` | SurePath推MCP管控：千个高危工具数小时现形 | 2 | 3 | 4 | 4 | 13 |
| 17 | `new-perplexity-apis-give-developers-access-to-agentic-workflows-and-orchestratio` | Perplexity连发三大API：一把钥匙搭建Agent | 3 | 4 | 4 | 4 | 15 |
| 18 | `anthropic-s-claude-can-now-draw-interactive-charts-and-diagrams` | Claude上线交互图表：人人可用的AI可视化来了 | 3 | 4 | 4 | 4 | 15 |
| 19 | `runpod-report-qwen-has-overtaken-meta-s-llama-as-the-most-deployed-self-hosted-l` | Runpod实测：Qwen部署量反超Llama，优化算力成主战场 | 4 | 4 | 4 | 4 | 16 |
| 20 | `ainews-replit-agent-4-the-knowledge-work-agent` | Replit估值9B背后：Agent从编程走向知识工作 | 3 | 3 | 4 | 4 | 14 |
| 21 | `galileo-releases-agent-control-a-centralized-guardrails-platform-for-enterprise-` | Galileo开源Agent Control：一套策略管住全栈AI Agent | 4 | 4 | 4 | 4 | 16 |
| 22 | `autonomous-context-compression` | Deep Agents新能力：让Agent自主压缩上下文 | 4 | 4 | 4 | 5 | 17 |
| 23 | `the-anatomy-of-an-agent-harness` | 拆解 Agent Harness：8个核心组件与设计逻辑 | 4 | 4 | 4 | 4 | 16 |
| 24 | `how-coding-agents-are-reshaping-engineering-product-and-design` | Coding Agent重塑EPD：PRD已死，评审为王 | 5 | 4 | 4 | 5 | 18 |
| 25 | `the-era-of-ai-as-text-is-over-execution-is-the-new-interface` | Copilot SDK落地指南：执行型AI成新入口 | 4 | 4 | 4 | 4 | 16 |
| 26 | `how-context-rot-drags-down-ai-and-llm-results-for-enterprises-and-how-to-fix-it` | 企业AI失准元凶：Context Rot治理全解 | 4 | 4 | 4 | 4 | 16 |
| 27 | `under-the-hood-security-architecture-of-github-agentic-workflows` | GitHub Agent工作流安全拆解：4层防线控风险 | 2 | 4 | 4 | 4 | 14 |
| 28 | `how-we-built-langchain-s-gtm-agent` | LangChain实战：GTM Agent如何带来250%转化提升 | 5 | 4 | 4 | 5 | 18 |
| 29 | `cursor-builds-always-on-agents-to-tackle-developer-task-tedium` | Cursor上线常驻Agent：把代码审查与排障全自动化 | 2 | 3 | 4 | 3 | 12 |
| 30 | `andrew-ng-agent-skills-course-guide` | 吴恩达 × Anthropic「Agent Skills」课程完全指南 | 4 | 1 | 4 | 1 | 10 |

## Top 5 最佳翻译

### 1. `prompts-i-use`
- 标题具体、信息密度高，且没有明显失真，能准确告诉中文开发者“这篇到底讲哪 3 类 prompt”。
- 译文基本保留了原文的三段结构：Artifacts、Proofreader、Alt text，阅读路径清晰。
- `intro_zh` 既说明“写什么”，也说明“为什么重要”，是这批样本里较成熟的导语写法。

### 2. `writing-code-is-cheap-now`
- 核心论点“代码变便宜，但好代码仍然昂贵”被准确保留下来，没有被媒体化标题冲掉。
- 中文表达自然、节奏稳定，几乎没有明显翻译腔。
- 导语对“判断力、验证能力、工程习惯仍然稀缺”的提炼是准确的。

### 3. `how-coding-agents-are-reshaping-engineering-product-and-design`
- 标题虽然有观点性，但和原文的 “PRDs are dead / bottleneck shifts to review” 高度一致，不算乱加戏。
- 译文很好地抓住了“实现成本下降，评审成为新瓶颈”这一主线。
- `intro_zh` 既有面向中国开发者的可读性，也没有偏离原文中心。

### 4. `how-we-built-langchain-s-gtm-agent`
- 业务背景、工作流、量化指标都保留得比较完整，信息损失较少。
- 中文自然，尤其在“人工审批”“关系状态感知”“学习闭环”等关键点上表达清楚。
- 导语把“生产级案例”这一价值点说得很准。

### 5. `linear-walkthroughs`
- 标题本地化程度适中，既不像直译，也没有过度营销。
- 译文对 Showboat 的作用、场景和方法讲得明白，基本忠于原文。
- 中文行文顺畅，是少数“既像中文稿，又没明显改写过度”的样本。

## Top 5 最差翻译

### 1. `andrew-ng-agent-skills-course-guide`
- `intro_zh` 直接缺失，这是最明显的结构性问题。
- 英文预览只是短课程介绍和课程概览，中文却扩写成“完全指南”，已经不是翻译，而是二次创作。
- 出现了未经英文预览支撑的表述，例如“OpenAI Codex CLI、Cursor、VS Code 都已支持”。
- 还出现了明显数据/链接质量问题，例如仓库地址写成 `https://github.com/https-deeplearning-ai/sc-agent-skills-files`。

### 2. `cursor-builds-always-on-agents-to-tackle-developer-task-tedium`
- 标题“把代码审查与排障全自动化”明显过头，原文只是介绍 Automations 的能力和示例，不是“全自动化宣言”。
- `intro_zh` 加入了“研发流程从人驱动走向 Agent 驱动”的行业判断，超出了原文预览的新闻范围。
- 中文本身不难读，但忠实度不够，像一篇带立场的解读稿。

### 3. `ainews-the-high-return-activity-of-raising-your-aspirations-for-llms`
- 英文预览开头仍是新闻通讯/评论口吻，中文却直接改造成“2026 代理生态关键拐点”的趋势综述。
- 译文塞入大量高层框架和结论，读起来顺，但和英文预览的逐段对应关系较弱。
- 这是典型的“可读但不忠实”。

### 4. `surepath-ai-advances-mcp-policy-controls-to-tighten-the-cable-on-ai-s-usb-c`
- 标题拿“千个高危工具数小时现形”做主句，新闻感很强，但把读者注意力从产品能力本身带偏到了戏剧化案例。
- 内容整体还能对上，但已经明显是“选角度重写”，不是克制翻译。
- 这类稿子最容易在投放层面好看、在质量层面失真。

### 5. `ainews-replit-agent-4-the-knowledge-work-agent`
- 中文标题和导语强行挂上“估值 9B 背后”“知识工作大转向”的行业叙事，重心比英文原文更宏大。
- 译文加入了大量趋势图式的总结和扩展引用，信息量大，但和原文预览的直接映射偏弱。
- 读者会得到一篇“观点提炼稿”，而不是一篇可靠的翻译稿。

## 共性问题

### 1. 标题普遍媒体化，忠实度低于可读性
高频模式包括：
- `背后`
- `已死`
- `全解`
- `一把钥匙`
- `来了`
- `主战场`
- `人人可用`

这些写法确实更像中文科技媒体标题，但也最容易把原文的边界、语气和重点改掉。

### 2. 很多样本不是“翻译”，而是“改写 + 提炼 + 包装”
最典型的信号是这些句式被高频复用：
- “这篇文章讨论的是……”
- “核心结论是……”
- “它解决的是……”
- “读完你会……”

这些句式让中文导语看起来很完整，但也会让译文自动进入“编辑部口吻”，削弱原文作者的语气和结构。

### 3. 第一人称、访谈感、新闻感经常被抹平
英文原文里常见：
- 第一人称经验叙述
- 炉边谈话/播客/通讯口吻
- 新闻报道的克制铺陈

中文经常把它们统一改造成“面向开发者的观点总结稿”，导致文体漂移。

### 4. 准确度问题主要来自“加法”，不是“语病”
这批样本的中文自然度总体不差，真正拉低分数的不是别扭，而是：
- 擅自加结论
- 擅自升维成行业趋势
- 擅自改成教程/指南/全解
- 在标题里塞入原文没有明确承诺的数字或判断

### 5. 术语和英文残留处理不稳定
可见的问题包括：
- 某些段落保留整段英文，如 `TL;DR`
- 英文引语直接保留，不做翻译或不解释保留原因
- 中英夹杂不统一，如 `opt-in`、`inline`、`catch-all action`

不是不能保留英文，而是当前保留方式缺少一致的规则。

### 6. 存在少量结构性质量问题
- `intro_zh` 缺失
- 链接损坏或明显错误
- 原始 Markdown/链接被直接搬进中文，显得粗糙

这类问题不多，但一旦出现，直接破坏可信度。

## 对翻译流水线的改进建议

### 1. 明确区分两种产物：忠实翻译 vs 编辑改写
如果字段名是 `title_zh`、`content_zh_preview`、`intro_zh`，默认应产出“忠实翻译版”。

如果业务确实需要“更像媒体稿”的版本，应该另开字段，例如：
- `title_zh_localized`
- `summary_zh_editorial`

不要在同一个字段里混合两种目标。

### 2. 给标题和导语加“来源约束”
建议增加硬规则：
- 标题里的数字、因果、趋势判断，必须能在英文预览里直接找到依据。
- 导语每一句都必须可回溯到原文，不允许写“读完你会知道……”这种源文本没有的承诺。

最适合做自动校验的是标题和导语，因为它们最短、最容易偏题。

### 3. 增加句级对齐检查，重点拦“无依据增写”
可在流水线里加一个轻量的对齐审查：
- 从 `content_zh_preview` 中抽句
- 逐句判断是否能被 `content_en_preview` 支撑
- 对“新增观点”“新增行业判断”“新增教程化 framing”打标

当前最大问题不是漏译，而是越权改写。

### 4. 保留原文文体，不要统一改成“中文科技媒体模板”
建议按原文类型走不同模板：
- 第一人称博客：保留作者经验叙述
- 新闻稿：保留报道体，不要写成评论
- 访谈/播客：保留“谈了哪些点”的结构
- 课程介绍：保留课程介绍，不要膨胀成“完全指南”

### 5. 建立术语表和保留英文规则
建议至少统一这些词的处理：
- harness
- context rot
- guardrails
- compact
- opt-in
- inline
- human-in-the-loop

目标不是一律翻译或一律保留，而是“全库一致”。

### 6. 增加发布前 QA
最少应自动检查：
- `intro_zh` 是否为空
- URL 是否明显损坏
- 是否出现整段英文遗留
- 中文标题是否包含原文没有依据的数字/结论

这部分可以靠规则跑掉大量低级问题。

### 7. 限制模板化导语
建议弱化以下高频模板：
- “这篇文章讨论的是……”
- “核心结论是……”
- “它解决的是……”
- “读完你会……”

这些句式用一次两次没问题，但大规模复用后，AI 味会很重，也会削弱文体区分度。

## 结论

这 30 篇样本的最大优点，是中文读起来普遍顺，不生硬；最大问题，是经常把“翻译”做成了“中文媒体二次包装”。如果目标是面向中文开发者做内容分发，这种写法有传播优势；但如果目标是建立可信的双语内容库，现在这条流水线对“忠实度”的约束还明显不够。
