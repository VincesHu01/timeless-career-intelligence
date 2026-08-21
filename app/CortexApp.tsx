"use client";

import { FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { companySources, knowledgeCards, reviewIntervals, verifiedJobs, type JobRecord } from "./cortex-data";
import ParticleField from "./ParticleField";

type View = "overview" | "matrix" | "jobs" | "weekly" | "learn" | "sources";
type AuthMode = "login" | "signup";
type AuthConfig = { url: string; key: string; configured: boolean };
type Session = { access_token: string; user: { email?: string; user_metadata?: Record<string, string> } };
type SourceRun = { company:string; status:string; discovered:number; message?:string|null; checkedAt:string };
type WeeklyReport = {
  title: string;
  weekStart: string;
  weekEnd: string;
  summary: string;
  generatedAt: string;
  metrics: { activeJobs:number; newJobs:number; offlineJobs:number; companies:number; aiMentionJobs:number; analyzableClusters:number };
  clusters: Array<{
    key:string;
    roleFamily:string;
    recruitmentTrack:string;
    count:number;
    companies:string[];
    skills:Array<{name:string;count:number}>;
    aiSkills:Array<{name:string;count:number}>;
    bonusSignals:Array<{name:string;count:number}>;
    jobIds:string[];
  }>;
  sources:Array<{company:string;title:string;url:string}>;
};

const navItems: { id: View; label: string; en: string; icon: string }[] = [
  { id:"overview", label:"市场雷达", en:"RADAR", icon:"⌁" },
  { id:"matrix", label:"能力透视", en:"MATRIX", icon:"▦" },
  { id:"jobs", label:"岗位库", en:"JOBS", icon:"◎" },
  { id:"weekly", label:"趋势周报", en:"WEEKLY", icon:"↗" },
  { id:"learn", label:"AI 学习", en:"LEARN", icon:"◇" },
  { id:"sources", label:"数据来源", en:"SOURCES", icon:"⌘" },
];

const REVIEW_DUE_KEY = "cortex_review_due";
const AI_COMPANIES = new Set(["DeepSeek","Kimi（月之暗面）","智谱AI"]);
type ReviewDue = Record<string, { dueAt:string; notifiedAt?:string }>;

function Logo() {
  return <div className="cx-logo"><span>T</span><div><b>TIMELESS</b><small>CAREER INTELLIGENCE</small></div></div>;
}

function CompanyLogo({ name, className="" }: { name:string; className?:string }) {
  const source = companySources.find((item) => item.name === name);
  const brandIndex = Math.max(0,companySources.findIndex((item) => item.name === name)) % 8;
  return <span className={`cx-company-logo brand-${brandIndex} ${className}`} title={name} aria-label={`${name} 标识`}>
    <b>{source?.short.slice(0,2) || name.slice(0,2)}</b>
  </span>;
}

function hasDirectJobSource(url: string) {
  return /post_detail\.html\?postid=|\/job\/[^/?#]+|\/position\/[^/?#]+(?:\/detail|\?|$)/i.test(url);
}

export default function CortexApp() {
  const [view, setView] = useState<View>("overview");
  const [selectedJob, setSelectedJob] = useState<JobRecord | null>(null);
  const [query, setQuery] = useState("");
  const [company, setCompany] = useState("全部公司");
  const [track, setTrack] = useState("全部类型");
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [session, setSession] = useState<Session | null>(null);
  const [reviews, setReviews] = useState<Record<string, number>>({});
  const [modelStatus, setModelStatus] = useState("等待测试");
  const [toast, setToast] = useState("");
  const [jobs, setJobs] = useState<JobRecord[]>(verifiedJobs);
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);
  const [sourceRuns, setSourceRuns] = useState<Record<string,SourceRun>>({});

  const loadMarketData = async () => {
    try {
      const [jobsResponse, reportResponse, sourceResponse] = await Promise.all([fetch("/api/jobs"), fetch("/api/weekly-report"), fetch("/api/source-status")]);
      if (jobsResponse.ok) {
        const data = await jobsResponse.json() as { jobs?: JobRecord[] };
        if (data.jobs?.length) setJobs(data.jobs);
      }
      if (reportResponse.ok) {
        const data = await reportResponse.json() as { report?: WeeklyReport | null };
        if (data.report) setWeeklyReport(data.report);
      }
      if (sourceResponse.ok) {
        const data = await sourceResponse.json() as { sources?:SourceRun[] };
        setSourceRuns(Object.fromEntries((data.sources || []).map((item) => [item.company,item])));
      }
    } catch {
      setToast("动态数据暂不可用，正在展示已核验的基础样本");
    }
  };

  useEffect(() => { queueMicrotask(() => void loadMarketData()); }, []);

  useEffect(() => {
    const saved = localStorage.getItem("cortex_session");
    if (saved) {
      try { const parsed = JSON.parse(saved) as Session; queueMicrotask(() => setSession(parsed)); } catch { localStorage.removeItem("cortex_session"); }
    }
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const checkDueReviews = async () => {
      if (!("Notification" in window) || Notification.permission !== "granted" || !("serviceWorker" in navigator)) return;
      const saved = localStorage.getItem(REVIEW_DUE_KEY);
      if (!saved) return;
      try {
        const schedule = JSON.parse(saved) as ReviewDue;
        const due = Object.entries(schedule).filter(([,item]) => Date.parse(item.dueAt) <= Date.now() && item.notifiedAt !== item.dueAt);
        if (!due.length) return;
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification("Timeless · AI 知识复习", { body:`有 ${due.length} 个知识点到期，用 5 分钟把它们讲清楚。`, icon:"/favicon.svg", tag:"cortex-review-due" });
        due.forEach(([id,item]) => { schedule[id] = { ...item, notifiedAt:item.dueAt }; });
        localStorage.setItem(REVIEW_DUE_KEY,JSON.stringify(schedule));
      } catch { localStorage.removeItem(REVIEW_DUE_KEY); }
    };
    void checkDueReviews();
    const timer = window.setInterval(checkDueReviews,60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!session?.access_token) return;
    fetch("/api/reviews", { headers:{ Authorization:`Bearer ${session.access_token}` } })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("review sync failed")))
      .then((data:{ reviews?:{ cardId:string; quality:number; dueAt:string }[] }) => {
        setReviews(Object.fromEntries((data.reviews || []).map((item) => [item.cardId,item.quality])));
        const schedule:ReviewDue = Object.fromEntries((data.reviews || []).map((item) => [item.cardId,{ dueAt:item.dueAt }]));
        localStorage.setItem(REVIEW_DUE_KEY,JSON.stringify(schedule));
      })
      .catch(() => setToast("复习记录暂未同步，当前页面仍可继续学习"));
  }, [session]);

  const filteredJobs = useMemo(() => jobs.filter((job) => {
    const haystack = `${job.company}${job.title}${job.family}${job.skills.join("")}${job.ai.join("")}`.toLowerCase();
    return (!query || haystack.includes(query.toLowerCase())) &&
      (company === "全部公司" || job.company === company) &&
      (track === "全部类型" || job.track.includes(track));
  }), [jobs, query, company, track]);

  const navigate = (next: View) => {
    setView(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const requestRefresh = async (name: string) => {
    if (!session?.access_token) {
      setAuthOpen(true);
      setToast("请先登录，再提交公司更新请求");
      return;
    }
    try {
      const response = await fetch("/api/refresh", { method:"POST", headers:{ "Content-Type":"application/json", Authorization:`Bearer ${session.access_token}` }, body:JSON.stringify({ company:name }) });
      const data = await response.json() as { error?:string; message?:string; retryAfterSeconds?:number };
      if (!response.ok) throw new Error(data.message || (data.error === "cooldown" ? `${name} 刚完成采集，请稍后重试` : data.error || "提交失败"));
      const result = data as { result?:{ accepted?:number; status?:string }; error?:string };
      setToast(result.result?.status === "success" ? `${name} 已更新，新增/更新 ${result.result.accepted || 0} 条证据记录` : `${name} 本轮未新增可核验岗位，已有记录已完整保留`);
      await loadMarketData();
    } catch (reason) {
      setToast(reason instanceof Error ? reason.message : "更新请求暂时无法提交");
    }
  };

  const enableNotifications = async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setToast("当前浏览器不支持通知，将继续使用站内提醒");
      return;
    }
    try {
      await navigator.serviceWorker.register("/sw.js");
      const permission = await Notification.requestPermission();
      setToast(permission === "granted" ? "通知权限已开启；站内复习到期时将提醒你" : "未获得通知权限，站内提醒仍然有效");
    } catch {
      setToast("通知初始化失败，站内提醒仍然有效");
    }
  };

  const completeReview = async (id: string, quality: number) => {
    setReviews((current) => ({ ...current, [id]: quality }));
    const successMessage = quality >= 3 ? "已掌握，下一次复习间隔将延长" : "已加入短间隔复习队列";
    const schedule = JSON.parse(localStorage.getItem(REVIEW_DUE_KEY) || "{}") as ReviewDue;
    schedule[id] = { dueAt:new Date(Date.now()+(quality >= 3 ? 2 : 1)*86400000).toISOString() };
    localStorage.setItem(REVIEW_DUE_KEY,JSON.stringify(schedule));
    if (!session?.access_token) {
      setToast(`${successMessage}；登录后可跨设备同步`);
      return;
    }
    try {
      const response = await fetch("/api/reviews", { method:"POST", headers:{ "Content-Type":"application/json", Authorization:`Bearer ${session.access_token}` }, body:JSON.stringify({ cardId:id, quality }) });
      if (!response.ok) throw new Error();
      const data = await response.json() as { dueAt?:string };
      if (data.dueAt) {
        schedule[id] = { dueAt:data.dueAt };
        localStorage.setItem(REVIEW_DUE_KEY,JSON.stringify(schedule));
      }
      setToast(`${successMessage}，已同步`);
    } catch {
      setToast(`${successMessage}；云端同步暂时失败`);
    }
  };

  const testModel = async () => {
    if (!session?.access_token) {
      setAuthOpen(true);
      setToast("请先登录，再测试 AI 连接");
      return;
    }
    setModelStatus("测试中…");
    try {
      const response = await fetch("/api/model-health", { method:"POST", headers:{ Authorization:`Bearer ${session.access_token}` } });
      const data = await response.json() as { ok?:boolean; model?:string; error?:string };
      if (!response.ok || !data.ok) throw new Error(data.error || "模型测试失败");
      setModelStatus(`${data.model || "模型"} · 已连接`);
      setToast("火山方舟模型连接成功");
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "模型测试失败";
      setModelStatus(`失败 · ${message}`);
      setToast(message);
    }
  };

  return (
    <div className="cx-app">
      <ParticleField view={view} />
      <aside className="cx-sidebar">
        <Logo />
        <nav aria-label="产品导航">
          {navItems.map((item) => (
            <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => navigate(item.id)}>
              <i>{item.icon}</i><span><b>{item.label}</b><small>{item.en}</small></span>
            </button>
          ))}
        </nav>
        <div className="cx-side-card">
          <span>WEEKLY BRIEF / 34</span>
          <strong>本周招聘<br />证据已更新</strong>
          <p>{jobs.length} 条证据记录<br />{companySources.length} 家源站状态</p>
          <button onClick={() => navigate("sources")}>查看覆盖情况 →</button>
        </div>
        <div className="cx-sidebar-foot"><span className="cx-pulse" /> 数据诚实模式已开启</div>
      </aside>

      <div className="cx-main">
        <header className="cx-header">
          <div className="cx-mobile-logo"><Logo /></div>
          <label className="cx-search">
            <span>⌕</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索公司、岗位、AI 技能…" onFocus={() => setView("jobs")} />
            <kbd>⌘ K</kbd>
          </label>
          <div className="cx-header-actions">
            <button className="cx-notify" onClick={enableNotifications} aria-label="开启浏览器提醒">♢</button>
            {session ? (
              <button className="cx-user" onClick={() => setAuthOpen(true)}><span>{(session.user.user_metadata?.username || session.user.email || "T").slice(0,1).toUpperCase()}</span><b>{session.user.user_metadata?.username || "我的 Timeless"}</b></button>
            ) : (
              <button className="cx-login" onClick={() => setAuthOpen(true)}>登录 / 注册 <b>↗</b></button>
            )}
          </div>
        </header>

        <main className="cx-content">
          {view === "overview" && <Overview jobs={jobs} onNavigate={navigate} onJob={setSelectedJob} onRefresh={requestRefresh} />}
          {view === "matrix" && <MatrixView jobs={jobs} onJob={setSelectedJob} />}
          {view === "jobs" && <JobsView jobs={filteredJobs} query={query} company={company} track={track} onCompany={setCompany} onTrack={setTrack} onJob={setSelectedJob} />}
          {view === "weekly" && <WeeklyView report={weeklyReport} session={session} onReport={setWeeklyReport} onToast={setToast} />}
          {view === "learn" && <LearnView jobs={jobs} reviews={reviews} onReview={completeReview} onNotify={enableNotifications} />}
          {view === "sources" && <SourcesView jobs={jobs} sourceRuns={sourceRuns} onRefresh={requestRefresh} onTestModel={testModel} modelStatus={modelStatus} />}
        </main>

        <nav className="cx-mobile-nav" aria-label="移动端导航">
          {navItems.filter((item) => item.id !== "sources").slice(0,5).map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => navigate(item.id)}><i>{item.icon}</i><span>{item.label}</span></button>)}
        </nav>
      </div>

      {selectedJob && <JobDrawer job={selectedJob} onClose={() => setSelectedJob(null)} />}
      {authOpen && <AuthModal session={session} mode={authMode} onMode={setAuthMode} onClose={() => setAuthOpen(false)} onSession={setSession} onToast={setToast} />}
      {toast && <div className="cx-toast"><span>✓</span>{toast}</div>}
    </div>
  );
}

