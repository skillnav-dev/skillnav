export default `## 通俗理解

把上下文窗口想象成你的办公桌：桌子越大，你能同时摊开的文件就越多，处理复杂任务就越得心应手。但有一点残酷的真相——**桌子以外的东西，AI 完全不记得**。

**上下文窗口就是模型在一次对话中能"看见"的全部信息总量。**

每次调用 API，你能塞进去的 Token 总量（输入 + 输出）不能超过这个上限。超出就会报错，或者早期的内容被自动截断。

## 各模型上下文对比（2026）

| 模型 | 上下文窗口 | 适用场景 |
|------|-----------|---------|
| Claude 4（Opus/Sonnet） | 200K tokens | 长文档分析、大型代码库 |
| GPT-4o | 128K tokens | 通用对话、中等长度任务 |
| Gemini 2.5 Pro | 1M tokens | 超长文档、全量代码仓库 |
| DeepSeek-V3 | 128K tokens | 成本敏感场景 |
| Llama 3.3 70B | 128K tokens | 本地部署、隐私场景 |

粗略估算：1K tokens ≈ 750 个英文单词 ≈ 500 个中文字符。200K tokens 大约能装下一部中等长度的小说。

## 工程应对策略

当任务所需的内容超出上下文窗口时，有四种主要应对方案：

**1. 分块处理（Chunking）**——把长文档切成小块，逐块处理后合并结果。适合：批量翻译、逐章分析。

\`\`\`python
def process_long_document(text: str, chunk_size: int = 4000) -> list[str]:
    # Split text into overlapping chunks to preserve context across boundaries
    chunks = [text[i:i+chunk_size] for i in range(0, len(text), chunk_size - 200)]
    return [llm_process(chunk) for chunk in chunks]
\`\`\`

**2. 滚动摘要（Summarization）**——对话过长时，把旧消息压缩成摘要，只保留最近的原始消息。适合：长对话 Agent。

\`\`\`python
def compress_history(messages: list, keep_recent: int = 10) -> list:
    if len(messages) <= keep_recent:
        return messages
    # Summarize older messages, keep recent ones verbatim
    old_messages = messages[:-keep_recent]
    summary = llm_summarize(old_messages)
    return [{"role": "system", "content": f"Earlier conversation summary: {summary}"}] + messages[-keep_recent:]
\`\`\`

**3. RAG（检索增强生成）**——不把所有文档塞进上下文，而是先检索相关片段再注入。适合：知识库问答、文档搜索。

\`\`\`bash
# Instead of loading 10,000 documents, retrieve top-5 relevant chunks
query_embedding = embed(user_query)
relevant_chunks = vector_db.search(query_embedding, top_k=5)
context = "\n".join(relevant_chunks)
# Only inject ~2K tokens instead of millions
\`\`\`

**4. 滑动窗口（Sliding Window）**——类似滚动日志，始终保留最新的 N 个 Token，丢弃最早的内容。适合：实时流处理、持续运行的 Agent。

## 常见误区

- **"上下文越大越好"**——不对。研究表明模型对上下文中间部分的注意力会显著下降（"Lost in the Middle"现象）。把 1M token 塞满并不能保证模型充分利用所有信息，精准注入比堆量更重要

- **"上下文窗口 = AI 的记忆"**——不对。上下文窗口是**单次对话的工作区**，对话结束后全部清空。跨对话的"记忆"需要额外的持久化机制（数据库、文件、Memory 模块），这是完全独立的工程问题

- **"Token 数量 = 字符数量"**——不对。Token 的切分方式因语言和分词器而异，中文通常比英文消耗更多 Token，计算成本时需要实测而非估算`;
