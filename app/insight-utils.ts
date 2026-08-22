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

export function exactTrackMatch(job:Pick<JobRecord,"track"|"title"|"experienceLevel">, selected:string) {
  if (selected === "全部类型") return true;
  const value=job.track;
  const internship = /实习/.test(value);
  const program = /管培|人才计划|青云|seed/i.test(value);
  const social = /社会招聘|社招|有经验/.test(value);
  const explicitIntern=/实习/.test(`${job.title}${job.experienceLevel || ""}`);
  if (selected === "实习") return internship && (explicitIntern || !/校招|校园招聘|应届|毕业生/.test(value)) && !program && !social;
  if (selected === "管培生") return program;
  if (selected === "社会招聘") return social;
  if (selected === "校招") return /校招|校园招聘|应届|毕业生/.test(value) && !explicitIntern && !program && !social;
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
  "SFT":{concept:"监督微调（Supervised Fine-Tuning）用“输入—理想输出”样本继续训练基座模型，让它学会特定任务格式、语气、知识表达和操作边界。它改变模型参数，不等于把资料临时塞进提示词。",mechanism:"先清洗指令与答案并划分训练/验证/测试集，再以自回归交叉熵训练；关键变量是基座模型、样本质量与配比、学习率、训练轮次和灾难性遗忘。上线前要与基座模型盲测，并检查通用能力、安全性和格式遵循是否退化。",productUse:"产品岗要定义哪些错误值得通过训练解决、什么叫理想答案、标注规范和验收集；不能用 SFT 解决需要实时更新的知识。运营岗可建设高价值场景样本、Badcase 分类和标注质检闭环。",project:"选择客服或商品标题任务，构造并审计 500 条指令样本；记录基座模型、训练参数、独立测试集，比较任务成功率、格式遵循率、幻觉率、P95 时延和单次成本。"},
  "LoRA":{concept:"LoRA 是参数高效微调方法：冻结原模型权重，只训练插入注意力或前馈层的低秩矩阵，以更少显存和存储成本获得领域适配能力。",mechanism:"权重更新被近似为两个低秩矩阵的乘积；秩 r、注入层、缩放系数、目标模块和数据质量共同决定效果。它降低训练门槛，但不会自动消除数据不足、过拟合或基座能力上限。",productUse:"用于低成本验证某个任务是否值得专门训练、为不同业务维护轻量适配器。产品侧要比较 LoRA、提示词、RAG 与全量微调的质量—时延—更新频率—维护成本，而不是默认微调。",project:"用同一基座对 300—1000 条领域样本进行 LoRA 实验，设置提示词基线，报告显存、训练时长、任务指标、通用能力退化和合并适配器后的推理成本。"},
  "DPO":{concept:"直接偏好优化（DPO）使用同一提示下的优选与劣选答案，直接提高模型对优选答案的相对概率；通常不需要单独训练奖励模型，也不运行在线强化学习。",mechanism:"训练目标比较策略模型对 chosen/rejected 的相对偏好，并以参考模型约束更新幅度。偏好对质量、分歧处理、难例比例、beta 系数和长度偏差会显著影响结果。",productUse:"把“更像好产品回答”拆成一致、可标注的偏好准则，设计双盲评测和分人群指标；关注模型是否只学会更长、更讨好或更模板化，而非真正提升任务成功率。",project:"制作 300 组偏好对并记录标注一致率，训练前后做盲测，报告胜率、拒答率、事实准确率、长度分布和至少三类能力退化。"},
  "GRPO":{concept:"组相对策略优化（GRPO）是一类强化学习方法：对同一问题采样一组回答，用组内相对奖励估计优势，减少对独立价值模型的依赖，常用于可验证推理任务。",mechanism:"同一提示生成多条候选，奖励函数逐条评分，再以组内均值或方差标准化形成相对优势，并通过受约束的策略更新提高高奖励答案概率。奖励可验证性、采样多样性和奖励投机是核心风险。",productUse:"适合答案可自动验证的数学、代码、结构化任务。产品岗需定义奖励函数、不可投机约束、推理成本预算和回归集；运营岗可维护规则、难例池及人工复核抽样。",project:"为结构化信息抽取设计格式、字段正确性和引用一致性三类奖励，采样每题 4—8 个答案，分析奖励与人工质量的相关性及奖励投机案例。"},
  "KV Cache":{concept:"KV Cache 保存 Transformer 已处理 Token 的 Key/Value 张量，使生成下一个 Token 时不用重复计算全部历史上下文。它换取速度的代价是显存占用。",mechanism:"自回归生成每一步只计算新 Token 的 Query/Key/Value，并复用历史层缓存；上下文越长、并发越高，缓存越大。量化、分页缓存、前缀复用和淘汰策略影响吞吐、首字/逐字延迟与命中率。",productUse:"设计长对话或 Agent 时要制定上下文预算、历史裁剪与前缀复用策略；验收不能只看回答质量，还要看 TTFT、TPOT、并发吞吐、缓存命中率和每会话成本。",project:"固定模型和问题集，对 4k/16k/32k 上下文与不同并发做压测，记录首字延迟、逐 Token 延迟、显存、吞吐和因裁剪导致的信息丢失。"},
  "Tokenizer":{concept:"Tokenizer 把文本切成模型可处理的 Token ID。Token 不是汉字或单词的固定等价物；词表与切分方式会影响上下文容量、成本、跨语言表现和结构化输出。",mechanism:"常见 BPE/Unigram 根据训练语料学习子词词表；文本经规范化、切分、映射后进入模型，生成的 ID 再解码。生僻词、中文英文混合、数字和代码可能产生不同膨胀率。",productUse:"估算真实输入输出成本、设计长度限制和截断提示，排查专有名词被异常切分、JSON 超长或多语言成本差异。指标包括每字符 Token 数、截断率、有效上下文利用率和任务成功率。",project:"选 200 条中文、英文、代码和行业术语样本，对两个模型 Tokenizer 比较膨胀率、截断点、费用与任务结果，并给出输入预算规则。"},
  "合成数据":{concept:"合成数据是由规则、模拟器或模型生成，并经过筛选与校验的数据；用于扩充稀缺场景、覆盖边界案例或构造训练与评测集，但不天然等于真实分布。",mechanism:"先定义目标分布和生成模板，再多样化采样、去重、事实/规则校验、质量打分和人工抽检；最后与真实数据混合并隔离评测集，防止数据泄漏和模型自我复制偏差。",productUse:"把稀缺 Badcase 变成可控生产管线，明确来源、版本、通过规则、人工抽检率和真实数据占比；需要监控覆盖提升是否伴随风格单一、错误放大或评测污染。",project:"围绕 10 类边界场景生成 1,000 条样本，设置去重、事实校验和 10% 人审，比较加入前后的分类型召回率，并检查独立真实测试集是否提升。"},
  "模型评测":{concept:"模型评测是用固定任务、数据、指标和判定协议测量模型是否满足业务目标；它不只是一个总分，而是质量、安全、效率、成本和稳定性的多维证据。",mechanism:"从真实任务抽样并分层，冻结评测集和版本；结合规则指标、模型裁判与人工盲评，校准一致性，分别报告总体、分场景与置信区间，同时维护回归集和 Badcase 演进。",productUse:"把产品目标转成可判定 rubric、上线门槛和回滚条件；区分离线代理指标与线上用户价值，避免用单一胜率掩盖安全退化、长尾失败和成本增加。",project:"构建 200 条分层评测集和 5 维 rubric，对两个模型双盲评测；报告标注一致率、分场景胜率、幻觉率、P95 时延、成本与失败案例。"},
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
      concept:detail?.concept || `${term} 是本轮岗位原文明确出现、但尚未被基础课程收录的独立技术信号。先判断它属于模型/算法、数据、工程系统、工具框架还是评测指标，再确认它解决的具体问题、适用边界，以及它与相邻方案的差异；不能只记一个名词，也不能从公司业务反推岗位要求。`,
      mechanism:detail?.mechanism || `岗位证据原文：${evidence}\n\n理解工作机制时按六层拆解：①输入与数据格式；②核心处理步骤及上下游组件；③输出如何进入产品链路；④离线质量和线上业务指标；⑤时延、吞吐、算力与人力成本；⑥失败模式、权限、安全与降级方案。对每一层都要能画出流程并指出负责人和可观测数据。`,
      productUse:detail?.productUse || `非技术岗使用 ${term} 时，应交付一份可执行方案：写清目标用户与触发场景，建立不使用该技术的基线，定义数据合同和验收集，设定质量/时延/成本/安全门槛，列出异常兜底与人工接管，最后通过灰度或 A/B 实验决定是否上线。运营岗还应建设样本回流、Badcase 分类、标注质检和周期复盘机制。`,
      mentalModel:`先回答五个问题：${term} 解决什么问题、依赖什么数据、在哪个链路生效、怎样评测、失败时如何归因。`,
      jdSignal:`${[...new Set(matches.map((job) => job.company))].join("、")} 的 ${matches.slice(0,3).map((job) => job.title).join("、")} 等岗位明确出现该技术信号。`,
      project:detail?.project || `围绕 ${term} 选择一个公开可复现的业务场景，制作至少 100 条分层测试样本；设置基线与一个改进版本，逐条保存输入、输出和判定依据，报告分场景指标、P95 时延、单次成本、Badcase 分类和下一轮取舍。`,
      resumeProof:`用“业务问题—你的决策—数据规模—${term} 所在链路—评测集与指标—基线—效果变化—失败与复盘”写清项目，并附 PRD、流程图、评测表或演示链接；不要只写“熟悉 ${term}”。`,
      source:matches[0].sourceUrl,
      learnUrl:externalLearningUrl(term),
      tags:[term],
      matches,
      historical:matches.filter((job) => job.status === "已下线").length,
    };
  });
}