function PageTitle({ eyebrow, title, desc, actions }: { eyebrow:string; title:string; desc:string; actions?:ReactNode }) {
  return <div className="cx-page-title"><div><span>{eyebrow}</span><h1>{title}</h1><p>{desc}</p></div>{actions && <div className="cx-title-actions">{actions}</div>}</div>;
}

function Overview({ jobs, onNavigate, onJob, onRefresh }: { jobs:JobRecord[]; onNavigate:(view:View)=>void; onJob:(job:JobRecord)=>void; onRefresh:(name:string)=>void }) {
  const gradeA = companySources.filter((item) => item.level === "A").length;
  const analyzable = jobs.filter((job) => job.skills.length > 0).length;
  const aiMention = jobs.filter((job) => job.ai.length > 0).length;
  return <>
    <section className="cx-hero-grid">
      <div className="cx-hero-copy">
        <div className="cx-kicker"><i /> MARKET SIGNAL / 2026.08.21</div>
        <h1>招聘市场不会给你答案，<br /><em>Timeless</em> 给你证据。</h1>
        <p>追踪 {companySources.length} 家互联网与 AI 公司，只分析产品与目标运营岗位。每一个结论都可以回到官方职位、原文证据与核验时间。</p>
        <div className="cx-hero-buttons"><button onClick={() => onNavigate("matrix")}>查看能力透视 <b>↗</b></button><button onClick={() => onNavigate("jobs")}>浏览真实样本</button></div>
        <div className="cx-trust-row"><span><b>{companySources.length}</b> 家目标公司</span><span><b>{jobs.length}</b> 条证据记录</span><span><b>0</b> 条无来源结论</span></div>
      </div>
      <div className="cx-orbit-card">
        <div className="cx-orbit-head"><span>REAL-TIME SOURCE MAP</span><b><i /> LIVE</b></div>
        <div className="cx-orbit">
          <div className="cx-orbit-ring ring-one" /><div className="cx-orbit-ring ring-two" />
          <div className="cx-core"><strong>{gradeA}</strong><span>A级源站</span></div>
          {companySources.slice(-8).map((source,index) => <CompanyLogo key={source.name} name={source.name} className={`cx-node n${index+1}`} />)}
        </div>
        <div className="cx-orbit-foot"><span>公开结构清晰</span><strong>{gradeA} / {companySources.length}</strong></div>
      </div>
    </section>

    <section className="cx-metrics">
      <article><span>已核验岗位记录</span><strong>{jobs.length}</strong><small>全部带来源链接</small></article>
      <article><span>可参与能力统计</span><strong>{analyzable}</strong><small>职责证据完整</small></article>
      <article><span>明确包含 AI 要求</span><strong>{aiMention}</strong><small>仅统计 JD 明示</small></article>
      <article className="accent"><span>今日学习任务</span><strong>04</strong><button onClick={() => onNavigate("learn")}>开始学习 →</button></article>
    </section>

    <section className="cx-overview-grid">
      <div className="cx-panel cx-evidence-panel">
        <div className="cx-panel-head"><div><span>LATEST EVIDENCE</span><h2>最新可核验岗位</h2></div><button onClick={() => onNavigate("jobs")}>查看全部 →</button></div>
        <div className="cx-job-rows">
          {jobs.slice(0,4).map((job) => <button key={job.id} onClick={() => onJob(job)}>
            <CompanyLogo name={job.company} />
            <span className="cx-job-main"><b>{job.title}</b><small>{job.company} · {job.track} · {job.location}</small></span>
            <span className={`cx-status ${job.status === "在招" ? "live" : "review"}`}>{job.status}</span><i>↗</i>
          </button>)}
        </div>
      </div>
      <div className="cx-panel cx-signal-list">
        <div className="cx-panel-head"><div><span>WHAT CHANGED</span><h2>证据快讯</h2></div><small>不是市场推断</small></div>
        <ol>
          <li><i>01</i><div><b>DeepSeek AI 产品经理</b><p>Agent Harness 方向明确要求 MCP、Memory、Subagent、Multi-Agent 与 Vibe Coding。</p></div></li>
          <li><i>02</i><div><b>智谱 AI 运营校招</b><p>官网明确要求结合大模型技术设计创新 AI 解决方案。</p></div></li>
          <li><i>03</i><div><b>Kimi 产品与用户运营</b><p>官网已确认校招方向；完整职责未公开，因此暂不扩写技术栈。</p></div></li>
        </ol>
      </div>
    </section>

    <section className="cx-company-health">
      <div className="cx-panel-head"><div><span>SOURCE HEALTH</span><h2>{companySources.length} 家公司覆盖状态</h2></div><button onClick={() => onNavigate("sources")}>数据源审计 →</button></div>
      <div className="cx-health-grid">{companySources.slice(-6).map((source) => <article key={source.name}><div><CompanyLogo name={source.name} /><b>{source.name}</b></div><small>{source.status}</small><button onClick={() => onRefresh(source.name)}>请求更新</button></article>)}</div>
    </section>
  </>;
}

