export type CompanySource = {
  name: string;
  short: string;
  logo: string;
  level: "A" | "B" | "C";
  status: string;
  url: string;
  note: string;
};

export type JobRecord = {
  id: string;
  company: string;
  title: string;
  family: string;
  roleType?: "产品岗" | "运营岗";
  track: string;
  location: string;
  date: string;
  sourceTier: string;
  sourceUrl: string;
  summary: string;
  skills: string[];
  ai: string[];
  bonusSignals?: string[];
  technicalRequirements?: string;
  experienceRequirements?: string;
  softRequirements?: string;
  experienceLevel?: string;
  firstSeenAt?: string;
  lastSeenAt?: string;
  evidence: string[];
  status: "在招" | "已下线" | "待复核" | "招聘项目";
};

export const companySources: CompanySource[] = [
  { name:"字节跳动", short:"字节", logo:"https://jobs.bytedance.com/favicon.ico", level:"A", status:"官方校园招聘", url:"https://jobs.bytedance.com/campus/position", note:"以官方校园招聘入口和可核验的单岗位详情链接为准；不再使用旧入口。" },
  { name:"阿里巴巴", short:"阿里", logo:"https://campus-talent.alibaba.com/favicon.ico", level:"A", status:"集团校招公开", url:"https://campus-talent.alibaba.com/", note:"需保留淘天、阿里云、钉钉等招聘业务归属。" },
  { name:"腾讯", short:"腾讯", logo:"https://join.qq.com/favicon.ico", level:"A", status:"官方公开搜索与详情接口", url:"https://join.qq.com/", note:"已使用公开搜索与详情接口读取岗位，不再依赖空壳 HTML。" },
  { name:"美团", short:"美团", logo:"https://zhaopin.meituan.com/favicon.ico", level:"B", status:"项目分类公开", url:"https://zhaopin.meituan.com/", note:"区分日常实习、转正实习、校招、北斗计划与社招。" },
  { name:"快手", short:"快手", logo:"https://zhaopin.kuaishou.cn/favicon.ico", level:"C", status:"JavaScript 站点", url:"https://zhaopin.kuaishou.cn/", note:"页面空壳与访问校验会分开显示，不再统一写成“文本不足”。" },
  { name:"百度", short:"百度", logo:"https://talent.baidu.com/favicon.ico", level:"A", status:"结构清晰", url:"https://talent.baidu.com/jobs/", note:"公开岗位列表可按招聘项目、职类和城市核验。" },
  { name:"携程", short:"携程", logo:"https://job.ctrip.com/favicon.ico", level:"C", status:"多入口待校验", url:"https://job.ctrip.com/", note:"官网、官方公告与公众号需合并去重，旧页面不作当前依据。" },
  { name:"京东", short:"京东", logo:"https://zhaopin.jd.com/favicon.ico", level:"A", status:"公开职位列表", url:"https://zhaopin.jd.com/", note:"官方“运营类”较宽，需二次排除销售、运维及内容岗位。" },
  { name:"拼多多", short:"拼多多", logo:"https://careers.pddglobalhr.com/favicon.ico", level:"B", status:"校招项目公开", url:"https://careers.pddglobalhr.com/", note:"校招、实习、人才专项与管培生需要分别标注。" },
  { name:"得物", short:"得物", logo:"https://poizon.jobs.feishu.cn/favicon.ico", level:"C", status:"飞书招聘入口", url:"https://poizon.jobs.feishu.cn/", note:"公开职位数据可读时采集；登录或验证限制不绕过。" },
  { name:"网易", short:"网易", logo:"https://campus.game.163.com/favicon.ico", level:"B", status:"游戏校招公开", url:"https://campus.game.163.com/", note:"网易游戏不同事业群需单独标注，产品策划与内容策划分开。" },
  { name:"Bilibili", short:"B站", logo:"https://jobs.bilibili.com/favicon.ico", level:"C", status:"接口访问受限", url:"https://jobs.bilibili.com/campus/", note:"官方页面可确认，但职位接口当前要求 AppKey，不绕过限制。" },
  { name:"米哈游", short:"米哈游", logo:"https://join.mihoyo.com/favicon.ico", level:"B", status:"校招与社招公开", url:"https://join.mihoyo.com/", note:"官网公开招聘项目；职位为 0 时如实记录，不推断岗位。" },
  { name:"DeepSeek", short:"DS", logo:"https://talent.deepseek.com/favicon.ico", level:"A", status:"官方公开职位数据脚本", url:"https://talent.deepseek.com/", note:"专用适配器读取官方页面公开职位对象，可核验单岗原文和岗位 ID。" },
  { name:"Kimi（月之暗面）", short:"Kimi", logo:"https://careers.kimi.com/favicon.ico", level:"B", status:"官方品牌页 + 投递入口", url:"https://careers.kimi.com/campus", note:"品牌页可确认产品与用户运营方向；职责未公开时不扩写技术要求。" },
  { name:"智谱AI", short:"智谱", logo:"https://www.zhipuai.cn/favicon.ico", level:"A", status:"官方招聘方向公开", url:"https://www.zhipuai.cn/zh/joinus", note:"官网公开产品/项目经理社招和运营校招方向，逐字保留现有职责。" },
];