export function externalLearningUrl(term:string) {
  if (/MCP/i.test(term)) return "https://modelcontextprotocol.io/docs/getting-started/intro";
  if (/SFT|LoRA|QLoRA|DPO|GRPO|RLHF|RLAIF|PPO|微调|预训练|奖励模型|偏好对齐/i.test(term)) return "https://huggingface.co/docs/trl/quickstart";
  if (/Agent|ReAct|Planning|Subagent|Multi-Agent|Tool|Skill|Function Calling/i.test(term)) return "https://www.anthropic.com/engineering/building-effective-agents";
  if (/上下文|Token 预算|记忆|Memory/i.test(term)) return "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents";
  if (/评测|Badcase|指标/i.test(term)) return "https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents";
  return "https://huggingface.co/learn/llm-course/en/chapter1/1?fw=pt";
}

function escapeRegExp(value:string) { return value.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"); }
function escapeHtml(value:string) { return value.replace(/[&<>"']/g,(char) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char] || char)); }

export function exportPdfReport(title:string, subtitle:string, sections:Array<{ heading:string; body:string[] }>) {
  const popup=window.open("","_blank");
  if (!popup) throw new Error("浏览器阻止了导出窗口，请允许本站弹出窗口后重试");
  popup.opener=null;
  const content=sections.map((section) => `<section><h2>${escapeHtml(section.heading)}</h2>${section.body.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}</section>`).join("");
  popup.document.write(`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>@page{size:A4;margin:16mm}*{box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;color:#17182f;margin:0}header{border-bottom:3px solid #7064ff;padding-bottom:18px;margin-bottom:24px}h1{font-size:28px;margin:0 0 8px}header p{color:#666;margin:0;font-size:11px}section{break-inside:avoid;border:1px solid #dddbea;border-radius:10px;padding:14px 16px;margin:0 0 12px}h2{font-size:15px;margin:0 0 10px;color:#4b3fac}p{font-size:10px;line-height:1.7;margin:5px 0;white-space:pre-wrap}footer{margin-top:24px;color:#888;font-size:9px;text-align:center}</style></head><body><header><h1>${escapeHtml(title)}</h1><p>${escapeHtml(subtitle)}</p></header>${content}<footer>Timeless · 基于官方招聘原文生成 · ${new Date().toLocaleString("zh-CN")}</footer><script>window.onload=()=>{window.print();window.onafterprint=()=>window.close()}</script></body></html>`);
  popup.document.close();
}
