export default `## 通俗理解

想象一个新闻记者：他不能凭印象写稿，每一个数据、每一个引用都必须有出处，编辑会要求他标注来源，无法核实的内容不得发布。

**Grounding（事实对齐）就是给 AI 加上同样的约束：每一个声明都必须来自可验证的真实数据，而不是模型的"记忆"。**

没有 Grounding 的 AI 像一个自信的健忘症患者——能说出听起来合理的话，但无法保证任何一句是真的。

## 核心技术

Grounding 是一个原则，有多种技术实现：

1. **引用生成（Citation Generation）**：要求模型在输出中标注每句话的来源文档和原文片段。Anthropic Claude 内置了 citations API，可以精确定位到原文字符位置

2. **RAG（检索增强生成）**：最主流的 Grounding 实现。先从知识库检索相关文档，再让模型基于这些文档生成答案。模型"只看文档说话"，不用自己的知识补充

3. **工具调用（Tool Use）**：让模型在回答时实时调用搜索引擎、数据库或 API 验证信息。比如问"今天比特币价格"，模型调用实时价格 API 再回答，而不是猜

4. **知识图谱关联（Knowledge Graph Linking）**：将实体（人名、公司、概念）链接到结构化知识库（如 Wikidata），确保实体信息准确

## Grounding vs RAG

这两个概念经常被混用，但有重要区别：

| 维度 | Grounding | RAG |
|------|-----------|-----|
| 层次 | 设计原则（更宽泛） | 具体技术实现 |
| 范围 | 所有让输出有据可查的方法 | 检索+生成这一特定管道 |
| 数据源 | 文档、数据库、API、搜索引擎 | 主要是向量数据库/文档库 |
| 实时性 | 可以实时（工具调用） | 取决于索引更新频率 |
| 典型场景 | 法律文书、医疗咨询、金融分析 | 企业知识库问答、客服系统 |

**RAG 是 Grounding 最常见的实现方式，但 Grounding 还可以通过网络搜索、API 调用等方式实现。**

## 工程实践

强制事实对齐的系统提示模式：

\`\`\`
SYSTEM:
你是一个严格遵守来源的助手。规则：
- 只基于 <context> 标签内的文档回答
- 每个事实性声明后用 [来源: 文档名, 第X段] 标注
- 如果文档中没有相关信息，明确说"提供的资料中未涉及此问题"
- 禁止用训练知识补充文档以外的内容

<context>
{retrieved_documents}
</context>
\`\`\`

使用 Anthropic Citations API 的示例：

\`\`\`python
import anthropic

client = anthropic.Anthropic()

# citations feature: model returns exact source spans
response = client.messages.create(
    model="claude-sonnet-4-20250514",
    messages=[{
        "role": "user",
        "content": [
            {
                "type": "document",
                "source": {"type": "text", "media_type": "text/plain", "data": document_text},
                "title": "source_document.txt",
                "citations": {"enabled": True}  # enable citation extraction
            },
            {"type": "text", "text": "根据上面的文档，总结主要结论"}
        ]
    }]
)
# response includes citation spans pointing to exact source positions
\`\`\`

Google Search Grounding 原理（Google AI Studio / Vertex AI 支持）：模型在生成前先调用 Google Search API，将搜索结果作为上下文注入，实现对实时网络信息的对齐。

## 评估 Grounding 质量

| 指标 | 含义 | 如何测量 |
|------|------|---------|
| **Faithfulness（忠实度）** | 输出中每个声明是否都能在来源中找到支撑 | RAGAS 框架自动评分 |
| **Citation Accuracy（引用准确率）** | 标注的来源是否真实存在且与声明匹配 | 人工抽样 + 自动对比 |
| **Attribution Rate（归因率）** | 有多少比例的声明有明确来源标注 | 计数统计 |
| **Hallucination Rate（幻觉率）** | 无来源支撑的声明占比 | 对比输出与来源文档 |

Grounding 是生产级 AI 系统的必备能力——特别是在法律、医疗、财务等高风险场景，没有 Grounding 的 AI 不应该被信任。`;
