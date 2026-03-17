# Glossary / Learning Center Competitive Research

> Date: 2026-03-17 | Tags: glossary, SEO, learning-center, competitive

## Purpose

Evaluate the competitive landscape for a Chinese AI Agent engineering glossary/learning center product, informing the design of SkillNav's `/learn` section.

## Key Findings

### 1. Existing Chinese AI Glossary Products

| Product | Type | Strength | Weakness |
|---------|------|----------|----------|
| [Jimmy Song - Agentic Design Patterns 术语表](https://jimmysong.io/zh/book/agentic-design-patterns/glossary/) | Book appendix | Comprehensive, Chinese | Tied to one book, not standalone |
| [知乎 - AI 智能体附录术语表](https://zhuanlan.zhihu.com/p/1979454498507351501) | Blog post | Detailed A2A/HITL/Handoffs coverage | Buried in long article, no structure |
| [80aj.com - 2026 AI 名词词典](https://www.80aj.com/2026/02/28/ai-glossary-2026-engineering-practice/) | Blog post | Engineering-focused, current | Single post, no maintenance |
| [CSDN - 最全人工智能专业术语表](https://blog.csdn.net/Appen_China/article/details/114637332) | Blog post | Large term count | Outdated, no Agent/MCP coverage |
| [维基百科 - 人工智能术语表](https://zh.wikipedia.org/zh-hans/%E4%BA%BA%E5%B7%A5%E6%99%BA%E8%83%BD%E6%9C%AF%E8%AF%AD%E8%A1%A8) | Wiki | Authoritative | Academic, slow updates |

### 2. English Glossary Products

| Product | Type | Strength |
|---------|------|----------|
| [Glide - Agentic Engineering Glossary](https://www.glideapps.com/blog/agentic-engineering-glossary) | Blog post | Focused on agentic engineering |
| [Cloudflare Learning Center](https://www.cloudflare.com/learning/) | Product | Gold standard for SEO-driven education |
| [Google Cloud - Generative AI Glossary](https://docs.cloud.google.com/docs/generative-ai/glossary) | Docs | Comprehensive but platform-specific |
| [Straiker AI Glossary](https://www.straiker.ai/glossary/mcp) | Product | Includes MCP entry |

### 3. Competitive Gap

**No one is building a structured, maintained, focused Chinese glossary for AI Agent engineering.** Existing content is either:
- Too broad (all of AI, not Agent-specific)
- Too static (blog posts published once, never updated)
- Too embedded (book appendix, article section)
- English-only (Glide, Cloudflare)

### 4. Cloudflare Learning Center Model (Best Practice)

Source: [GrackerAI case study](https://gracker.ai/case-studies/cloudflare), [Scott Mathson analysis](https://scottmathson.com/blog/2020/04/23/cloudflare-dns-content-hub-case-study-pt-1-seo-rankings/)

- 32 DNS articles → 8,000 keyword rankings (658 in Top 3)
- ~80% of Cloudflare's traffic comes from organic search
- Template: "What is X?" → definition → how-it-works → product mention
- Topic cluster model: pillar page links to all cluster pages, cluster pages link back
- International: hreflang tags, structured data for rich snippets
- Funnel: free education → trust → free tier signup → paid conversion

### 5. SEO Strategy Insights

- Topic clusters produce 40% higher organic traffic than non-clustered strategies (6-12 month compound)
- `DefinedTerm` + `FAQPage` JSON-LD increases rich snippet eligibility
- "什么是XXX" is classic informational intent — top of funnel
- AI search (GEO) favors structured, deep, source-cited content over shallow definitions
- pSEO (programmatic SEO) scales well for glossary products (Canva, DeepL examples)

### 6. Search Demand Signals

High-volume Chinese searches confirmed:
- "什么是 Agent" / "AI 智能体是什么"
- "什么是 MCP" / "MCP 协议是什么"
- "什么是 RAG" / "RAG 和 Agent 的区别"
- "Agent MCP RAG 关系" (comparison intent)

Multiple Zhihu/CSDN articles with "一文读懂 MCP、RAG、Agent" titles indicate strong demand.

## Recommendation

Build `/learn` as a Cloudflare Learning Center-style product focused on AI Agent engineering concepts. Start with 12 core terms, validate SEO traction, then expand.

Full plan: `docs/plans/glossary-learning-center.md`
