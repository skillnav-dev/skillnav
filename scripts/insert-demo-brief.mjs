import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const contentMd = `> 今天最值得关注的信号：Anthropic 发布了 81,000 人 AI 使用调研（4/5 日报同时报道），Google 推出 AI 原生设计工具 Stitch，Runway 实现实时视频生成。同时，GitHub 开源了多智能体协作框架 Squad，Cloudflare 上线 Kimi K2.5 大幅降低推理成本。

## 🔥 行业热点

### Anthropic 发布 81,000 人 AI 使用调研
*热度：4/5 日报报道 · [原文](https://www.anthropic.com/features/81k-interviews)*

全球 80,508 人参与的大规模调研揭示：用户对 AI 同时存在期待和担忧，33% 享受用 AI 学习，17% 担忧产生依赖。**开发者视角**：这份数据对设计 AI 产品的交互模式有直接参考价值——用户想要的是"协作"而非"替代"。

### Google Stitch：AI 原生设计平台
*热度：3/5 日报报道 · [原文](https://blog.google/innovation-and-ai/models-and-research/google-labs/stitch-ai-ui-design/)*

Google Labs 推出 Stitch，支持无限画布、设计 Agent、语音指令和原型生成。**开发者视角**：又一个 "vibe designing" 产品，和 v0、Bolt 形成竞争。值得关注它的 Agent 架构设计。

### MiniMax M2.7 + 小米 MiMo-V2-Pro：中国模型持续追赶
*热度：各 3/5 日报报道 · [MiniMax](https://www.minimax.io/news/minimax-m27-en) · [MiMo](https://mimo.xiaomi.com/mimo-v2-pro)*

MiniMax 的 M2.7 完成 100+ 轮自主优化训练，编码能力跻身一线，定价 $0.30/百万 token。小米 MiMo-V2-Pro 万亿参数但仅激活 42B，性能逼近 GPT-5.2 和 Opus 4.6。**开发者视角**：推理成本持续下降，国产模型作为 subagent 的性价比越来越高。

### Runway 实时视频生成
*热度：3/5 日报报道*

Runway 联合 NVIDIA 发布实时视频生成模型，首帧延迟 <100ms。**开发者视角**：实时生成意味着交互式 AI 视频应用成为可能。

---

## 📰 深度文章精选

### [GitHub 开源 Squad：仓库内多智能体协作框架](/articles/how-squad-runs-coordinated-ai-agents-inside-your-repository)
*GitHub Blog*

两条命令在仓库中初始化一个预配置的 AI 团队。基于 Copilot 构建，不需要复杂的编排基础设施，让多智能体开发变得可访问。

### [Cloudflare Workers AI 上线 Kimi K2.5，推理成本降 77%](/articles/powering-the-agents-workers-ai-now-runs-large-models-starting-with-kimi-k2-5)
*Cloudflare Blog*

Workers AI 正式支持前沿开源大模型。通过优化推理栈和前缀缓存，内部安全审查智能体的推理成本降低了 77%。

### [Chainguard 为 AI 智能体提供依赖安全方案](/articles/chainguard-has-a-fix-for-the-open-source-packages-your-ai-agents-keep-grabbing)
*The New Stack*

AI 加速开发带来依赖蔓延问题，Chainguard Repository 提供统一的安全策略执行端点。

### [Claude 长时运行助力科研计算](/articles/long-running-claude-for-scientific-research)
*Anthropic*

如何用 Claude Code 设置长时运行智能体执行科学计算——代码重构、调试和数值求解器实现，通过进度文件和 Git 协调在数天内完成复杂任务。

---

📮 SkillNav AI 日报 · 2026 年 3 月 20 日 · [skillnav.dev](https://skillnav.dev)`;

const contentX = `--- Tweet 1/6 ---
📊 SkillNav AI Daily | 2026-03-20
今天 4 条行业热点 + 4 篇深度文章

🔥 五大日报共识：Anthropic 八万人调研揭示 AI 使用真相

🧵 ↓

--- Tweet 2/6 ---
🔥 Anthropic 81,000 人 AI 调研（4/5 日报报道）

33% 享受用 AI 学习，17% 担忧依赖
用户要的是"协作"不是"替代"

对 AI 产品设计有直接参考
🔗 anthropic.com/features/81k-interviews

--- Tweet 3/6 ---
🔥 Google Stitch — AI 原生设计平台

无限画布 + 设计 Agent + 语音指令
"Vibe designing" 赛道又多一个重量级玩家

🔗 stitch.withgoogle.com

--- Tweet 4/6 ---
🔥 中国模型追赶：MiniMax M2.7 + 小米 MiMo-V2-Pro

MiniMax: 100+ 轮自主优化，$0.30/M tokens
小米: 万亿参数，42B 激活，逼近 GPT-5.2

国产模型做 subagent 的性价比越来越高

--- Tweet 5/6 ---
📰 今日深度精选：

1⃣ GitHub 开源 Squad 多智能体框架
2⃣ Cloudflare 上线 Kimi K2.5，推理成本降 77%
3⃣ Chainguard 解决 AI 智能体依赖安全
4⃣ Claude 长时运行科研计算实战

详情 → skillnav.dev

--- Tweet 6/6 ---
☕ That is today's brief.

关注 @skillnav_dev 获取每日 AI 工具动态
🔗 skillnav.dev

#AI #AIAgent #DevTools`;

