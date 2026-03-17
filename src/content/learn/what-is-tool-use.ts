export default `## 通俗理解

想象你在用外卖 App 点餐：你告诉 App "我想要一份宫保鸡丁"，App 不会自己做饭，而是调用餐厅的 API——下单、付款、追踪配送——最后把结果告诉你。

**工具调用让 LLM 从"只能说话"变成"能动手"。**

| | 纯语言模型 | 配备工具的模型 |
|---|-----------|---------------|
| 能力 | 生成文本 | 生成文本 + 执行动作 |
| 实时信息 | 训练数据截止日期 | 可调用搜索、查询数据库 |
| 计算精度 | 容易出错 | 调用计算器/代码解释器 |
| 外部集成 | 无法访问 | 可调用任意 API |
| 典型场景 | 写作、翻译 | 订机票、查股价、改代码 |

## 核心机制

Function Calling 的工作流程分四步：

\`\`\`
1. 定义工具 Schema（JSON）→ 2. 模型决定调用哪个工具 → 3. 你的代码执行工具 → 4. 结果返回给模型
\`\`\`

关键点：**模型只负责"决定调用什么"，实际执行永远在你的代码里**。LLM 不会直接访问网络或文件系统，它只输出结构化的调用指令。

## 工程实践

用 Anthropic Python SDK 实现工具调用：

\`\`\`python
import anthropic

client = anthropic.Anthropic()

# Step 1: define tool schema
tools = [
    {
        "name": "get_weather",
        "description": "Get current weather for a given city",
        "input_schema": {
            "type": "object",
            "properties": {
                "city": {"type": "string", "description": "City name, e.g. Beijing"}
            },
            "required": ["city"],
        },
    }
]

# Step 2: model decides which tool to call
response = client.messages.create(
    model="claude-opus-4-5",
    max_tokens=1024,
    tools=tools,
    messages=[{"role": "user", "content": "北京今天天气怎么样？"}],
)

# Step 3: your code executes the tool
if response.stop_reason == "tool_use":
    tool_use = next(b for b in response.content if b.type == "tool_use")
    result = fetch_weather(tool_use.input["city"])  # your implementation

    # Step 4: return result to model
    final = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=1024,
        tools=tools,
        messages=[
            {"role": "user", "content": "北京今天天气怎么样？"},
            {"role": "assistant", "content": response.content},
            {"role": "user", "content": [{"type": "tool_result", "tool_use_id": tool_use.id, "content": result}]},
        ],
    )
\`\`\`

## Tool Use vs MCP

两个概念经常混用，实际上层次不同：

| | Tool Use（工具调用） | MCP（模型上下文协议） |
|---|--------------------|--------------------|
| 是什么 | LLM 的核心能力 | 工具集成的标准协议 |
| 层次 | 能力层 | 协议层 |
| 类比 | 打电话的能力 | 电话网络的标准 |
| 作用 | 让模型可以调用函数 | 统一工具的描述和调用格式 |

MCP 是在 Tool Use 能力基础上建立的标准——有了 MCP，工具开发者只需写一次，所有支持 MCP 的模型都能调用。

## 常见误区

- **"工具调用就是让 AI 上网"**——不准确。联网只是一种工具，工具调用是一种通用机制，可以调用任何函数：数据库查询、文件读写、发邮件、执行代码等
- **"模型会自己执行工具"**——不会。模型只输出"我想调用 X 工具，参数是 Y"，真正执行的是你的应用代码，这也是安全边界的关键所在
- **"工具越多越好"**——错。工具过多会稀释模型的注意力，通常建议单次调用不超过 20 个工具，优先提供精准、描述清晰的工具`;
