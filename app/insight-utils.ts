import type { JobRecord, KnowledgeCard } from "./cortex-data";

export const abilityGroups = [
  { name:"Agent 系统设计", pattern:/Agent|智能体|上下文|Context|记忆|Memory|ReAct|Plan-and-Execute|Subagent|Multi-Agent|Function Calling|MCP|Skill|工具|工作流/i },
  { name:"模型原理与后训练", pattern:/Transformer|自回归|Attention|位置编码|KV Cache|Tokenizer|采样|SFT|LoRA|DPO|GRPO|RLHF|PPO|预训练|微调|对齐|MoE/i },
  { name:"检索、知识与多模态", pattern:/RAG|Embedding|向量|召回|重排|知识图谱|检索|OCR|ASR|TTS|语音|视觉|多模态|VLM|Diffusion/i },
  { name:"数据与评测工程", pattern:/评测|Badcase|指标|数据|合成数据|标注|Python|SQL|实验|归因|A\/B|可复现/i },
  { name:"产品策略与用户洞察", pattern:/用户研究|需求分析|产品规划|竞品|业务抽象|行业研究|产品策略|场景|体验/i },
  { name:"增长、商业化与经营", pattern:/增长|商业化|电商|品类|商家|行业运营|策略运营|用户运营|转化|留存|GMV/i },
  { name:"项目推进与跨团队协作", pattern:/项目管理|跨团队|协作|沟通|推动|自驱|责任|执行|落地/i },
  { name:"其他原文明示能力", pattern:/.*/ },
] as const;

export function exactTrackMatch(value:string, selected:string) {
  if (selected === "全部类型") return true;
  const internship = /实习/.test(value);
  const program = /管培|人才计划|青云|seed/i.test(value);
  const social = /社会招聘|社招|有经验/.test(value);
  if (selected === "实习") return internship && !program && !social;
  if (selected === "管培生") return program;
  if (selected === "社会招聘") return social;
  if (selected === "校招") return /校招|校园招聘|应届|毕业生/.test(value) && !internship && !program && !social;
  return false;
}

export function abilityNameFor(term:string) {
  return abilityGroups.find((group) => group.pattern.test(term))?.name || "其他原文明示能力";
}

export function evidenceForAbility(job:JobRecord, terms:string[]) {
  const termPattern = new RegExp(terms.map(escapeRegExp).join("|"),"i");
  return [job.technicalRequirements,job.experienceRequirements,job.softRequirements,...job.evidence]
    .filter((value):value is string => Boolean(value))
    .flatMap((value) => value.split(/\n+/).map((item) => item.trim()))
    .filter((value,index,list) => value.length >= 8 && termPattern.test(value) && list.indexOf(value) === index)
    .slice(0,6);
}

const stackDetails:Record<string,{ concept:string; mechanism:string; productUse:string; project:string }> = {
  "RLHF":{concept:"利用人类偏好信号训练奖励模型或直接优化策略，使模型输出更符合有用、诚实和安全等目标。",mechanism:"典型链路包含偏好对采集、奖励模型、策略优化和回归评测；产品侧必须明确偏好标准、冲突处理与安全边界。",productUse:"把模糊的“回答更好”拆成可标注的偏好维度，设计偏好对和灰度评测，判断收益是否抵消成本与能力退化。",project:"构造 300 组业务偏好对，定义 5 类偏好标准，对基线与对齐版本进行盲测并报告胜率和退化项。"},
  "PPO":{concept:"一种基于策略梯度的强化学习算法，通过限制每次策略更新幅度提高训练稳定性。",mechanism:"模型生成结果，奖励函数评分，PPO 根据优势估计更新策略，同时用裁剪目标避免参数一步变化过大。",productUse:"产品经理要理解奖励设计会塑造模型行为，关注奖励投机、训练稳定性和离线指标与用户价值的偏差。",project:"为一个结构化回答任务设计奖励拆解表，并用离线样本分析高奖励但低质量的奖励投机案例。"},
  "MoE":{concept:"混合专家模型把部分前馈网络拆成多个专家，每个 Token 只路由到少数专家，以较低计算量扩大参数容量。",mechanism:"路由器为 Token 选择专家并做负载均衡；核心权衡是容量、延迟、专家负载和路由稳定性。",productUse:"在模型选型中理解参数规模不等于单次计算量，并评估高并发、长上下文和特定领域任务的成本质量曲线。",project:"对两个不同架构模型做固定任务集测试，比较效果、首字延迟、吞吐和单位任务成本。"},
  "多模态":{concept:"让模型联合理解或生成文本、图像、音频、视频等多种信息模态。",mechanism:"不同模态先编码为统一或可对齐的表示，再由跨模态注意力或统一序列建模完成理解与生成。",productUse:"定义模态输入边界、失败兜底、时延预算、隐私要求与跨模态评测，而不是只增加上传入口。",project:"为商品审核场景构建图文联合评测集，分别测文本、图片及联合输入的准确率与冲突处理能力。"},
  "向量数据库":{concept:"针对高维向量进行近似最近邻检索的存储系统，常用于语义搜索和 RAG。",mechanism:"内容被 Embedding 模型编码为向量并建立索引，查询向量通过 ANN 检索候选，再结合元数据过滤与重排。",productUse:"决定数据更新、权限过滤、召回指标和成本，并识别问题来自向量化、索引、过滤还是重排。",project:"用 1,000 个文档片段比较两种索引和过滤策略，报告 Recall@K、P95 延迟与错误类型。"},
  "知识图谱":{concept:"以实体、关系和属性组织可解释知识，用于关系查询、约束和结构化推理。",mechanism:"从数据抽取实体关系，完成消歧、融合和版本管理，再通过图查询或与大模型联合使用。",productUse:"适合强关系、强约束和可追溯场景；产品侧要定义本体、更新责任和冲突解决机制。",project:"为招聘领域设计职位、技能、公司、业务线四类实体及关系，构建 200 条事实并验证 20 个关系查询。"},
};

