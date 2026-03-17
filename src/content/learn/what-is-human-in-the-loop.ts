export default `## 通俗理解

自动驾驶汽车在高速公路上可以全程接管，但进入复杂施工路段时，它会提示你："请接管驾驶"。

**Human-in-the-Loop（HITL，人机协同）正是这个逻辑：AI 处理常规，人类处理边界。**

完全自动化听起来很美，但在高风险、低置信度、或后果不可逆的场景下，人类介入不是系统的弱点——而是系统的安全阀。HITL 不是 AI 能力不够，而是责任边界的合理划分。

## 核心模式

| 模式 | 触发方式 | 典型场景 | 优势 | 劣势 |
|------|---------|---------|------|------|
| 审批制（Approval） | Agent 执行前暂停，等待人类确认 | 生产环境部署、资金操作 | 风险可控，决策留痕 | 延迟高，人工成本大 |
| 升级制（Escalation） | Agent 尝试失败或置信度低时上报 | 客服工单、异常检测 | 自动处理常规，人类处理异常 | 需要定义清晰的升级阈值 |
| 反馈环（Feedback Loop） | 人类纠正输出，Agent 从中学习 | 标注、内容审核、推荐系统 | 持续改进，数据飞轮 | 需要稳定的人工反馈供给 |

**1. 审批制（Approval Mode）**

Agent 完成规划后暂停，把执行计划展示给人类，等待明确授权再继续：

\`\`\`
Agent: 我将执行以下操作：
  1. 删除 staging 数据库中 2024 年前的日志（约 2.3GB）
  2. 重建索引
  3. 重启服务

是否继续？[yes/no]
\`\`\`

**2. 升级制（Escalation）**

Agent 自动处理高置信度情况，遇到模糊或高风险情况时自动升级：

\`\`\`python
def handle_ticket(ticket: dict) -> str:
    confidence = classifier.predict(ticket)

    if confidence > 0.9 and ticket["priority"] != "critical":
        # auto-handle: high confidence, non-critical
        return auto_reply(ticket)
    else:
        # escalate to human: low confidence or critical priority
        return escalate_to_human(ticket, reason="low_confidence_or_critical")
\`\`\`

**3. 反馈环（Feedback Loop）**

人类的纠正行为被记录并用于改进模型或规则：

\`\`\`
Agent 输出 → 人类审核 → 标记错误 → 数据回流 → 模型 / 规则更新
\`\`\`

## 工程实践

Claude Code 内置了三级权限模式，是 HITL 的生产级实现：

\`\`\`bash
# ask mode — pause and confirm before every tool call (max HITL)
claude --permission-mode ask "重构 auth 模块"

# auto mode — execute autonomously, only pause for high-risk ops
claude --permission-mode auto "修复 lint 错误"

# allowedTools — fine-grained whitelist (selective HITL)
claude --allowedTools "Read,Edit,Bash(npm run:*)" "更新依赖版本"
\`\`\`

生产系统中常见的 HITL 工作流：Agent 执行完成后，通过 Slack 消息或邮件通知负责人，点击"批准 / 拒绝"按钮触发后续流程。这类审批工作流可以用 Slack Workflow Builder 或 Linear webhook 快速搭建，无需自建后台。

## 何时需要人类介入

用风险 × 置信度矩阵来决策：

|  | 高置信度 | 低置信度 |
|--|---------|---------|
| **低风险** | 全自动执行 | Agent 尝试 + 事后抽查 |
| **高风险** | 通知人类 + 可选确认 | **必须人类审批** |

判断"高风险"的快速标准：
- **不可逆性**：操作能否撤销？（删除 > 修改 > 读取）
- **影响范围**：影响生产用户 / 资金 / 隐私数据？
- **置信度**：模型对当前任务的把握有多大？

**常见误区**：HITL 不等于"处处都要人类确认"。过度介入会抹掉 AI 自动化的价值。目标是找到合适的介入点，而非让人类替代 Agent 做所有决策。`;
