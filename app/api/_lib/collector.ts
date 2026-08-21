import { and, eq, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { crawlRuns, jobSnapshots, jobs, refreshRequests } from "../../../db/schema";

export const SOURCE_REGISTRY = {
  "字节跳动": "https://jobs.bytedance.com/campus/position",
  "阿里巴巴": "https://campus-talent.alibaba.com/campus/position-list",
  "腾讯": "https://careers.tencent.com/zh-cn/search.html",
  "美团": "https://zhaopin.meituan.com/web/position",
  "快手": "https://zhaopin.kuaishou.cn/recruit/e/#/official/social/",
  "百度": "https://talent.baidu.com/jobs/list",
  "携程": "https://job.ctrip.com/",
  "京东": "https://zhaopin.jd.com/web/job/job-list",
  "拼多多": "https://careers.pddglobalhr.com/jobs",
  "得物": "https://poizon.jobs.feishu.cn/index",
  "网易": "https://campus.game.163.com/position",
  "Bilibili": "https://jobs.bilibili.com/campus/positions",
  "米哈游": "https://join.mihoyo.com/#/campus/position-list",
  "DeepSeek": "https://talent.deepseek.com/",
  "Kimi（月之暗面）": "https://careers.kimi.com/campus",
  "智谱AI": "https://www.zhipuai.cn/zh/joinus",
} as const;

export type CompanyName = keyof typeof SOURCE_REGISTRY;

type ExtractedJob = {
  sourceJobId?: string;
  title?: string;
  location?: string;
  recruitmentTrack?: string;
  experienceLevel?: string;
  summary?: string;
  skills?: string[];
  aiSkills?: string[];
  bonusSignals?: string[];
  evidence?: string[];
  technicalRequirements?: string;
  experienceRequirements?: string;
  softRequirements?: string;
  sourceUrl?: string;
};

type TencentSearchItem = { postId?:string; positionTitle?:string; projectName?:string };
type TencentDetail = { postId?:string; title?:string; desc?:string; request?:string; workCityList?:string[]; projectName?:string; recruitLabelName?:string };

const includedTitle = /(产品经理|产品策划|产品运营|AI产品运营|策略运营|电商运营|品类运营|商家运营|行业运营|商业化运营|用户运营|增长运营|平台运营|生态运营|运营策略|运营（|运营\(|运营岗|管培生)/i;
const excludedTitle = /(新媒体|内容运营|内容编辑|短视频运营|直播运营|社交媒体|小红书运营|公众号运营|文案运营|社区内容)/i;

function normalizeSecret(value: string | undefined) {
  return value?.trim().replace(/^(["'])(.*)\1$/, "$2").replace(/^Bearer\s+/i, "").trim();
}

function normalizeModelId(value: string | undefined) {
  return value?.trim().replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g, "-");
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function htmlToEvidenceText(html: string) {
  const structured = [...html.matchAll(/<(?:script|meta)[^>]+(?:type=["']application\/(?:ld\+json|json)["']|content=["']([^"']+)["'])[^>]*>([\s\S]*?)<\/script>|<(?:meta|[^>]+)[^>]+(?:aria-label|title|content)=["']([^"']+)["'][^>]*>/gi)]
    .flatMap((match) => [match[1], match[2], match[3]])
    .filter(Boolean)
    .join(" ");
  return normalizeText(
    `${html} ${structured}`
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;|&#160;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;|&#34;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'"),
  );
}

function classifySourceError(status: number) {
  if (status === 404) return new Error("官方入口已迁移或配置失效（HTTP 404）；这不代表岗位不存在，已停止用该地址判断岗位状态");
  if (status === 412) return new Error("源站要求浏览器会话或前置校验（HTTP 412）；这不代表禁止采集或没有岗位，等待官方公开接口适配");
  return new Error(`官方源站返回 HTTP ${status}`);
}

function compactTag(value: string) {
  return normalizeText(value).slice(0, 32);
}

function uniqueStrings(values: unknown, max: number) {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.filter((item): item is string => typeof item === "string").map(compactTag).filter(Boolean))].slice(0, max);
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function roleFamily(title: string) {
  if (/AI|智能体|大模型|AIGC|Agent/i.test(title)) return "AI产品/运营";
  if (/广告|商业化/.test(title)) return "广告商业化";
  if (/电商|品类|商家|行业/.test(title)) return "电商经营";
  if (/策略|增长/.test(title)) return "策略增长";
  if (/管培|人才计划/.test(title)) return "人才计划";
  if (/运营/.test(title)) return "产品运营";
  return "通用产品";
}

function roleType(title: string) {
  return /运营/.test(title) ? "运营岗" : "产品岗";
}

const skillDictionary = ["用户研究","需求分析","产品规划","数据分析","指标体系","跨团队协作","业务抽象","项目管理","商业化","增长","行业研究","竞品分析"];
const aiDictionary = ["Transformer","自回归生成","Attention","位置编码","KV Cache","Tokenizer","采样策略","上下文","记忆","ReAct","Plan-and-Execute","Function Calling","Skill","Subagent","Multi-Agent","MCP","RAG","SFT","LoRA","DPO","GRPO","持续预训练","合成数据","评测集","Python","SQL","Agent","大模型"];

function matchingTerms(text: string, dictionary: string[], max = 10) {
  return dictionary.filter((term) => text.toLowerCase().includes(term.toLowerCase())).slice(0, max);
}

function evidenceSentences(text: string, max = 5) {
  return text.split(/[。\n]/).map(normalizeText).filter((item) => item.length >= 12).slice(0, max);
}

function requirementSection(text: string, pattern: RegExp, max = 8) {
  return text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .split(/\n+|(?<=[。；])/)
    .map(normalizeText)
    .filter((item) => item.length >= 8 && pattern.test(item))
    .slice(0, max)
    .join("\n");
}

async function fetchTencentJobs() {
  const searchResponse = await fetch("https://join.qq.com/api/v1/position/searchPosition", {
    method:"POST",
    headers:{ "Content-Type":"application/json", Accept:"application/json", "User-Agent":"TimelessCareerResearch/1.0 (+public evidence monitor)" },
    body:JSON.stringify({ keyword:"产品", pageIndex:1, pageSize:1000, workCityList:[], recruitCityList:[], bgList:[], positionFidList:[] }),
    signal:AbortSignal.timeout(20_000),
  });
  if (!searchResponse.ok) throw new Error(`腾讯官方搜索接口返回 HTTP ${searchResponse.status}`);
  const search = await searchResponse.json() as { data?:{ positionList?:TencentSearchItem[] } };
  const positions = (search.data?.positionList || [])
    .filter((item) => item.postId && includedTitle.test(item.positionTitle || "") && !excludedTitle.test(item.positionTitle || ""))
    .sort((a,b) => Number(b.postId === "1285066789650506781") - Number(a.postId === "1285066789650506781"))
    .slice(0, 36);
  const details = await Promise.all(positions.map(async (position) => {
    const url = `https://join.qq.com/api/v1/jobDetails/getJobDetailsByPostId?postId=${position.postId}`;
    try {
      const response = await fetch(url, { headers:{ Accept:"application/json", "User-Agent":"TimelessCareerResearch/1.0 (+public evidence monitor)" }, signal:AbortSignal.timeout(15_000) });
      if (!response.ok) return null;
      const payload = await response.json() as { data?:TencentDetail };
      return payload.data ? { ...payload.data, sourceUrl:`https://join.qq.com/post_detail.html?postid=${position.postId}` } : null;
    } catch { return null; }
  }));
  const valid = details.filter((item): item is TencentDetail & {sourceUrl:string} => Boolean(item?.title && item?.desc));
  const sourceText = valid.map((item) => `${item.title}\n${item.desc}\n${item.request || ""}`).join("\n");
  const candidates:ExtractedJob[] = valid.map((item) => {
    const fullText = `${item.desc || ""}\n${item.request || ""}`;
    const track = item.projectName || item.recruitLabelName || "未明示";
    return {
      sourceJobId:item.postId,
      title:item.title,
      location:item.workCityList?.join(" / ") || "以官方详情为准",
      recruitmentTrack:track,
      experienceLevel:/实习/.test(track) ? "在校生" : /应届|培训生|管培/.test(track) ? "应届生" : "未明示",
      summary:evidenceSentences(item.desc || "",1)[0] || item.title,
      skills:matchingTerms(fullText,skillDictionary),
      aiSkills:matchingTerms(fullText,aiDictionary),
      bonusSignals:evidenceSentences(item.request || "",2),
      evidence:evidenceSentences(fullText,5),
      technicalRequirements:requirementSection(item.request || "", /Transformer|Attention|位置编码|KV Cache|Tokenizer|采样|上下文|记忆|Agent|Skill|Subagent|MCP|RAG|SFT|LoRA|DPO|GRPO|预训练|Python|SQL|模型|算法|数据|评测/i),
      experienceRequirements:requirementSection(item.request || "", /经验|经历|项目|实习|训练|数据构造|评测集|基座模型|规模|效果/i),
      softRequirements:requirementSection(item.request || "", /沟通|协作|自驱|责任|学习|逻辑|洞察|表达|好奇|推动|抗压/i),
      sourceUrl:item.sourceUrl,
    };
  });
  return { sourceText, candidates, sourceUrl:"https://join.qq.com/" };
}

type DeepSeekJob = {
  id:string; title:string; functionName:string; locations:string[]; descriptionHtml:string; detailUrl:string; submitUrl:string;
};

async function fetchDeepSeekJobs() {
  const landingUrl = "https://talent.deepseek.com/";
  const landing = await fetch(landingUrl, { headers:{ Accept:"text/html", "User-Agent":"TimelessCareerResearch/1.1 (+public evidence monitor)" }, signal:AbortSignal.timeout(20_000) });
  if (!landing.ok) throw classifySourceError(landing.status);
  const html = await landing.text();
  const scriptPath = [...html.matchAll(/<script[^>]+src=["']([^"']*main\.[^"']+\.js)["']/gi)][0]?.[1];
  if (!scriptPath) throw new Error("DeepSeek 官方页结构已变化，未找到公开职位数据脚本");
  const scriptUrl = new URL(scriptPath, landing.url).toString();
  const bundleResponse = await fetch(scriptUrl, { headers:{ Accept:"application/javascript", Referer:landing.url, "User-Agent":"TimelessCareerResearch/1.1 (+public evidence monitor)" }, signal:AbortSignal.timeout(25_000) });
  if (!bundleResponse.ok) throw classifySourceError(bundleResponse.status);
  const bundle = await bundleResponse.text();
  const pattern = /\{"id":"[^"\\]+","title":"(?:\\.|[^"\\])*","functionName":"(?:\\.|[^"\\])*","locations":\[(?:"(?:\\.|[^"\\])*",?)*\],"descriptionHtml":"(?:\\.|[^"\\])*","detailUrl":"(?:\\.|[^"\\])*","submitUrl":"(?:\\.|[^"\\])*"\}/g;
  const publicJobs = (bundle.match(pattern) || []).flatMap((raw) => {
    try { return [JSON.parse(raw) as DeepSeekJob]; } catch { return []; }
  }).filter((job) => includedTitle.test(job.title) && !excludedTitle.test(job.title));
  const candidateTexts = publicJobs.map((job) => htmlToEvidenceText(job.descriptionHtml));
  const sourceText = publicJobs.map((job,index) => `${job.title} ${candidateTexts[index]}`).join(" ");
  const candidates:ExtractedJob[] = publicJobs.map((job,index) => {
    const text = candidateTexts[index];
    const track = /实习/.test(text) && /全职/.test(text) ? "实习 / 社会招聘" : /实习/.test(text) ? "日常实习" : /管培/.test(job.title) ? "管培生" : "社会招聘";
    return {
      sourceJobId:job.id,
      title:job.title,
      location:job.locations.join(" / ") || "以官方详情为准",
      recruitmentTrack:track,
      experienceLevel:/应届|校招/.test(text) ? "应届生" : /\d+\s*年/.test(text) ? text.match(/\d+\s*年[^，。；]{0,18}/)?.[0] : "未明示",
      summary:evidenceSentences(text,1)[0] || job.title,
      skills:matchingTerms(text,skillDictionary),
      aiSkills:matchingTerms(text,aiDictionary,16),
      bonusSignals:evidenceSentences(text.split(/加分项|优先/).slice(1).join(" "),2),
      evidence:evidenceSentences(text,5),
      technicalRequirements:requirementSection(text, /LLM|KV Cache|Agent|Tool Use|Reasoning|Planning|Skill|MCP|Memory|Subagent|Multi-Agent|模型|评测|训练|Prompt|Vibe Coding|代码|数据/i),
      experienceRequirements:requirementSection(text, /经验|经历|项目|深度使用|构建|生产|实习|全职/i),
      softRequirements:requirementSection(text, /沟通|协作|自驱|责任|学习|逻辑|洞察|表达|好奇|推动|审美/i),
      sourceUrl:`https://talent.deepseek.com/job/${job.id}`,
    };
  });
  return { sourceText, candidates, sourceUrl:landingUrl };
}

async function fetchKimiJobs() {
  const sourceUrl = "https://careers.kimi.com/campus";
  const response = await fetch(sourceUrl, { headers:{ Accept:"text/html", "User-Agent":"TimelessCareerResearch/1.1 (+public evidence monitor)" }, signal:AbortSignal.timeout(20_000) });
  if (!response.ok) throw classifySourceError(response.status);
  const sourceText = await response.text();
  const commonEvidence = "月之暗面 Moonshot AI 校园招聘页，汇总 Kimi 实习与校招岗位，欢迎有志于 AGI 的人才加入。";
  const candidates:ExtractedJob[] = [];
  if (sourceText.includes("查看产品经理详情")) candidates.push({
    sourceJobId:"campus-product-manager", title:"产品经理", location:"以官方投递页为准", recruitmentTrack:"校园招聘 / 实习", experienceLevel:"在校生 / 应届生",
    summary:"月之暗面官方校园招聘列出的产品经理方向；职责详情需进入官方投递页继续核验。", skills:["产品规划","用户研究"], aiSkills:["AGI"], evidence:[commonEvidence,"查看产品经理详情"], sourceUrl,
  });
  if (sourceText.includes("查看用户运营详情")) candidates.push({
    sourceJobId:"campus-user-operations", title:"用户运营", location:"以官方投递页为准", recruitmentTrack:"校园招聘 / 实习", experienceLevel:"在校生 / 应届生",
    summary:"月之暗面官方校园招聘列出的用户运营方向；职责详情需进入官方投递页继续核验。", skills:["用户运营"], aiSkills:["AGI"], evidence:[commonEvidence,"查看用户运营详情"], sourceUrl,
  });
  return { sourceText, candidates, sourceUrl };
}

async function fetchZhipuJobs() {
  const sourceUrl = "https://www.zhipuai.cn/zh/joinus";
  const response = await fetch(sourceUrl, { headers:{ Accept:"text/html", "User-Agent":"TimelessCareerResearch/1.1 (+public evidence monitor)" }, signal:AbortSignal.timeout(20_000) });
  if (!response.ok) throw classifySourceError(response.status);
  const sourceText = htmlToEvidenceText(await response.text());
  const candidates:ExtractedJob[] = [
    { sourceJobId:"social-product-project", title:"产品经理/项目经理（社招）", location:"深圳 / 上海 / 杭州 / 成都 / 北京 / 吉隆坡", recruitmentTrack:"社会招聘", experienceLevel:"未明示", summary:"负责项目计划、风险管理与质量管理等工作。", skills:["项目管理"], aiSkills:[], evidence:["产品经理/项目经理（社招）","项目计划、风险管理、质量管理等"], sourceUrl },
    { sourceJobId:"campus-operations", title:"运营（校招）", location:"深圳 / 上海 / 杭州 / 成都 / 北京 / 吉隆坡", recruitmentTrack:"校园招聘", experienceLevel:"应届生", summary:"结合大模型技术优势，参与设计创新的 AI 解决方案。", skills:["业务抽象"], aiSkills:["大模型","AI解决方案"], evidence:["运营（校招）","结合大模型技术优势，参与设计创新的AI解决方案"], sourceUrl },
  ];
  return { sourceText, candidates, sourceUrl };
}

async function fetchOfficialJobs(company: CompanyName) {
  if (company === "腾讯") return fetchTencentJobs();
  if (company === "DeepSeek") return fetchDeepSeekJobs();
  if (company === "Kimi（月之暗面）") return fetchKimiJobs();
  if (company === "智谱AI") return fetchZhipuJobs();
  return null;
}

function extractRecruitingWindows(text: string) {
  const needles = ["产品经理","产品策划","产品运营","策略运营","电商运营","品类运营","商家运营","行业运营","用户运营","增长运营","管培生"];
  const windows:string[] = [];
  for (const needle of needles) {
    let from = 0;
    while (windows.length < 24) {
      const index = text.indexOf(needle,from);
      if (index < 0) break;
      windows.push(text.slice(Math.max(0,index-700),Math.min(text.length,index+2600)));
      from = index+needle.length;
    }
  }
  return normalizeText(windows.join(" "));
}

async function fetchGenericOfficialPage(sourceUrl: string) {
  const response = await fetch(sourceUrl, {
    headers: { Accept:"text/html,application/xhtml+xml,application/json", "Accept-Language":"zh-CN,zh;q=0.9", "User-Agent":"TimelessCareerResearch/1.1 (+public evidence monitor)" },
    redirect:"follow",
    signal:AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw classifySourceError(response.status);
  const raw = await response.text();
  let sourceText = htmlToEvidenceText(raw);
  if (!includedTitle.test(sourceText)) {
    const scriptUrls = [...raw.matchAll(/<script[^>]+src=["']([^"']+\.js(?:\?[^"']*)?)["']/gi)]
      .map((match) => new URL(match[1],response.url).toString())
      .filter((url,index,list) => new URL(url).origin === new URL(response.url).origin && list.indexOf(url) === index)
      .slice(0,8);
    const bundles = await Promise.all(scriptUrls.map(async (url) => {
      try {
        const asset = await fetch(url,{ headers:{ Accept:"application/javascript", Referer:response.url, "User-Agent":"TimelessCareerResearch/1.1 (+public evidence monitor)" }, signal:AbortSignal.timeout(12_000) });
        if (!asset.ok) return "";
        const text = await asset.text();
        return text.length <= 1_500_000 ? extractRecruitingWindows(text) : "";
      } catch { return ""; }
    }));
    sourceText = normalizeText(`${sourceText} ${bundles.join(" ")}`);
  }
  return { sourceText, sourceUrl:response.url };
}

function parseModelJson(content: string) {
  const cleaned = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const parsed = JSON.parse(cleaned) as { jobs?: ExtractedJob[] } | ExtractedJob[];
  return Array.isArray(parsed) ? parsed : parsed.jobs ?? [];
}

async function extractJobs(company: CompanyName, sourceUrl: string, sourceText: string) {
  const key = normalizeSecret(process.env.ARK_API_KEY);
  const model = normalizeModelId(process.env.ARK_MODEL_ID);
  const base = (process.env.ARK_BASE_URL || "https://ark.cn-beijing.volces.com/api/v3").trim();
  if (!key || !model) throw new Error("方舟模型尚未配置");

  const prompt = `你是招聘数据抽取器。只允许从SOURCE原文抽取，不得补全、推断或改写事实。\n
目标公司：${company}\n
只保留产品经理/产品策划，以及产品运营、AI产品运营、策略运营、电商运营、品类运营、商家运营、行业运营、商业化运营、增长运营、平台/生态运营、管培生。\n
严格排除新媒体运营、内容运营、编辑、短视频/直播/社交媒体运营。\n
返回纯JSON：{"jobs":[{"sourceJobId":"原文ID或空串","title":"原文职位名","location":"原文地点或以官方详情为准","recruitmentTrack":"日常实习/暑期实习/校招/人才计划/管培生/社会招聘/未明示","experienceLevel":"原文经验要求或未明示","summary":"最多80字，仅概括原文","skills":["原文明示能力"],"aiSkills":["原文明示AI知识或技术"],"bonusSignals":["完整的原文明示优先项"],"technicalRequirements":"技术、AI知识和工具要求的完整原文段落；没有则空串","experienceRequirements":"项目、实习和工作经验要求的完整原文段落；没有则空串","softRequirements":"沟通、协作、自驱等软素质要求的完整原文段落；没有则空串","evidence":["2-5段SOURCE中逐字存在的完整短句"]}]}。三个 requirements 字段必须逐字复制 SOURCE，不得拼接不相邻片段；没有合格岗位则返回{"jobs":[]}。\n
SOURCE_URL: ${sourceUrl}\nSOURCE:\n${sourceText.slice(0, 60_000)}`;

  const response = await fetch(`${base.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "只做可追溯信息抽取。输出必须是合法JSON，不得使用Markdown。" },
        { role: "user", content: prompt },
      ],
      temperature: 0,
      max_tokens: 4000,
    }),
    signal: AbortSignal.timeout(55_000),
  });
  if (!response.ok) throw new Error(`方舟分析失败 HTTP ${response.status}`);
  const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("方舟未返回分析内容");
  return parseModelJson(content);
}

export async function runCompanyCollection(company: CompanyName, requestId?: number) {
  const db = getDb();
  const sourceUrl = SOURCE_REGISTRY[company];
  const [run] = await db.insert(crawlRuns).values({ company, status: "running" }).returning();

  try {
    const official = await fetchOfficialJobs(company);
    const generic = official ? null : await fetchGenericOfficialPage(sourceUrl);
    const sourceText = official?.sourceText || generic?.sourceText || "";
    if (sourceText.length < 200) throw new Error("官方页面是 JavaScript 空壳，尚未定位到其公开职位数据接口；这不代表没有岗位");

    const resolvedSourceUrl = official?.sourceUrl || generic?.sourceUrl || sourceUrl;
    const candidates = official?.candidates || await extractJobs(company, resolvedSourceUrl, sourceText);
    let accepted = 0;
    for (const candidate of candidates.slice(0, 40)) {
      const title = normalizeText(candidate.title || "");
      const evidence = uniqueStrings(candidate.evidence, 5);
      if (!title || !includedTitle.test(title) || excludedTitle.test(title)) continue;
      if (!sourceText.includes(title) || evidence.length < 2 || evidence.some((item) => !sourceText.includes(item))) continue;

      const location = normalizeText(candidate.location || "以官方详情为准");
      const recruitmentTrack = normalizeText(candidate.recruitmentTrack || "未明示");
      const sourceJobId = normalizeText(candidate.sourceJobId || "");
      const id = `${company}-${sourceJobId || stableHash(`${title}|${location}|${recruitmentTrack}`)}`;
      const skills = uniqueStrings(candidate.skills, 10);
      const aiSkills = uniqueStrings(candidate.aiSkills, 10);
      const bonusSignals = uniqueStrings(candidate.bonusSignals, 8);
      const verifiedLongText = (value: string | undefined) => {
        const normalized = normalizeText(value || "").slice(0, 6000);
        return normalized && sourceText.includes(normalized) ? normalized : "";
      };
      const contentHash = stableHash(JSON.stringify({ title, location, recruitmentTrack, evidence }));
      const values = {
        id,
        company,
        title,
        roleFamily: roleFamily(title),
        roleType: roleType(title),
        recruitmentTrack,
        location,
        experienceLevel: normalizeText(candidate.experienceLevel || "未明示"),
        summary: normalizeText(candidate.summary || evidence.join("；")).slice(0, 300),
        skillsJson: JSON.stringify(skills),
        aiSkillsJson: JSON.stringify(aiSkills),
        bonusSignalsJson: JSON.stringify(bonusSignals),
        evidenceJson: JSON.stringify(evidence),
        technicalRequirements: verifiedLongText(candidate.technicalRequirements),
        experienceRequirements: verifiedLongText(candidate.experienceRequirements),
        softRequirements: verifiedLongText(candidate.softRequirements),
        sourceTier: "S｜官方招聘",
        sourceUrl: candidate.sourceUrl || resolvedSourceUrl,
        sourceJobId: sourceJobId || null,
        sourcePublishedAt: null,
        contentHash,
        clusterKey: roleFamily(title),
        status: "在招",
        lastSeenAt: sql`CURRENT_TIMESTAMP`,
        offlineAt: null,
      };
      await db.insert(jobs).values(values).onConflictDoUpdate({ target: jobs.id, set: values });
      await db.insert(jobSnapshots).values({
        jobId: id,
        runId: run.id,
        contentHash,
        evidenceJson: JSON.stringify(evidence),
      }).onConflictDoNothing();
      accepted += 1;
    }

    const offlineMarked = await auditKnownJobLinks(company);

    const completedStatus = accepted ? "success" : candidates.length ? "needs_review" : includedTitle.test(sourceText) ? "no_matching_jobs" : "needs_adapter";
    await db.update(crawlRuns).set({
      status: completedStatus,
      discovered: accepted,
      errorMessage: accepted ? null : candidates.length ? "发现候选岗位，但公开证据未全部通过逐字校验" : completedStatus === "no_matching_jobs" ? "官方公开数据中本轮未发现目标产品/运营岗位" : "页面可访问，但尚未从 HTML、内嵌 JSON 或公开脚本中定位目标岗位数据",
      finishedAt: sql`CURRENT_TIMESTAMP`,
    }).where(eq(crawlRuns.id, run.id));
    if (requestId) {
      await db.update(refreshRequests).set({ status: accepted ? "completed" : completedStatus }).where(eq(refreshRequests.id, requestId));
    }
    return { runId: run.id, accepted, offlineMarked, status: completedStatus, sourceUrl:resolvedSourceUrl };
  } catch (error) {
    const message = error instanceof Error ? error.message : "采集失败";
    const status = message.includes("HTTP 404") ? "source_moved" : message.includes("HTTP 412") ? "requires_browser" : message.includes("JavaScript 空壳") ? "needs_adapter" : "failed";
    await db.update(crawlRuns).set({ status, errorMessage: message, finishedAt: sql`CURRENT_TIMESTAMP` }).where(eq(crawlRuns.id, run.id));
    if (requestId) await db.update(refreshRequests).set({ status }).where(eq(refreshRequests.id, requestId));
    return { runId: run.id, accepted: 0, status, sourceUrl, error: message };
  }
}

async function auditKnownJobLinks(company: CompanyName) {
  const db = getDb();
  const known = await db.select({ id: jobs.id, sourceUrl: jobs.sourceUrl })
    .from(jobs)
    .where(and(eq(jobs.company, company), eq(jobs.status, "在招")))
    .limit(12);
  let marked = 0;
  for (const job of known) {
    if (job.sourceUrl === SOURCE_REGISTRY[company] || /\/jobs\/list(?:\?|$)/.test(job.sourceUrl)) continue;
    try {
      const response = await fetch(job.sourceUrl, {
        method: "HEAD",
        redirect: "follow",
        signal: AbortSignal.timeout(8_000),
      });
      if (response.status !== 404 && response.status !== 410) continue;
      await db.update(jobs).set({ status: "已下线", offlineAt: sql`CURRENT_TIMESTAMP` }).where(eq(jobs.id, job.id));
      marked += 1;
    } catch {
      // Network failures are not evidence that a role is offline.
    }
  }
  return marked;
}
