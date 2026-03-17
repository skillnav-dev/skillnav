export default `## 通俗理解

高速公路上的护栏不会减慢你的行驶速度，但它们会阻止你冲下山崖。

**AI Guardrails（安全护栏）是同样的道理：让 AI 系统跑得更快，同时不会冲出边界。**

没有护栏的 AI Agent 可能会：删除生产数据库、泄露用户隐私、生成违规内容、被提示注入攻击劫持。护栏不是限制 AI 能力，而是让 AI 能力安全地释放。

## 核心机制

护栏通常在请求的两个节点发挥作用：**输入侧**（过滤危险提示）和**输出侧**（验证响应合规）。

\`\`\`
用户输入 → [输入护栏] → 模型 → [输出护栏] → 最终响应
              ↓ 拦截                    ↓ 拦截
           返回错误                  重新生成 / 降级
\`\`\`

常见的护栏类型：

| 护栏类型 | 作用位置 | 典型实现 | 防护目标 |
|---------|---------|---------|---------|
| 内容过滤 | 输入 + 输出 | 关键词匹配 / 分类模型 | 违规内容、仇恨言论 |
| 权限检查 | 输入 | 工具调用前鉴权 | 越权操作、数据泄露 |
| 速率限制 | 输入 | Token 计数 + 时间窗口 | 滥用、成本失控 |
| 输出验证 | 输出 | Schema 校验 / 断言 | 格式错误、幻觉检测 |
| PII 检测 | 输入 + 输出 | 正则 / NER 模型 | 个人隐私信息泄露 |
| 提示注入防御 | 输入 | 结构分离 / 指令层级 | 恶意指令劫持 |

## 工程实践

Claude Code 的权限系统是工具级护栏的典型案例：

\`\`\`jsonc
// .claude/settings.json — tool-level guardrails
{
  "permissions": {
    // auto-approve safe read operations
    "allow": [
      "Bash(git log:*)",
      "Bash(npm run:*)",
      "Read(*)"
    ],
    // always require human confirmation for destructive actions
    "deny": [
      "Bash(rm -rf:*)",
      "Bash(git push --force:*)"
    ]
  }
}
\`\`\`

用代码实现一个最简的输出验证护栏：

\`\`\`python
import json
from anthropic import Anthropic

client = Anthropic()

def call_with_output_guardrail(prompt: str) -> dict:
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = response.content[0].text

    # output guardrail: validate JSON schema before returning
    try:
        result = json.loads(raw)
        assert "score" in result and 0 <= result["score"] <= 1
        return result
    except (json.JSONDecodeError, AssertionError):
        # fail-safe: return structured error instead of bad data
        return {"error": "output_validation_failed", "raw": raw}
\`\`\`

开源框架：**Guardrails AI**（Python，支持自定义 validator）、**NeMo Guardrails**（NVIDIA，对话流控制）。云服务商也提供托管方案：AWS Bedrock Guardrails、Azure Content Safety。

## 设计原则

**1. 最小权限（Least Privilege）**
Agent 只应获得完成当前任务所需的最小权限集。不要因为"以后可能用到"就开放写权限。

**2. 纵深防御（Defense in Depth）**
输入侧 + 模型对齐 + 输出侧，三层独立防线。任何一层失效，其他层兜底。不要依赖单点防护。

**3. 故障安全默认（Fail-Safe Defaults）**
不确定时，默认拒绝而非默认允许。护栏失效时应降级到安全行为（返回错误），而非透传危险输出。

**4. 审计追踪（Audit Trail）**
所有被护栏拦截的请求必须记录日志，包含时间戳、用户 ID、拦截原因。这是事后分析和合规审计的基础。`;