export function dynamicKnowledgeCards(jobs:JobRecord[], baseCards:KnowledgeCard[]) {
  const known = new Set(baseCards.flatMap((card) => [card.title,...card.tags]).map((item) => item.toLowerCase()));
  const terms = new Map<string,JobRecord[]>();
  jobs.forEach((job) => job.ai.forEach((term) => {
    if (known.has(term.toLowerCase())) return;
    terms.set(term,[...(terms.get(term) || []),job]);
  }));
  return [...terms.entries()].map(([term,matches]) => {
    const detail=stackDetails[term];
    const evidence=evidenceForAbility(matches[0], [term])[0] || matches[0].technicalRequirements || matches[0].summary;
    return {
      id:`live-${term.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g,"-")}`,
      title:term,
      level:"岗位新增技术栈",
      minutes:24,
      relevance:matches.length,
      desc:`由 ${matches.length} 条岗位原文动态生成；最近证据来自 ${matches[0].company}。`,
      concept:detail?.concept || `${term} 是当前岗位原文明示的 AI 技术或方法。Timeless 将它作为独立技术信号保存，并随新增与历史岗位持续累计，而不是把它泛化成“懂 AI”。`,
      mechanism:detail?.mechanism || `当前证据原文：${evidence}。学习时应继续拆解它的输入、输出、关键组件、质量指标、成本与失败模式。`,
      productUse:detail?.productUse || `非技术岗需要把 ${term} 转译为具体业务场景、验收指标、数据要求、异常处理和迭代实验，并能与算法及工程团队明确责任边界。`,
      mentalModel:`先回答五个问题：${term} 解决什么问题、依赖什么数据、在哪个链路生效、怎样评测、失败时如何归因。`,
      jdSignal:`${[...new Set(matches.map((job) => job.company))].join("、")} 的 ${matches.slice(0,3).map((job) => job.title).join("、")} 等岗位明确出现该技术信号。`,
      project:detail?.project || `围绕 ${term} 选一个公开业务场景，制作至少 50 条测试样本，记录基线、改动、指标、失败分类和成本变化。`,
      resumeProof:`写清使用 ${term} 的业务问题、数据规模、实现链路、评测口径、基线与效果变化，并附可核验产物。`,
      source:matches[0].sourceUrl,
      tags:[term],
      matches,
      historical:matches.filter((job) => job.status === "已下线").length,
    };
  });
}

function escapeRegExp(value:string) { return value.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"); }
function escapeHtml(value:string) { return value.replace(/[&<>"']/g,(char) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char] || char)); }

export function exportPdfReport(title:string, subtitle:string, sections:Array<{ heading:string; body:string[] }>) {
  const popup=window.open("","_blank");
  if (!popup) throw new Error("浏览器阻止了导出窗口，请允许本站弹出窗口后重试");
  popup.opener=null;
  const content=sections.map((section) => `<section><h2>${escapeHtml(section.heading)}</h2>${section.body.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}</section>`).join("");
  popup.document.write(`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>@page{size:A4;margin:16mm}*{box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;color:#17182f;margin:0}header{border-bottom:3px solid #7064ff;padding-bottom:18px;margin-bottom:24px}h1{font-size:28px;margin:0 0 8px}header p{color:#666;margin:0;font-size:11px}section{break-inside:avoid;border:1px solid #dddbea;border-radius:10px;padding:14px 16px;margin:0 0 12px}h2{font-size:15px;margin:0 0 10px;color:#4b3fac}p{font-size:10px;line-height:1.7;margin:5px 0;white-space:pre-wrap}footer{margin-top:24px;color:#888;font-size:9px;text-align:center}</style></head><body><header><h1>${escapeHtml(title)}</h1><p>${escapeHtml(subtitle)}</p></header>${content}<footer>Timeless · 基于官方招聘原文生成 · ${new Date().toLocaleString("zh-CN")}</footer><script>window.onload=()=>{window.print();window.onafterprint=()=>window.close()}<\/script></body></html>`);
  popup.document.close();
}
