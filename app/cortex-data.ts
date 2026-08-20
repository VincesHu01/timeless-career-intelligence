export type CompanySource = {
  name: string;
  short: string;
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
  track: string;
  location: string;
  date: string;
  sourceTier: string;
  sourceUrl: string;
  summary: string;
  skills: string[];
  ai: string[];
  evidence: string[];
  status: "在招" | "待复核" | "招聘项目";
};

export const companySources: CompanySource[] = [
  { name:"字节跳动", short:"字节", level:"A", status:"公开职位页", url:"https://jobs.bytedance.com/campus/", note:"校招、实习与社招需分开采集；职位 ID 可用于版本追踪。" },
  { name:"阿里巴巴", short:"阿里", level:"A", status:"集团校招公开", url:"https://campus-talent.alibaba.com/", note:"需保留淘天、阿里云、钉钉等招聘业务归属。" },
  { name:"腾讯", short:"腾讯", level:"B", status:"动态详情页", url:"https://careers.tencent.com/zh-cn/", note:"搜索与详情页公开，但部分字段依赖动态接口。" },
  { name:"美团", short:"美团", level:"B", status:"项目分类公开", url:"https://zhaopin.meituan.com/", note:"区分日常实习、转正实习、校招、北斗计划与社招。" },
  { name:"快手", short:"快手", level:"C", status:"JavaScript 站点", url:"https://zhaopin.kuaishou.cn/", note:"无法稳定读取时仅保留官方链接并进入人工校验。" },
  { name:"百度", short:"百度", level:"A", status:"结构清晰", url:"https://talent.baidu.com/jobs/", note:"公开岗位列表可按招聘项目、职类和城市核验。" },
  { name:"携程", short:"携程", level:"C", status:"多入口待校验", url:"https://job.ctrip.com/", note:"官网、官方公告与公众号需合并去重，旧页面不作当前依据。" },
  { name:"京东", short:"京东", level:"A", status:"公开职位列表", url:"https://zhaopin.jd.com/", note:"官方“运营类”较宽，需二次排除销售、运维及内容岗位。" },
  { name:"拼多多", short:"拼多多", level:"B", status:"校招项目公开", url:"https://careers.pddglobalhr.com/", note:"校招、实习、人才专项与管培生需要分别标注。" },
  { name:"得物", short:"得物", level:"C", status:"飞书招聘入口", url:"https://poizon.jobs.feishu.cn/", note:"先确认公开页面和使用条款，无法稳定访问时转人工录入。" },
  { name:"网易", short:"网易", level:"B", status:"游戏校招公开", url:"https://campus.game.163.com/", note:"网易游戏不同事业群需单独标注，产品策划与内容策划分开。" },
  { name:"Bilibili", short:"B站", level:"C", status:"接口访问受限", url:"https://jobs.bilibili.com/campus/", note:"官方页面可确认，但职位接口当前要求 AppKey，不绕过限制。" },
  { name:"米哈游", short:"米哈游", level:"B", status:"校招与社招公开", url:"https://join.mihoyo.com/", note:"官网公开招聘项目；职位为 0 时如实记录，不推断岗位。" },
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
];

export const knowledgeCards = [
  { id:"agent", title:"Agent 与工具调用", level:"入门", minutes:12, relevance:94, desc:"理解大模型如何拆解任务、调用工具、读取反馈并继续行动。", why:"百度 P-STAR 明确覆盖智能体方向；资深 AI 岗位进一步要求规划、工具调用、记忆与评测。", source:"https://talent.baidu.com/jobs/list?projectType=3&recruitType=GRADUATE", tags:["规划","工具调用","记忆"] },
  { id:"evaluation", title:"AI 效果评测", level:"核心", minutes:15, relevance:91, desc:"把“感觉回答不错”变成可重复的任务集、指标与失败案例。", why:"AI 产品需要同时平衡效果、延迟、成本和用户体验，评测是非技术产品经理的关键接口能力。", source:"https://talent.baidu.com/jobs/list?projectType=3&recruitType=GRADUATE", tags:["评测集","成功率","Bad Case"] },
  { id:"rag", title:"RAG 检索增强生成", level:"进阶", minutes:18, relevance:86, desc:"先从可信知识库检索相关内容，再让大模型基于证据生成答案。", why:"RAG 能降低知识型产品的事实错误，也是从“会用模型”到“会设计可靠系统”的分界线。", source:"https://talent.baidu.com/jobs/list?projectType=3&recruitType=GRADUATE", tags:["Embedding","召回","引用"] },
  { id:"prompt", title:"Prompt 与结构化输出", level:"入门", minutes:10, relevance:83, desc:"通过角色、约束、示例和输出 Schema，提高模型结果的稳定性。", why:"可直接用于岗位归类、用户研究整理、竞品分析与运营工作流，是低门槛的项目加分项。", source:"https://www.volcengine.com/docs/82379/1795150", tags:["指令","Schema","Few-shot"] },
];

export const reviewIntervals = [1, 2, 4, 7, 15, 30];