function MatrixView({ jobs, onJob }: { jobs:JobRecord[]; onJob:(job:JobRecord)=>void }) {
  const [roleFilter, setRoleFilter] = useState("全部岗位");
  const [companyFilter, setCompanyFilter] = useState("全部公司");
  const scopedJobs = useMemo(() => jobs.filter((job) => {
    const inferredRole = job.roleType || (/运营/.test(job.title) ? "运营岗" : "产品岗");
    const roleMatch = roleFilter === "全部岗位" || inferredRole === roleFilter;
    const companyMatch = companyFilter === "全部公司" || (companyFilter === "AI 公司" ? AI_COMPANIES.has(job.company) : !AI_COMPANIES.has(job.company));
    return roleMatch && companyMatch && job.status !== "已下线" && (job.skills.length > 0 || job.ai.length > 0);
  }),[jobs,roleFilter,companyFilter]);
  const companies = useMemo(() => [...new Set(scopedJobs.map((job) => job.company))]
    .sort((a,b) => scopedJobs.filter((job) => job.company === b).length-scopedJobs.filter((job) => job.company === a).length)
    .slice(0,6),[scopedJobs]);
  const matrixRows = useMemo(() => {
    const counts = new Map<string,number>();
    scopedJobs.forEach((job) => [...new Set([...job.ai,...job.skills])].forEach((skill) => counts.set(skill,(counts.get(skill) || 0)+1)));
    return [...counts.entries()].sort((a,b) => b[1]-a[1]).slice(0,12).map(([name,count]) => ({ name, count }));
  },[scopedJobs]);
  const matrixStyle = { gridTemplateColumns:`minmax(170px,1.5fr) repeat(${Math.max(companies.length,1)},minmax(78px,1fr)) minmax(78px,.8fr)` };
  return <>
    <PageTitle eyebrow="02 / LIVE ABILITY MATRIX" title="实时岗位能力透视" desc="根据你选择的岗位类型与公司类型，直接从当前已核验 JD 重算能力覆盖；岗位更新后本页无需改代码即可同步变化。" />
    <div className="cx-matrix-controls">
      <label>岗位类型<select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}><option>全部岗位</option><option>产品岗</option><option>运营岗</option></select></label>
      <label>公司类型<select value={companyFilter} onChange={(event) => setCompanyFilter(event.target.value)}><option>全部公司</option><option>综合互联网公司</option><option>AI 公司</option></select></label>
      <span>实时口径 · {scopedJobs.length} 个岗位 / {companies.length} 家公司</span>
    </div>
    <div className="cx-sample-warning"><span>LIVE EVIDENCE</span><p>当前只统计岗位原文明示且已结构化的能力。<b>“未明示”不代表不需要</b>，样本少于 3 条时不输出行业结论。</p></div>
    {matrixRows.length ? <div className="cx-matrix-layout">
      <section className="cx-panel cx-big-matrix">
        <div className="cx-panel-head"><div><span>COMPANY COVERAGE</span><h2>能力 × 公司</h2></div><small>职责/要求明示口径</small></div>
        <div className="cx-matrix-grid cx-matrix-head" style={matrixStyle}><span>能力标签</span>{companies.map((name) => <span key={name}>{name}</span>)}<span>岗位覆盖</span></div>
        {matrixRows.map((row) => <div className="cx-matrix-grid" style={matrixStyle} key={row.name}><b>{row.name}</b>{companies.map((name) => { const explicit=scopedJobs.some((job) => job.company === name && [...job.ai,...job.skills].includes(row.name)); return <span key={name} className={explicit ? "yes" : "no"}>{explicit ? "明确" : "未明示"}</span>; })}<strong>{row.count}/{scopedJobs.length}</strong></div>)}
        <div className="cx-matrix-legend"><span><i className="yes" /> JD 明确</span><span><i className="no" /> 未明示，不等于不需要</span></div>
      </section>
      <aside className="cx-panel cx-stage-ladder">
        <div className="cx-panel-head"><div><span>FILTER SNAPSHOT</span><h2>当前切片</h2></div></div>
        {["实习","校招","社会招聘"].map((stage,index) => { const stageJobs=scopedJobs.filter((job) => job.track.includes(stage)); const top=[...new Set(stageJobs.flatMap((job) => [...job.ai,...job.skills]))].slice(0,4); return <div className="cx-stage" key={stage}><i>0{index+1}</i><div><b>{stage} · {stageJobs.length} 条</b><p>{top.length ? top.join("、") : "当前没有足够的明示能力样本"}</p></div></div>; })}
      </aside>
    </div> : <EmptyMatrix family={`${roleFilter} / ${companyFilter}`} />}
    <section className="cx-panel cx-evidence-chain">
      <div className="cx-panel-head"><div><span>EVIDENCE CHAIN</span><h2>支撑该视图的岗位</h2></div></div>
      <div>{scopedJobs.slice(0,24).map((job) => <button key={job.id} onClick={() => onJob(job)}><span>{job.company}</span><b>{job.title}</b><small>{job.sourceTier}</small><i>查看证据 ↗</i></button>)}</div>
    </section>
  </>;
}