export const verifiedJobs: JobRecord[] = [
  {
    id:"baidu-ai-pm-2027", company:"百度", title:"AI产品经理", family:"AI产品", track:"2027校招", location:"北京", date:"2026-07-21",
    sourceTier:"S｜官方职位", sourceUrl:"https://talent.baidu.com/jobs/list?recommendCode=ISKJ1S", status:"在招",
    summary:"负责 AI/大模型产品规划、设计与迭代，推动 AI 能力在真实产品场景落地，并用用户与市场数据驱动增长。",
    skills:["用户需求","产品规划","跨团队协作","数据分析","指标增长"], ai:["大模型应用","AI产品思维","人机协作","AI工具"],
    evidence:["负责AI/大模型方向产品的规划、设计与迭代","探索人机协作的最优交互模式","善用AI工具提升工作效率与产品创新能力"],
  },
  {
    id:"baidu-pstar-2027", company:"百度", title:"P-STAR产培生计划", family:"AI产品/运营", track:"2027校招·人才计划", location:"上海", date:"2026-07-20",
    sourceTier:"S｜官方职位", sourceUrl:"https://talent.baidu.com/jobs/list", status:"在招",
    summary:"面向产品与运营校招生的专项培养计划，覆盖 AI 新搜索、智能体、多模态、数字人电商和 AI 健康等方向。",
    skills:["业务理解","产品运营","导师项目实践","跨业务视野"], ai:["智能体","多模态","AI搜索","数字人"],
    evidence:["寻找最具潜力的产品/运营校招生","新搜索——智能体、多模态等方向","深度参与核心业务/AI前沿业务"],
  },
  {
    id:"baidu-mt-2027", company:"百度", title:"2027管培生", family:"管培生", track:"2027校招·管培生", location:"北京", date:"2026-07-21",
    sourceTier:"S｜官方职位", sourceUrl:"https://talent.baidu.com/jobs/list?recommendCode=ISKJ1S", status:"在招",
    summary:"在产品、运营、战略等方向轮岗，参与大模型与生成式 AI 的业务应用，并培养商业化、战略和领导力。",
    skills:["轮岗业务理解","商业化思维","战略思维","领导力","团队协作"], ai:["生成式AI","大模型商业化","AI应用创新"],
    evidence:["参与大模型、生成式AI等前沿技术的应用与创新","探索大模型在商业化场景中的落地应用","培养从技术、产品到商业的全局思维"],
  },
  {
    id:"alibaba-pm-intern-2027", company:"阿里巴巴", title:"产品经理", family:"产品经理", track:"2027实习生", location:"北京 / 杭州 / 上海", date:"2026-03-11",
    sourceTier:"S｜官方职位", sourceUrl:"https://campus-talent.alibaba.com/campus/position/199903220012?deptCodes=GR41YI", status:"在招",
    summary:"从用户研究和行为分析出发定义产品价值，完成原型与 PRD，协同研发、设计、运营交付，并建立指标体系持续优化。",
    skills:["用户研究","需求分析","原型设计","PRD","数据分析","跨团队推动"], ai:[],
    evidence:["挖掘用户真实痛点及需求，定义出核心产品价值","产出高质量需求文档（PRD）","建立数据指标体系，监控产品表现"],
  },
  {
    id:"bytedance-douyin-pm", company:"字节跳动", title:"抖音平台产品经理", family:"用户产品", track:"校园招聘", location:"以官方详情为准", date:"2026-04核验",
    sourceTier:"S｜官方职位页", sourceUrl:"https://jobs.bytedance.com/campus/position/7475609906885839112/detail", status:"待复核",
    summary:"官方职位页已确认标题与校园招聘属性；当前公开索引未完整呈现职责，不参与能力频率统计。",
    skills:[], ai:[], evidence:["官方职位页标题：抖音平台产品经理"],
  },
  {
    id:"bytedance-commercial-ops", company:"字节跳动", title:"产品运营-商业化", family:"商业化运营", track:"校园招聘", location:"以官方详情为准", date:"2026-05核验",
    sourceTier:"S｜官方职位页", sourceUrl:"https://jobs.bytedance.com/campus/position/7531294244171516168/detail", status:"待复核",
    summary:"官方职位页已确认标题与校园招聘属性；职责未完整公开前不生成能力推断。",
    skills:[], ai:[], evidence:["官方职位页标题：产品运营-商业化"],
  },
  {
    id:"jd-pop-ops", company:"京东", title:"POP运营岗", family:"商家运营", track:"社会招聘", location:"北京", date:"2026-04-18",
    sourceTier:"S｜官方职位列表", sourceUrl:"https://zhaopin.jd.com/", status:"待复核",
    summary:"京东官方热招列表公开该岗位标题、职类、地点与发布时间；详情尚待源站同步，因此不参与能力统计。",
    skills:[], ai:[], evidence:["职位名称：POP运营岗","职位类别：运营类","工作地点：北京市"],
  },
  {
    id:"netease-games-2027", company:"网易", title:"网易游戏（互娱）2027校园招聘", family:"产品策划/运营", track:"2027校招·招聘项目", location:"广州 / 上海 / 杭州", date:"2026-07-21",
    sourceTier:"A｜官方投递入口+高校公告", sourceUrl:"https://campus.game.163.com/", status:"招聘项目",
    summary:"官方投递项目面向 2027 届毕业生，开放策划、运营、PM 等多类岗位；具体单岗要求以官方职位详情为准。",
    skills:["游戏理解","产品策划","长期运营"], ai:[], evidence:["开放岗位：策划 / 技术 / 美术 / 测试 / 用户体验 / 市场 / 运营 / PM 等多类岗位"],
  },
  {
    id:"DeepSeek-e8f2004c-6599-42cd-b587-176ffc3ff1a3", company:"DeepSeek", title:"AI 产品经理", family:"AI产品/运营", track:"实习 / 社会招聘", location:"北京海淀 / 杭州拱墅", date:"2026-08-21",
    sourceTier:"S｜DeepSeek 官方招聘", sourceUrl:"https://talent.deepseek.com/job/e8f2004c-6599-42cd-b587-176ffc3ff1a3", status:"在招",
    summary:"把前沿模型能力转化为真实产品，并分别负责 AI 产品与 Agent Harness 的路线、指标、用户反馈和模型协同。",
    skills:["产品规划","用户洞察","数据分析","项目管理"], ai:["Agent","KV Cache","Tool Use","Planning","MCP","Memory","Subagent","Multi-Agent"],
    evidence:["招聘方向 【实习/全职】 ： AI 产品方向、Agent Harness 产品方向","是 AI 产品深度用户，对模型能力边界、不同产品的体验差异和用户场景有真实体感","能够使用 vibe coding 写代码，不一定需要技术背景","理解 LLM API、KV Cache、Agent Loop、Tool Use、Reasoning、Planning、Skills、MCP、Memory、Subagent、Multi-Agent 等相关概念"],
  },
  {
    id:"Kimi-campus-product-manager", company:"Kimi（月之暗面）", title:"产品经理", family:"AI产品/运营", track:"校园招聘 / 实习", location:"以官方投递页为准", date:"2026-08-21",
    sourceTier:"S｜Kimi 官方校园招聘", sourceUrl:"https://careers.kimi.com/campus", status:"在招",
    summary:"月之暗面官方校园招聘公开的产品经理方向；完整职责未公开时不扩写技术栈。", skills:["产品规划"], ai:["AGI"],
    evidence:["月之暗面 Moonshot AI 校园招聘页，汇总 Kimi 实习与校招岗位，欢迎有志于 AGI 的人才加入。","查看产品经理详情"],
  },
  {
    id:"智谱AI-campus-operations", company:"智谱AI", title:"运营（校招）", family:"AI产品/运营", track:"校园招聘", location:"深圳 / 上海 / 杭州 / 成都 / 北京 / 吉隆坡", date:"2026-08-21",
    sourceTier:"S｜智谱AI 官方招聘", sourceUrl:"https://www.zhipuai.cn/zh/joinus", status:"在招",
    summary:"结合大模型技术优势，参与设计创新的 AI 解决方案。", skills:["业务抽象","解决方案设计"], ai:["大模型","AI解决方案"],
    evidence:["运营（校招）","结合大模型技术优势，参与设计创新的AI解决方案"],
  },
];

