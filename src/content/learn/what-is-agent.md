## 通俗理解

想象你有一个特别能干的实习生：你给他一个目标（"帮我调研竞品并写份报告"），他会自己拆解任务、搜索资料、整理数据，遇到问题会自己想办法，最后交给你一份完整的报告。

**AI Agent 就是这样的"数字实习生"。**

它和普通的聊天 AI 最大的区别：

| | 聊天 AI | AI Agent |
|---|---------|----------|
| 交互模式 | 你问一句，它答一句 | 你给目标，它自主执行 |
| 能力边界 | 只能生成文本 | 能调用工具、读写文件、执行代码 |
| 任务复杂度 | 单轮对话 | 多步骤、有规划、能纠错 |
| 典型场景 | "帮我翻译这段话" | "帮我把这个 Bug 修了并提交 PR" |

## 核心机制

一个典型的 AI Agent 运行循环：

```
感知（Perceive）→ 思考（Think）→ 行动（Act）→ 观察结果 → 继续循环
```

1. **感知**：读取用户指令、当前文件、错误日志等环境信息
2. **思考**：基于大模型的推理能力，决定下一步做什么
3. **行动**：调用工具（搜索、编辑文件、运行命令、调用 API）
4. **观察**：检查行动结果，判断是否需要调整方案

这个循环会一直进行，直到任务完成或者需要人类确认。

## 工程实践

Claude Code 就是一个典型的 AI Agent。来看它怎么工作：

```bash
# 你给一个目标
claude "给项目添加暗色模式支持"

# Agent 自主执行：
# 1. 读取现有代码结构
# 2. 分析使用的 UI 框架
# 3. 安装必要的依赖
# 4. 修改配置文件
# 5. 更新组件样式
# 6. 运行测试验证
```

用 Python 构建一个最简 Agent 的核心逻辑：

```python
import anthropic

client = anthropic.Anthropic()
tools = [{"name": "read_file", ...}, {"name": "edit_file", ...}]

messages = [{"role": "user", "content": "帮我修复 login 页面的 Bug"}]

# Agent 循环
while True:
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        tools=tools,
        messages=messages,
    )

    # 如果模型决定调用工具，执行并继续
    if response.stop_reason == "tool_use":
        tool_result = execute_tool(response.content)
        messages.append({"role": "assistant", "content": response.content})
        messages.append({"role": "user", "content": tool_result})
    else:
        # 任务完成
        break
```

关键点：Agent 不是一个全新的 AI 模型，而是 **大模型 + 工具 + 循环** 的工程模式。

## 常见误区

- **"Agent 就是更智能的 ChatGPT"**——不是。Agent 的核心不是"更聪明"，而是"能动手"，关键区别在于工具调用能力
- **"Agent 能完全替代人"**——目前还不能。复杂任务仍然需要 Human-in-the-Loop（人类监督），Agent 更像是 10 倍效率的协作伙伴
- **"构建 Agent 很难"**——基础的 Agent 循环其实只有几十行代码。难的是让它稳定、安全、可控