function WeeklyView({ report, session, onReport, onToast }: { report:WeeklyReport|null; session:Session|null; onReport:(report:WeeklyReport)=>void; onToast:(message:string)=>void }) {
  const [loading, setLoading] = useState(false);
  const generate = async () => {
    if (!session?.access_token) { onToast("请先登录，再生成最新周报"); return; }
    setLoading(true);
    try {
      const response = await fetch("/api/weekly-report", { method:"POST", headers:{ Authorization:`Bearer ${session.access_token}` } });
      const data = await response.json() as { report?:WeeklyReport; error?:string };
      if (!response.ok || !data.report) throw new Error(data.error || "周报生成失败");
      onReport(data.report); onToast("本周趋势报告已基于当前证据重新生成");
    } catch (error) { onToast(error instanceof Error ? error.message : "周报生成失败"); }
    finally { setLoading(false); }
  };
  return <>
    <PageTitle eyebrow="04 / WEEKLY INTELLIGENCE" title="招聘趋势周报" desc="只汇总数据库中的官方岗位证据；样本不足的岗位簇不会输出跨公司结论。" actions={<button className="cx-primary" onClick={generate} disabled={loading}>{loading ? "生成中…" : "生成最新周报 ↗"}</button>} />
    {!report ? <section className="cx-panel cx-empty"><strong>尚未生成首份动态周报</strong><p>登录后点击“生成最新周报”，或等待每周自动任务完成。</p></section> : <>
      <section className="cx-learn-summary cx-weekly-summary">
        <div><span>在招岗位</span><strong>{report.metrics.activeJobs}</strong><small>保留已下线历史 {report.metrics.offlineJobs} 条</small></div>
        <div><span>覆盖公司</span><strong>{report.metrics.companies}</strong><small>{report.weekStart} — {report.weekEnd}</small></div>
        <div><span>明确提及 AI</span><strong>{report.metrics.aiMentionJobs}</strong><small>仅统计原文明确要求</small></div>
      </section>
      <section className="cx-panel cx-weekly-report">
        <div className="cx-panel-head"><div><span>WEEKLY BRIEF</span><h2>{report.title}</h2></div><small>{report.generatedAt?.slice(0,16).replace("T"," ")} 生成</small></div>
        <p className="cx-report-lead">{report.summary}</p>
        <div className="cx-cluster-grid">{report.clusters.slice(0,8).map((cluster) => <article key={cluster.key}>
          <div><span>{cluster.recruitmentTrack}</span><b>{cluster.count} 条</b></div><h3>{cluster.roleFamily}</h3><p>{cluster.companies.join(" / ")}</p>
          <div className="cx-tags">{cluster.aiSkills.slice(0,3).map((item) => <span key={item.name}>{item.name} · {item.count}</span>)}{cluster.skills.slice(0,3).map((item) => <span key={item.name}>{item.name} · {item.count}</span>)}</div>
          {cluster.count < 3 || cluster.companies.length < 2 ? <small>样本不足，仅展示，不形成趋势判断</small> : <small>达到跨公司分析门槛</small>}
        </article>)}</div>
      </section>
      <section className="cx-panel cx-evidence-chain"><div className="cx-panel-head"><div><span>SOURCE INDEX</span><h2>本周证据索引</h2></div><small>{report.sources.length} 个官方来源</small></div><div>{report.sources.slice(0,20).map((source) => <a key={`${source.url}-${source.title}`} href={source.url} target="_blank" rel="noreferrer"><span>{source.company}</span><b>{source.title}</b><i>打开官方来源 ↗</i></a>)}</div></section>
    </>}
  </>;
}

