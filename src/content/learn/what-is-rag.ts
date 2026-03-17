export default `## 通俗理解

大模型有个根本性问题：它只"记得"训练时见过的数据。你问它公司内部的产品文档、最新的 API 变更、昨天刚发布的新闻——它要么胡编，要么说"我不知道"。

**RAG 就是给大模型配了一个"开卷考试"的机会。**

不背答案，现场查资料。每次回答前先去知识库里搜索相关内容，把搜到的资料和问题一起交给大模型，让它基于真实数据来回答。

| | 纯大模型 | RAG |
|---|---------|-----|
| 知识来源 | 训练数据（有截止日期） | 实时检索（持续更新） |
| 准确性 | 容易产生幻觉 | 有出处、可验证 |
| 定制化 | 通用知识 | 企业/领域专属知识 |
| 成本 | 微调很贵 | 检索成本低 |

## 工作原理

RAG 分两个阶段：

### 离线阶段：构建知识库

\`\`\`
文档 → 分块(Chunking) → 向量化(Embedding) → 存入向量数据库
\`\`\`

把你的文档（PDF、网页、代码、Markdown）切成小段，用 Embedding 模型转成数学向量，存进向量数据库（如 Pinecone、Supabase pgvector、Chroma）。

### 在线阶段：检索 + 生成

\`\`\`
用户提问
  ↓
将问题向量化
  ↓
在向量数据库中搜索最相似的文档块（Top-K）
  ↓
将检索到的文档块 + 原始问题一起发给大模型
  ↓
大模型基于真实资料生成回答
\`\`\`

关键点：大模型看到的不只是你的问题，还有从知识库里检索出来的"参考资料"。

## 工程实践

用 LangChain 构建一个最简 RAG 系统：

\`\`\`python
from langchain_community.document_loaders import DirectoryLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain.chains import RetrievalQA

# 1. 加载文档
loader = DirectoryLoader("./docs", glob="**/*.md")
docs = loader.load()

# 2. 分块
splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
chunks = splitter.split_documents(docs)

# 3. 向量化 + 存储
vectorstore = Chroma.from_documents(chunks, OpenAIEmbeddings())

# 4. 构建 RAG 链
qa = RetrievalQA.from_chain_type(
    llm=ChatOpenAI(model="gpt-4o"),
    retriever=vectorstore.as_retriever(search_kwargs={"k": 5}),
)

# 5. 提问
answer = qa.invoke("我们的 API 认证方式是什么？")
\`\`\`

在 AI Agent 场景中，RAG 通常作为 Agent 的一个工具存在——Agent 决定"需要查资料"时，自动调用 RAG 检索。

## RAG vs 微调

| 维度 | RAG | 微调 (Fine-tuning) |
|------|-----|-------------------|
| 知识更新 | 更新文档即可，实时生效 | 需要重新训练模型 |
| 成本 | 低（只需向量数据库） | 高（GPU + 训练时间） |
| 适用场景 | 事实性查询、最新信息 | 风格调整、特定格式 |
| 可解释性 | 高（可追溯来源文档） | 低（黑盒） |
| 推荐起步 | 大多数场景先试 RAG | RAG 不够时再考虑 |

工程建议：**先 RAG，不够再微调。** 大多数企业知识问答、文档助手、客服场景，RAG 就够了。`;