const contentWechat = `<div style="max-width:600px;margin:0 auto;padding:16px;font-family:-apple-system,BlinkMacSystemFont,sans-serif">
<h1 style="font-size:20px;font-weight:bold;color:#1a1a2e;margin:0;text-align:center">五大日报共识：Anthropic 八万人调研揭示 AI 使用真相</h1>
<p style="font-size:13px;color:#999;margin:4px 0;text-align:center">2026 年 3 月 20 日 · 4 条热点 + 4 篇精选</p>
<blockquote style="margin:12px 0;padding:10px 16px;border-left:3px solid #2563eb;background:#f8f9fa;color:#555;font-size:14px;line-height:1.7">今天最值得关注：Anthropic 发布 81,000 人 AI 使用调研（4/5 日报同时报道），Google 推出 Stitch，Runway 实现实时视频生成。</blockquote>
<h2 style="font-size:18px;color:#1a1a2e;margin:24px 0 12px">🔥 行业热点</h2>
<h3 style="font-size:16px;color:#1a1a2e;margin:16px 0 8px">Anthropic 发布 81,000 人 AI 使用调研</h3>
<p style="font-size:13px;color:#2563eb;margin:0 0 4px">热度：4/5 日报报道</p>
<p style="font-size:15px;color:#333;line-height:1.8">33% 享受用 AI 学习，17% 担忧依赖。用户想要"协作"而非"替代"——对 AI 产品交互设计有直接参考。</p>
<h3 style="font-size:16px;color:#1a1a2e;margin:16px 0 8px">Google Stitch：AI 原生设计平台</h3>
<p style="font-size:13px;color:#2563eb;margin:0 0 4px">热度：3/5 日报报道</p>
<p style="font-size:15px;color:#333;line-height:1.8">无限画布 + 设计 Agent + 语音指令。Vibe designing 赛道又多一个重量级玩家。</p>
<h3 style="font-size:16px;color:#1a1a2e;margin:16px 0 8px">MiniMax M2.7 + 小米 MiMo-V2-Pro</h3>
<p style="font-size:13px;color:#2563eb;margin:0 0 4px">热度：各 3/5 日报报道</p>
<p style="font-size:15px;color:#333;line-height:1.8">国产模型性价比持续提升，MiniMax $0.30/M tokens，小米万亿参数仅激活 42B。</p>
<h3 style="font-size:16px;color:#1a1a2e;margin:16px 0 8px">Runway 实时视频生成</h3>
<p style="font-size:13px;color:#2563eb;margin:0 0 4px">热度：3/5 日报报道</p>
<p style="font-size:15px;color:#333;line-height:1.8">首帧延迟 <100ms，交互式 AI 视频应用成为可能。</p>
<h2 style="font-size:18px;color:#1a1a2e;margin:24px 0 12px">📰 深度精选</h2>
<p style="font-size:15px;color:#333;line-height:1.8">1. <a style="color:#2563eb" href="https://skillnav.dev/articles/how-squad-runs-coordinated-ai-agents-inside-your-repository">GitHub 开源 Squad 多智能体框架</a></p>
<p style="font-size:15px;color:#333;line-height:1.8">2. <a style="color:#2563eb" href="https://skillnav.dev/articles/powering-the-agents-workers-ai-now-runs-large-models-starting-with-kimi-k2-5">Cloudflare 上线 Kimi K2.5，推理成本降 77%</a></p>
<p style="font-size:15px;color:#333;line-height:1.8">3. <a style="color:#2563eb" href="https://skillnav.dev/articles/chainguard-has-a-fix-for-the-open-source-packages-your-ai-agents-keep-grabbing">Chainguard 解决 AI 智能体依赖安全</a></p>
<p style="font-size:15px;color:#333;line-height:1.8">4. <a style="color:#2563eb" href="https://skillnav.dev/articles/long-running-claude-for-scientific-research">Claude 长时运行科研计算实战</a></p>
<div style="text-align:center;margin-top:32px;padding-top:16px;border-top:1px solid #eee">
<p style="font-size:13px;color:#999">SkillNav · 中文开发者的 AI 智能体工具站</p>
<p style="font-size:13px;color:#2563eb">skillnav.dev</p>
</div>
</div>`;

async function main() {
  const { data, error } = await supabase
    .from('daily_briefs')
    .upsert({
      brief_date: '2026-03-20',
      title: '五大日报共识：Anthropic 八万人调研揭示 AI 使用真相',
      summary: '今天最值得关注的信号：Anthropic 发布了 81,000 人 AI 使用调研（4/5 日报同时报道），Google 推出 AI 原生设计工具 Stitch，Runway 实现实时视频生成。同时，GitHub 开源了多智能体协作框架 Squad，Cloudflare 上线 Kimi K2.5 大幅降低推理成本。',
      content_md: contentMd,
      content_x: contentX,
      content_wechat: contentWechat,
      article_ids: [],
      status: 'draft'
    }, { onConflict: 'brief_date' })
    .select();

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Created:', data[0].id, '|', data[0].brief_date, '|', data[0].title);
  }
}

main();