function EmptyMatrix({ family }: { family:string }) {
  return <section className="cx-panel cx-empty"><span>DATA INTEGRITY GUARD</span><strong>{family}</strong><p>当前职责完整样本不足 5 条或覆盖公司不足 3 家，暂不生成横向百分比。已核验岗位仍可在岗位库查看。</p><i>等待更多官方证据</i></section>;
}

function JobsView({ jobs, query, company, track, onCompany, onTrack, onJob }: { jobs:JobRecord[]; query:string; company:string; track:string; onCompany:(v:string)=>void; onTrack:(v:string)=>void; onJob:(job:JobRecord)=>void }) {
  return <>
    <PageTitle eyebrow="03 / VERIFIED JOBS" title="真实岗位证据库" desc="只展示有来源的岗位或招聘项目；职责不完整的记录不会进入能力统计。" actions={<button className="cx-primary">收藏的岗位 0</button>} />
    <div className="cx-filterbar">
      <label>公司<select value={company} onChange={(e) => onCompany(e.target.value)}><option>全部公司</option>{companySources.map((item) => <option key={item.name}>{item.name}</option>)}</select></label>
      <label>招聘类型<select value={track} onChange={(e) => onTrack(e.target.value)}><option>全部类型</option><option>校招</option><option>实习</option><option>管培生</option><option>社会招聘</option></select></label>
      <span>{query ? `关键词「${query}」· ` : ""}{jobs.length} 条结果</span>
    </div>
    <section className="cx-job-grid">{jobs.map((job) => <article key={job.id}>
      <div className="cx-job-card-top"><CompanyLogo name={job.company} /><div><b>{job.company}</b><small>{job.sourceTier}</small></div><span className={`cx-status ${job.status === "在招" ? "live" : job.status === "招聘项目" ? "program" : "review"}`}>{job.status}</span></div>
      <h2>{job.title}</h2><p>{job.summary}</p>
      <div className="cx-tags">{[...job.ai,...job.skills].slice(0,5).map((tag) => <span key={tag}>{tag}</span>)}{job.skills.length + job.ai.length === 0 && <span className="muted">职责待同步</span>}</div>
      <div className="cx-job-meta"><span>⌖ {job.location}</span><span>◷ {job.date}</span></div>
      <div className="cx-job-actions"><button onClick={() => onJob(job)}>查看规范化要求</button>{hasDirectJobSource(job.sourceUrl) ? <a href={job.sourceUrl} target="_blank" rel="noreferrer">打开岗位原文 <b>↗</b></a> : <span>具体详情链接同步中</span>}</div>
    </article>)}</section>
    {jobs.length === 0 && <div className="cx-panel cx-empty"><strong>没有匹配的已核验记录</strong><p>试试减少筛选条件。Timeless 不会为了填满列表生成不存在的岗位。</p></div>}
  </>;
}

