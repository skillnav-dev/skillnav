# Translation Quality Issues

- **Date**: 2026-03-19
- **Status**: resolved
- **Tags**: llm, content, translation

## Symptom

LLM-translated articles had machine-translation smell:
- 59/214 intros started with "本文介绍了/本文探讨了"
- Titles were generic ("数据记者的AI编程助手应用")
- Formal register ("该工具旨在为开发者提供更高效的解决方案")
- Translation artifacts ("然而/此外/值得注意的是" padding)

## Root Cause

1. **Prompt lacked negative examples** — no BAD/GOOD pairs to steer output
2. **No explicit ban on "本文" openings** — DeepSeek defaulted to template starts
3. **Register mismatch** — prompt asked for "polished" but didn't specify spoken-register Chinese
4. **LLM selection** — DeepSeek V3 Chinese output is functional but lacks native fluency compared to GPT-5.4/Claude

## Fix

Updated `scripts/lib/llm.mjs` SYSTEM_PROMPT (commit `98410d7`):
- Added "Writing voice" section with hard bans ("NEVER start with 本文")
- Added 3 BAD/GOOD example pairs (titles, intros, body)
- Required spoken-register Chinese ("说人话": "省了不少事" > "显著降低了操作成本")
- Upgraded persona to 少数派/极客公园 level editor
- Banned 6 filler transitions (然而/此外/值得注意的是/需要指出的是/总的来说/综上所述)

## Result

Same DeepSeek model, prompt-only change:
- "数据记者的AI编程助手应用" → "Simon Willison 教记者用 Claude Code 做数据分析"
- "本文介绍了NICAR 2026研讨会..." → "三小时工作坊，23 美元 token 费..."
- 168/214 articles retranslated (46 remaining due to process timeout on long articles)

## Lessons

- Prompt negative examples are more effective than positive instructions for LLM output control
- DeepSeek quality is adequate when prompt is well-tuned; GPT-5.4 proxy preferred but CI-blocked
- Full retranslation of 214 articles takes ~2h with DeepSeek; long articles (>15K, chunked) cause bottlenecks