export type KnowledgeCard = {
  id:string; title:string; level:string; minutes:number; relevance:number; desc:string;
  concept:string; mechanism:string; productUse:string; mentalModel:string;
  jdSignal:string; project:string; resumeProof:string; source:string; tags:string[];
};

const tencentWorkBuddy = "https://join.qq.com/post_detail.html?postid=1285066789650506781";

export const knowledgeCards: KnowledgeCard[] = [
  { id:"transformer", title:"Transformer 与自回归生成", level:"底层必修", minutes:28, relevance:100,
    desc:"从 Token 到下一个 Token：理解模型为什么会生成、为什么会忘、为什么同一提示会得到不同答案。",
    concept:"Transformer 是用注意力机制处理 Token 序列的模型架构；自回归生成指模型每一步预测下一个 Token，再把结果接回输入继续预测。它不是在数据库里取出完整答案。",
    mechanism:"Tokenizer 把文本切成 Token；Attention 计算当前 Token 应关注哪些历史信息；位置编码保留顺序；KV Cache 复用历史注意力计算来加速生成；temperature、top-p 等采样参数控制确定性与多样性。",
    productUse:"产品经理要能判断长上下文、首字延迟、输出随机性、成本和质量之间的取舍。例如对合同审阅提高确定性，对创意脑暴允许更高多样性，并用实验验证而非凭感觉调参。",
    mentalModel:"把模型想成一位只会逐词续写、但读过大量资料的同事：上下文是桌面，Token 是桌面面积，Attention 是视线，KV Cache 是已经做好的读书笔记。",
    jdSignal:"腾讯 WorkBuddy 岗位明确要求理解 Transformer、自回归生成，以及 Attention、位置编码、KV Cache、Tokenizer、采样策略对输出的实际影响。",
    project:"调用同一模型完成 30 个固定任务，只改变上下文长度、temperature 与 top-p；记录成功率、延迟、Token 成本和失败类型，给出一页参数策略。",
    resumeProof:"写明模型、任务集规模、参数变量、评测指标及变化，例如：30 题准确率、P95 延迟和单次成本，而不是只写“熟悉大模型”。", source:tencentWorkBuddy, tags:["Attention","位置编码","KV Cache","Tokenizer","采样"] },
  { id:"context", title:"上下文工程与预算分配", level:"Agent 核心", minutes:32, relevance:100,
    desc:"决定哪些信息进入上下文、放在哪里、何时压缩或截断；这直接影响长任务完成率。",
    concept:"上下文工程不是把资料越塞越多，而是在有限窗口内组织系统指令、用户目标、历史对话、工具结果、记忆和中间状态。预算分配就是给这些信息分配 Token 空间与优先级。",
    mechanism:"常见链路是分层→过滤→排序→压缩→拼装→超限截断。关键风险包括重要约束被截断、重复信息挤占预算、工具噪声污染以及旧状态覆盖新事实。",
    productUse:"非技术岗要能定义信息优先级、不同任务模板、截断规则和可观测指标，并从 badcase 反推究竟是模型能力、上下文缺失还是编排错误。",
    mentalModel:"像给出差同事装一个登机箱：证件和目标必须保留，衣服可压缩，过期小票应丢弃；箱子更大不代表整理得更好。",
    jdSignal:"WorkBuddy 正从单轮助手转向长程 Agent；官方岗位把上下文分层、过滤、压缩和预算分配列为可独立负责的核心工作。",
    project:"为“行业研究 Agent”设计 8,000 Token 预算表，模拟 20 个长任务，标注每次失败对应的缺失信息与压缩策略，再做前后对照。",
    resumeProof:"展示预算表、20 个 badcase 分类、策略版本及长任务成功率变化；说明哪些内容被保留、压缩或淘汰。", source:tencentWorkBuddy, tags:["分层","过滤","压缩","截断","Token 预算"] },
  { id:"memory", title:"记忆机制：写入、召回、过期与冲突", level:"Agent 核心", minutes:30, relevance:99,
    desc:"让 Agent 在多轮和跨会话中保留真正有用的信息，同时避免错误记忆越积越多。",
    concept:"短期记忆保存当前任务状态，长期记忆保存跨会话稳定事实。完整机制至少包含写入条件、存储结构、召回策略、置信度、过期规则和冲突处理。",
    mechanism:"系统从对话抽取候选记忆，去重并带来源写入；新任务按相关性、时间和权限召回；新旧事实冲突时保留版本或请求确认，敏感信息还要有删除与隔离能力。",
    productUse:"产品岗需要定义“什么值得记、何时提醒、用户如何查看和纠错”；运营岗可用记忆做用户分层和服务连续性，但不能把推断当事实。",
    mentalModel:"记忆系统像 CRM：不是保存所有聊天，而是保存带来源、时间、置信度且可修订的关键事实。",
    jdSignal:"WorkBuddy 官方岗位明确要求记忆写入、召回、过期机制，并要求理解短期/长期记忆的存储、召回与冲突处理。",
    project:"设计个人求职 Agent 的记忆 Schema，准备 50 条含冲突与过期信息的测试集，测量正确召回率、误召回率和冲突处理成功率。",
    resumeProof:"写清记忆字段、测试集规模、三项指标、隐私边界，以及迭代后误召回率如何变化。", source:tencentWorkBuddy, tags:["短期记忆","长期记忆","召回","过期","冲突"] },
  { id:"planning", title:"任务规划、ReAct 与 Subagent", level:"Agent 核心", minutes:34, relevance:99,
    desc:"把模糊目标拆成可执行步骤，在行动—观察—修正中完成长程任务，并决定何时交给子 Agent。",
    concept:"ReAct 让模型在推理与行动之间循环；Plan-and-Execute 先生成计划再逐步执行；Subagent 是为特定子任务配置独立上下文或工具的执行单元。",
    mechanism:"规划器生成步骤，执行器调用工具，观察结果写回状态，反思器判断重试、改路或结束。难点是收敛：避免无限循环、重复调用、子任务冲突与错误累积。",
    productUse:"产品经理要定义任务状态机、停止条件、人工接管点、失败恢复和子 Agent 边界；运营可把复杂 SOP 变成可观测工作流。",
    mentalModel:"像项目经理带多个专员：先拆 WBS，再分工，每步验收；不是让所有人同时自由发挥。",
    jdSignal:"WorkBuddy 岗位明确列出 ReAct、Plan-and-Execute、任务规划、反思收敛和 Subagent 协作。",
    project:"做一个竞品研究 Agent：搜索、证据核验、归类、报告分别由不同步骤/子 Agent 负责；用 30 个任务统计完成率、平均步数、循环率和人工接管率。",
    resumeProof:"写明工作流图、工具数、任务数、失败分类、停止条件及成功率变化；避免只写“搭建多 Agent”。", source:tencentWorkBuddy, tags:["ReAct","Plan-and-Execute","反思","Subagent","收敛"] },
  { id:"tools", title:"Function Calling、Skill 与 MCP", level:"系统设计", minutes:30, relevance:98,
    desc:"理解模型如何可靠调用搜索、数据库和业务系统，以及工具、Skill、MCP 各自的边界。",
    concept:"Function Calling 用结构化参数描述一次工具调用；Skill 封装可复用的方法、规则与资源；MCP 是连接模型客户端与外部工具/数据的开放协议。",
    mechanism:"模型根据工具 Schema 选择名称和参数，宿主校验权限并执行，再把结果返回模型。可靠性取决于 Schema、鉴权、幂等、超时、重试和审计，而不只是提示词。",
    productUse:"非技术产品岗负责定义工具颗粒度、权限确认、错误文案、关键动作复核与成功指标；策略运营可维护 Skill SOP 和异常处理规则。",
    mentalModel:"Function Calling 是一张标准工单，Skill 是岗位 SOP，MCP 是统一插座；模型只负责决定何时填工单。",
    jdSignal:"WorkBuddy 岗位把工具与 Skill 编排列为核心职责，并要求理解 Function Calling 协议与 MCP 边界。",
    project:"为招聘 Agent 设计 5 个工具 Schema，加入权限、超时、重复提交和错误参数测试，完成 40 条工具调用评测。",
    resumeProof:"展示 Schema、权限矩阵、40 条用例、参数正确率和任务成功率；说明一次高风险动作如何人工确认。", source:tencentWorkBuddy, tags:["Function Calling","Skill","MCP","权限","幂等"] },
  { id:"evaluation", title:"Badcase、评测集与指标口径", level:"产品硬功", minutes:35, relevance:100,
    desc:"把“模型感觉不错”变成可复现、可归因、可训练的质量标准。",
    concept:"评测集是有代表性的任务与期望结果；指标口径规定怎样算对；badcase 是失败样本及其根因标签。三者共同连接产品目标、算法实验和上线决策。",
    mechanism:"从线上失败采样→脱敏→分层→标注→建立规则/模型裁判→回归测试。指标应同时覆盖任务成功、事实性、安全、延迟、成本和用户体验。",
    productUse:"产品/策略岗要把业务目标翻译为可标注标准，处理指标互相冲突，并识别失败来自数据、模型、上下文、工具还是交互。",
    mentalModel:"像驾照考试：题库要覆盖真实路况，评分规则要一致，每次改车后都重新路考。",
    jdSignal:"WorkBuddy 岗位要求从线上 badcase 定位根因、提出假设并设计实验，同时独立负责评测体系与后训练数据标准。",
    project:"构建 100 条 Agent 长任务评测集，制定 6 类失败标签与双人标注规范；对两个版本做盲测并输出上线建议。",
    resumeProof:"必须写任务数、来源、标注一致性、指标定义、对照版本和效果变化；这比“优化体验”有说服力。", source:tencentWorkBuddy, tags:["Badcase","评测集","指标口径","归因","回归测试"] },
  { id:"posttraining", title:"SFT、LoRA、DPO / GRPO 与持续预训练", level:"模型协作", minutes:42, relevance:100,
    desc:"区分“教模型完成任务”“低成本改参数”“对齐偏好”和“补充领域知识”，知道项目该选哪条路。",
    concept:"SFT 用输入—理想输出示例监督训练；LoRA 只训练少量低秩参数以降低成本；DPO 用偏好对直接优化倾向；GRPO 属于强化学习式方法；持续预训练让模型继续学习领域语料分布。",
    mechanism:"先定义目标与基线，再构造/清洗数据、训练、离线评测和线上验证。训练可能提升目标任务，却损害通用能力，因此需要回归集、数据版本和可复现实验。",
    productUse:"非技术岗不必手写训练框架，但必须能定义数据标准、偏好对、奖励/评测口径，判断应先改 Prompt/RAG/工作流还是值得训练。",
    mentalModel:"SFT 像看标准答案练习；LoRA 像加装轻量专用插件；DPO 像比较两份答案选更好；持续预训练像先补一门领域通识课。",
    jdSignal:"腾讯岗位明确认可 SFT、LoRA、DPO/GRPO、持续预训练、训练数据构造与合成数据经历，并要求简历说明基座模型、数据规模、训练方式、评测和效果。",
    project:"选开源小模型和单一业务任务，制作 500—2,000 条合规数据做 LoRA/SFT；保留基线和回归集，报告准确率、幻觉率、成本及退化项。",
    resumeProof:"按五要素书写：基座模型、数据规模、训练方式、评测方法、效果变化；只做 API Demo、提示词或低代码流程不等同训练经验。", source:tencentWorkBuddy, tags:["SFT","LoRA","DPO","GRPO","持续预训练"] },
  { id:"rag", title:"RAG 与错误累积", level:"知识系统", minutes:32, relevance:96,
    desc:"检索只是第一步；召回、重排、切片、引用和生成中任一错误都会沿链路放大。",
    concept:"RAG 先从外部知识库检索证据，再让模型基于证据回答。Embedding 把语义映射为向量，召回找候选，重排选最相关片段。",
    mechanism:"文档解析→切片→向量化→召回→重排→上下文拼装→生成→引用。需要分别测检索命中率和最终回答，而不是用一个总分掩盖根因。",
    productUse:"产品岗负责知识范围、更新时效、无答案策略与引用体验；运营岗可维护知识质量、热点缺口和 badcase 闭环。",
    mentalModel:"像研究员写报告：找错资料时，文笔再好也只会把错误说得更顺。",
    jdSignal:"WorkBuddy 要求理解 RAG 错误累积，以及上下文窗口、记忆和工具系统之间的取舍。",
    project:"用 50 份公开文档建立小型 RAG，设计 80 个问题，分别测 Recall@K、引用正确率、答案支持率与无答案拒答率。",
    resumeProof:"写明文档量、切片策略、Embedding/重排方案、四项指标及改动前后结果。", source:tencentWorkBuddy, tags:["Embedding","召回","重排","引用","错误累积"] },
  { id:"python_sql", title:"Python、SQL 与实验数据闭环", level:"动手门槛", minutes:36, relevance:98,
    desc:"不是转岗写后端，而是能独立处理数据、搭评测脚本、做原型，并与算法工程师讲同一种证据语言。",
    concept:"SQL 用来筛选、聚合和验证业务数据；Python 适合调用模型 API、清洗样本、批量评测和快速原型。核心价值是缩短从 badcase 到结论的距离。",
    mechanism:"用 SQL 定义样本和指标口径，Python 执行 API、规则或模型裁判，把结果写回表格，再做分层分析和显著性检查。全流程应记录版本与随机参数。",
    productUse:"产品/运营可以自己回答“哪类用户失败最多”“改版是否真实提升”，并交付算法可直接复用的数据集与评测脚本。",
    mentalModel:"SQL 是从仓库准确取货，Python 是自动化流水线；两者让你不必每个问题都排队等开发。",
    jdSignal:"WorkBuddy 岗位要求会 Python、熟练 SQL，能独立搭建数据处理、评测脚本和产品原型。",
    project:"从公开数据生成 200 条评测样本，用 Python 批量调用模型，用 SQL 汇总不同任务/版本的成功率、延迟和成本。",
    resumeProof:"附可运行仓库、数据字典、200 条样本、SQL 指标口径和可复现命令；简历写清你独立完成的部分。", source:tencentWorkBuddy, tags:["Python","SQL","API","评测脚本","可复现"] },
];

export const reviewIntervals = [1, 2, 4, 7, 15, 30];