function LearnView({ jobs, reviews, onReview, onNotify }: { jobs:JobRecord[]; reviews:Record<string,number>; onReview:(id:string,q:number)=>void; onNotify:()=>void }) {
  const [selectedId, setSelectedId] = useState(knowledgeCards[0].id);
  const aiJobs = useMemo(() => jobs.filter((job) => job.ai.length > 0 || /AI|Agent|大模型|模型|智能体/i.test(`${job.title}${job.summary}${job.evidence.join("")}`)), [jobs]);
  const modules = useMemo(() => {
    const aliases:Record<string,string[]> = {
      transformer:["Transformer","自回归","Attention","位置编码","KV Cache","Tokenizer","采样"],
      context:["上下文","Context","Token 预算","压缩","截断"],
      memory:["Memory","记忆","召回","过期","冲突"],
      planning:["Agent","Planning","ReAct","Subagent","Multi-Agent","任务规划","反思"],
      tools:["Tool Use","Function Calling","Skill","MCP","工具"],
      evaluation:["评测","Badcase","指标","归因","数据规范"],
      posttraining:["SFT","LoRA","DPO","GRPO","持续预训练","模型训练","后训练"],
      rag:["RAG","Embedding","召回","重排","引用","AI搜索"],
      python_sql:["Python","SQL","Vibe Coding","coding","数据分析","实验"],
    };
    return knowledgeCards.map((card) => {
      const terms = [...card.tags,...(aliases[card.id] || [])];
      const matches = aiJobs.filter((job) => {
        const text = `${job.title} ${job.summary} ${job.ai.join(" ")} ${job.skills.join(" ")} ${job.evidence.join(" ")}`.toLowerCase();
        return terms.some((term) => text.includes(term.toLowerCase()));
      });
      return { ...card, matches, relevance:matches.length };
    }).sort((a,b) => b.relevance-a.relevance || a.title.localeCompare(b.title,"zh-CN"));
  },[aiJobs]);
  const selected = modules.find((card) => card.id === selectedId) || modules[0];
  const companies = new Set(aiJobs.map((job) => job.company));
  const signalCounts = useMemo(() => {
    const counts = new Map<string,number>();
    aiJobs.forEach((job) => job.ai.forEach((skill) => counts.set(skill,(counts.get(skill) || 0)+1)));
    return [...counts.entries()].sort((a,b) => b[1]-a[1]).slice(0,6);
  },[aiJobs]);
  return <>
    <PageTitle eyebrow="04 / AI STACK LAB" title="从大量岗位原文生成 AI 能力地图" desc="每次岗位更新后自动重算：先汇聚全部产品/运营 JD 的 AI 证据，再解释概念、业务用法、动手实验与简历证明；腾讯岗位只是证据之一。" actions={<button className="cx-primary" onClick={onNotify}>开启浏览器提醒 ♢</button>} />
    <section className="cx-case-study">
      <div><span>LIVE MULTI-JD SYNTHESIS</span><h2>{aiJobs.length} 条 AI 岗位证据正在驱动课程</h2><p>覆盖 {companies.size} 家公司。系统只把 JD 原文明示的技术词关联到课程，不把“公司做 AI”推断成“该岗位要求某技术”。采集增加时，相关岗位数、公司覆盖和证据链接都会同步变化。</p></div>
      <div className="cx-signal-cloud">{signalCounts.map(([name,count]) => <span key={name}>{name}<b>{count} JD</b></span>)}{signalCounts.length === 0 && <span>等待更多岗位证据<b>0 JD</b></span>}</div>
      <button onClick={() => document.querySelector(".cx-course-list")?.scrollIntoView({behavior:"smooth"})}>查看实时能力地图 ↓</button>
    </section>
    <section className="cx-learn-summary">
      <div><span>今日待复习</span><strong>{knowledgeCards.length - Object.keys(reviews).length}</strong><small>按照 1 / 2 / 4 / 7 / 15 / 30 天安排</small></div>
      <div className="cx-review-curve"><span>记忆巩固节奏</span><div>{reviewIntervals.map((day,index) => <i key={day} style={{ height:`${28 + index * 10}px` }}><b>{day}</b></i>)}</div><small>DAY</small></div>
      <div><span>已掌握</span><strong>{Object.values(reviews).filter((value) => value >= 3).length}</strong><small>能解释、能识别、能设计方案</small></div>
    </section>
    <div className="cx-learn-layout">
      <section className="cx-course-list">
        <div className="cx-panel-head"><div><span>LIVE KNOWLEDGE MAP</span><h2>岗位驱动技术栈</h2></div><small>{aiJobs.length} 条 AI 岗位实时重算</small></div>
        {modules.map((card,index) => <button key={card.id} className={selected.id === card.id ? "active" : ""} onClick={() => setSelectedId(card.id)}>
          <i>{String(index+1).padStart(2,"0")}</i><div><span>{card.level} · {card.minutes} MIN</span><b>{card.title}</b><p>{card.desc}</p></div><strong>{card.relevance}<small>条 JD</small></strong>
        </button>)}
      </section>
      <aside className="cx-panel cx-lesson">
        <div className="cx-lesson-label"><span>{selected.level}</span><b>{selected.minutes} MIN</b></div><h2>{selected.title}</h2><p className="cx-lesson-desc">{selected.desc}</p>
        <div className="cx-lesson-section"><h3>01 · 这个概念是什么</h3><p>{selected.concept}</p></div>
        <div className="cx-lesson-section"><h3>02 · 它怎样工作</h3><p>{selected.mechanism}</p></div>
        <div className="cx-lesson-section"><h3>03 · 非技术岗具体怎么用</h3><p>{selected.productUse}</p></div>
        <div className="cx-mental-model"><span>5 MIN MENTAL MODEL</span><p>{selected.mentalModel}</p></div>
        <div className="cx-jd-signal"><span>当前岗位为什么要求它</span><p>{selected.matches.length ? `${[...new Set(selected.matches.map((job) => job.company))].join("、")} 的 ${selected.matches.slice(0,3).map((job) => job.title).join("、")} 等岗位在职责或要求中明确出现了本模块信号。下面可逐条回到官方原文核验。` : "当前已采集岗位尚未明确出现这一技术信号。课程保留为基础知识，但不会伪装成实时招聘趋势。"}</p></div>
        <div className="cx-lesson-tags">{selected.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
        <div className="cx-mini-task"><span>HANDS-ON PROJECT</span><b>{selected.project}</b></div>
        <div className="cx-resume-proof"><span>简历证据应该怎样写</span><p>{selected.resumeProof}</p></div>
        <div className="cx-live-evidence"><span>本模块的实时岗位证据</span>{selected.matches.slice(0,6).map((job) => <a key={job.id} href={job.sourceUrl} target="_blank" rel="noreferrer"><CompanyLogo name={job.company} /><b>{job.company} · {job.title}</b><i>官方原文 ↗</i></a>)}{selected.matches.length === 0 && <p>暂时没有原文明示记录；后续采集会自动补入。</p>}</div>
        <div className="cx-review-actions"><span>这次掌握得怎样？</span><button onClick={() => onReview(selected.id,1)}>需要重学</button><button onClick={() => onReview(selected.id,3)}>基本掌握</button><button className="good" onClick={() => onReview(selected.id,5)}>可以讲清楚</button></div>
      </aside>
    </div>
  </>;
}

function SourcesView({ jobs, sourceRuns, onRefresh, onTestModel, modelStatus }: { jobs:JobRecord[]; sourceRuns:Record<string,SourceRun>; onRefresh:(name:string)=>void; onTestModel:()=>void; modelStatus:string }) {
  return <>
    <PageTitle eyebrow="05 / SOURCE COVERAGE" title="官方岗位覆盖" desc="这里只展示你真正关心的结果：每家公司已收录多少个可核验岗位、最近何时同步，以及官方入口。技术诊断不会干扰浏览。" actions={<button className="cx-primary" onClick={onTestModel}>测试 AI 连接 · {modelStatus}</button>} />
    <section className="cx-pipeline"><div><i>01</i><b>读取官方公开页</b><span>不绕过登录、验证码与访问限制</span></div><em>→</em><div><i>02</i><b>筛选目标岗位</b><span>排除内容、新媒体与直播运营</span></div><em>→</em><div><i>03</i><b>逐字证据校验</b><span>标题与要求必须在原文存在</span></div><em>→</em><div><i>04</i><b>更新岗位库</b><span>新岗位写入，失效岗位保留并标记</span></div></section>
    <div className="cx-status-guide"><span><b>已收录</b> 岗位标题与来源可核验</span><span><b>持续同步</b> 没有新增时保留最近成功数据</span><span><b>已下线</b> 历史岗位保留，不从数据库删除</span><span><b>官方直达</b> 每个岗位优先链接具体详情页</span></div>
    <section className="cx-source-grid">{companySources.map((source) => { const run=sourceRuns[source.name]; const companyJobs=jobs.filter((job) => job.company === source.name); const active=companyJobs.filter((job) => job.status === "在招").length; const status=companyJobs.length ? `已收录 ${companyJobs.length} 条` : "持续同步中"; return <article key={source.name}>
      <div className="cx-source-top"><CompanyLogo name={source.name} /><div><h2>{source.name}</h2><small>{source.status}</small></div><span className={`cx-run-state ${companyJobs.length ? "s-success" : ""}`}>{status}</span></div>
      <p>{source.note}</p>
      <div className="cx-run-detail"><b>{run ? `最近同步 · ${run.checkedAt.slice(0,16).replace("T"," ")}` : "等待首次自动同步"}</b><span>{companyJobs.length ? `当前在招 ${active} 条，历史/待核验 ${companyJobs.length-active} 条；本轮无新增也不会清空。` : "系统将继续读取官方公开职位；入库后会在这里显示数量。"}</span></div>
      <div className="cx-source-actions"><a href={source.url} target="_blank" rel="noreferrer">核对官方页 ↗</a><button onClick={() => onRefresh(source.name)}>立即检查</button></div>
    </article>; })}</section>
  </>;
}

function JobDrawer({ job, onClose }: { job:JobRecord; onClose:()=>void }) {
  const derive = (pattern:RegExp) => job.evidence.filter((item) => pattern.test(item)).join("\n");
  const technical = job.technicalRequirements || derive(/AI|大模型|模型|Agent|Transformer|Attention|KV Cache|Tokenizer|RAG|SFT|LoRA|DPO|GRPO|Python|SQL|数据|评测|算法|技术|工具/i);
  const experience = job.experienceRequirements || derive(/经验|经历|项目|实习|年|训练|构造|规模|效果/i);
  const soft = job.softRequirements || derive(/沟通|协作|自驱|责任|学习|逻辑|洞察|表达|好奇|推动|抗压/i);
  const bonus = job.bonusSignals?.join("\n") || derive(/加分|优先/i);
  const sections: Array<[string,string]> = [
    ["技术 / AI 知识要求",technical],
    ["项目与经验要求",experience],
    ["加分项",bonus],
    ["软素质要求",soft],
  ].filter((item): item is [string,string] => Boolean(item[1]));
  return <div className="cx-overlay" role="button" tabIndex={0} aria-label="关闭岗位详情" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }} onKeyDown={(event) => { if (event.key === "Escape" || event.key === "Enter") onClose(); }}><aside className="cx-drawer">
    <button className="cx-close" onClick={onClose}>×</button><div className="cx-drawer-label"><span>{job.company}</span><b>{job.sourceTier}</b></div><h1>{job.title}</h1><div className="cx-drawer-meta"><span>{job.track}</span><span>{job.location}</span><span>{job.experienceLevel || "经验未明示"}</span><span>{job.date}</span></div>
    <section><h3>岗位职责摘要</h3><p>{job.summary}</p></section>
    {sections.map(([title,content],index) => <section className="cx-requirement-section" key={title}><h3><i>{String(index+1).padStart(2,"0")}</i>{title}</h3><p>{content}</p></section>)}
    {!sections.length && <section><h3>完整要求同步中</h3><p>当前官方详情尚未提供可完整归类的要求，Timeless 不会用无关片段填充。</p></section>}
    <div className="cx-integrity-note"><b>证据规则</b><p>未在公开原文中出现的能力不计入统计；“未明示”不等于公司不需要。</p></div>
    {hasDirectJobSource(job.sourceUrl) ? <a className="cx-source-link" href={job.sourceUrl} target="_blank" rel="noreferrer">打开该岗位官方原文 <b>↗</b></a> : <div className="cx-source-pending">未取得该岗位的官方详情 URL，不跳转到招聘入口页。</div>}
  </aside></div>;
}

