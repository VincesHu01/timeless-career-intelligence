export const AI_TECH_TERMS = [
  "Transformer","自回归生成","Attention","位置编码","RoPE","KV Cache","Tokenizer","采样策略","上下文工程","Token 预算",
  "短期记忆","长期记忆","ReAct","Plan-and-Execute","Function Calling","Tool Use","Agent Loop","Skill","Subagent","Multi-Agent","MCP",
  "RAG","Embedding","向量数据库","召回","重排","知识图谱","SFT","LoRA","QLoRA","DPO","GRPO","RLHF","RLAIF","PPO",
  "持续预训练","微调","偏好对齐","奖励模型","MoE","合成数据","数据标注","评测集","模型评测","Badcase",
  "Python","SQL","PyTorch","LangChain","LlamaIndex","OCR","ASR","TTS","VLM","多模态","Diffusion","Agent","LLM","大模型","AIGC",
] as const;

const prosePattern = /深入理解|强烈兴趣|感兴趣|有热情|具备|能够|负责|参与|熟悉.+者|优先|经验|能力|意识|思维|背景|候选人|我们希望|岗位|工作/i;
const conceptSuffix = /(模型|算法|框架|协议|数据库|图谱|工程|学习|训练|微调|对齐|评测|推理|检索|记忆|缓存|编码|采样)$/;

export function extractAiTechnicalTerms(values:unknown, max=24) {
  if (!Array.isArray(values)) return [];
  const raw=values.filter((item):item is string => typeof item === "string").join(" ");
  const dictionaryMatches=AI_TECH_TERMS.filter((term) => raw.toLowerCase().includes(term.toLowerCase()));
  const concise=values
    .filter((item):item is string => typeof item === "string")
    .flatMap((item) => item.split(/[，,、；;｜|/]+/))
    .map((item) => item.replace(/\s+/g," ").trim())
    .filter((item) => item.length >= 2 && item.length <= 18 && !prosePattern.test(item))
    .filter((item) => conceptSuffix.test(item) || /^[A-Z][A-Za-z0-9+.# -]{1,17}$/.test(item));
  return [...new Set([...dictionaryMatches,...concise])].slice(0,max);
}

export function isConciseAbilityTerm(value:string) {
  const term=value.replace(/\s+/g," ").trim();
  return term.length >= 2 && term.length <= 20 && !/[。；，,：:！!?？]/.test(term) && !prosePattern.test(term);
}