function AuthModal({ session, mode, onMode, onClose, onSession, onToast }: { session:Session|null; mode:AuthMode; onMode:(v:AuthMode)=>void; onClose:()=>void; onSession:(v:Session|null)=>void; onToast:(v:string)=>void }) {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<AuthConfig>({ url:"", key:"", configured:false });
  const [error, setError] = useState("");
  useEffect(() => { fetch("/api/auth-config").then((response) => response.json()).then(setConfig).catch(() => setConfig({url:"",key:"",configured:false})); }, []);

  const submit = async (event:FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(""); setLoading(true);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim(); const password = String(form.get("password") || ""); const username = String(form.get("username") || "").trim();
    if (!config.configured) { setError("账号服务正在连接 Supabase，公开浏览和学习演示不受影响。"); setLoading(false); return; }
    try {
      const endpoint = mode === "signup" ? "/auth/v1/signup" : "/auth/v1/token?grant_type=password";
      const body = mode === "signup" ? { email, password, data:{ username, stage:String(form.get("stage") || "在校生"), target:String(form.get("target") || "产品") } } : { email, password };
      const response = await fetch(`${config.url}${endpoint}`, { method:"POST", headers:{ "Content-Type":"application/json", apikey:config.key }, body:JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.msg || data.error_description || "登录失败");
      if (data.access_token) { const next = data as Session; localStorage.setItem("cortex_session", JSON.stringify(next)); onSession(next); onToast("已登录，学习记录将跨设备同步"); onClose(); }
      else { onToast("注册成功，请按邮箱提示完成验证后登录"); onMode("login"); }
    } catch (reason) { setError(reason instanceof Error ? reason.message : "账号服务暂时不可用"); }
    finally { setLoading(false); }
  };

  const logout = () => { localStorage.removeItem("cortex_session"); onSession(null); onToast("已安全退出"); onClose(); };
  return <div className="cx-overlay" role="button" tabIndex={0} aria-label="关闭账号窗口" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }} onKeyDown={(event) => { if (event.key === "Escape") onClose(); }}><div className="cx-auth"><button className="cx-close" onClick={onClose}>×</button><Logo />
    {session ? <div className="cx-account-panel"><span>ACCOUNT CONNECTED</span><h2>{session.user.user_metadata?.username || session.user.email}</h2><p>复习进度已接入账号同步；岗位浏览无需登录。</p><button onClick={logout}>退出登录</button></div> : <>
      <div className="cx-auth-tabs"><button className={mode === "login" ? "active" : ""} onClick={() => onMode("login")}>登录</button><button className={mode === "signup" ? "active" : ""} onClick={() => onMode("signup")}>创建账号</button></div>
      <h2>{mode === "login" ? "继续你的能力进化" : "建立你的求职画像"}</h2><p>{mode === "login" ? "查看收藏、复习计划与岗位变化。" : "邮箱只用于验证和找回密码，不发送营销邮件。"}</p>
      <form onSubmit={submit}>{mode === "signup" && <><label>角色名称<input name="username" required minLength={2} placeholder="例如：AI 产品探索者" /></label><div className="cx-form-row"><label>身份阶段<select name="stage"><option>本科在校生</option><option>硕士在校生</option><option>博士在校生</option><option>应届生</option></select></label><label>目标方向<select name="target"><option>产品</option><option>运营</option><option>尚未确定</option></select></label></div></>}<label>邮箱<input name="email" type="email" required placeholder="name@example.com" /></label><label>密码<input name="password" type="password" required minLength={8} placeholder="至少 8 位" /></label>{error && <div className="cx-form-error">{error}</div>}<button className="cx-auth-submit" disabled={loading}>{loading ? "处理中…" : mode === "login" ? "登录 Timeless" : "创建 Timeless 账号"}</button></form>
      {!config.configured && <div className="cx-auth-status"><i /> Supabase 账号服务等待项目授权</div>}
    </>}
  </div></div>;
}
