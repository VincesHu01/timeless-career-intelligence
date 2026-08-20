"use client";

import { FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { companySources, knowledgeCards, reviewIntervals, verifiedJobs, type JobRecord } from "./cortex-data";

type View = "overview" | "matrix" | "jobs" | "learn" | "sources";
type AuthMode = "login" | "signup";
type AuthConfig = { url: string; key: string; configured: boolean };
type Session = { access_token: string; user: { email?: string; user_metadata?: Record<string, string> } };

const navItems: { id: View; label: string; en: string; icon: string }[] = [
  { id:"overview", label:"市场雷达", en:"RADAR", icon:"⌁" },
  { id:"matrix", label:"能力透视", en:"MATRIX", icon:"▦" },
  { id:"jobs", label:"岗位库", en:"JOBS", icon:"◎" },
  { id:"learn", label:"AI 学习", en:"LEARN", icon:"◇" },
  { id:"sources", label:"数据来源", en:"SOURCES", icon:"⌘" },
];

const REVIEW_DUE_KEY = "cortex_review_due";
type ReviewDue = Record<string, { dueAt:string; notifiedAt?:string }>;

const matrixRows = [
  { name:"用户研究 / 需求洞察", values:{ 百度:"明确", 阿里巴巴:"明确" }, note:"2/2 家公司" },
  { name:"数据指标与分析", values:{ 百度:"明确", 阿里巴巴:"明确" }, note:"2/2 家公司" },
  { name:"跨团队推动交付", values:{ 百度:"明确", 阿里巴巴:"明确" }, note:"2/2 家公司" },
  { name:"大模型产品理解", values:{ 百度:"明确", 阿里巴巴:"未明示" }, note:"1/2 家公司" },
  { name:"原型 / PRD", values:{ 百度:"未明示", 阿里巴巴:"明确" }, note:"1/2 家公司" },
];

function Logo() {
  return <div className="cx-logo"><span>C</span><div><b>CORTEX</b><small>CAREER INTELLIGENCE</small></div></div>;
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
        await registration.showNotification("Cortex · AI 知识复习", { body:`有 ${due.length} 个知识点到期，用 5 分钟把它们讲清楚。`, icon:"/favicon.svg", tag:"cortex-review-due" });
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

  const filteredJobs = useMemo(() => verifiedJobs.filter((job) => {
    const haystack = `${job.company}${job.title}${job.family}${job.skills.join("")}${job.ai.join("")}`.toLowerCase();
    return (!query || haystack.includes(query.toLowerCase())) &&
      (company === "全部公司" || job.company === company) &&
      (track === "全部类型" || job.track.includes(track));
  }), [query, company, track]);

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
      const data = await response.json() as { error?:string };
      if (!response.ok) throw new Error(data.error === "cooldown" ? `${name} 的更新请求仍在 30 分钟冷却期` : data.error || "提交失败");
      setToast(`已提交 ${name} 更新请求；源站限制不会被绕过`);
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
          <p>8 条可核验样本<br />13 家源站状态</p>
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
              <button className="cx-user" onClick={() => setAuthOpen(true)}><span>{(session.user.user_metadata?.username || session.user.email || "C").slice(0,1).toUpperCase()}</span><b>{session.user.user_metadata?.username || "我的 Cortex"}</b></button>
            ) : (
              <button className="cx-login" onClick={() => setAuthOpen(true)}>登录 / 注册 <b>↗</b></button>
            )}
          </div>
        </header>

        <main className="cx-content">
          {view === "overview" && <Overview onNavigate={navigate} onJob={setSelectedJob} onRefresh={requestRefresh} />}
          {view === "matrix" && <MatrixView onJob={setSelectedJob} />}
          {view === "jobs" && <JobsView jobs={filteredJobs} query={query} company={company} track={track} onCompany={setCompany} onTrack={setTrack} onJob={setSelectedJob} />}
          {view === "learn" && <LearnView reviews={reviews} onReview={completeReview} onNotify={enableNotifications} />}
          {view === "sources" && <SourcesView onRefresh={requestRefresh} onTestModel={testModel} modelStatus={modelStatus} />}
        </main>

        <nav className="cx-mobile-nav" aria-label="移动端导航">
          {navItems.slice(0,5).map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => navigate(item.id)}><i>{item.icon}</i><span>{item.label}</span></button>)}
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

function Overview({ onNavigate, onJob, onRefresh }: { onNavigate:(view:View)=>void; onJob:(job:JobRecord)=>void; onRefresh:(name:string)=>void }) {
  const gradeA = companySources.filter((item) => item.level === "A").length;
  const analyzable = verifiedJobs.filter((job) => job.skills.length > 0).length;
  const aiMention = verifiedJobs.filter((job) => job.ai.length > 0).length;
  return <>
    <section className="cx-hero-grid">
      <div className="cx-hero-copy">
        <div className="cx-kicker"><i /> MARKET SIGNAL / 2026.08.21</div>
        <h1>招聘市场不会给你答案，<br /><em>Cortex</em> 给你证据。</h1>
        <p>追踪 13 家互联网公司，只分析产品与目标运营岗位。每一个结论都可以回到官方职位、原文证据与核验时间。</p>
        <div className="cx-hero-buttons"><button onClick={() => onNavigate("matrix")}>查看能力透视 <b>↗</b></button><button onClick={() => onNavigate("jobs")}>浏览真实样本</button></div>
        <div className="cx-trust-row"><span><b>13</b> 家目标公司</span><span><b>{verifiedJobs.length}</b> 条首批样本</span><span><b>0</b> 条无来源结论</span></div>
      </div>
      <div className="cx-orbit-card">
        <div className="cx-orbit-head"><span>REAL-TIME SOURCE MAP</span><b><i /> LIVE</b></div>
        <div className="cx-orbit">
          <div className="cx-orbit-ring ring-one" /><div className="cx-orbit-ring ring-two" />
          <div className="cx-core"><strong>{gradeA}</strong><span>A级源站</span></div>
          {companySources.slice(0,8).map((source,index) => <i key={source.name} className={`cx-node n${index+1}`} title={source.name}>{source.short.slice(0,1)}</i>)}
        </div>
        <div className="cx-orbit-foot"><span>公开结构清晰</span><strong>{gradeA} / 13</strong></div>
      </div>
    </section>

    <section className="cx-metrics">
      <article><span>已核验首批样本</span><strong>{verifiedJobs.length}</strong><small>全部带来源链接</small></article>
      <article><span>可参与能力统计</span><strong>{analyzable}</strong><small>职责证据完整</small></article>
      <article><span>明确包含 AI 要求</span><strong>{aiMention}</strong><small>仅统计 JD 明示</small></article>
      <article className="accent"><span>今日学习任务</span><strong>04</strong><button onClick={() => onNavigate("learn")}>开始学习 →</button></article>
    </section>

    <section className="cx-overview-grid">
      <div className="cx-panel cx-evidence-panel">
        <div className="cx-panel-head"><div><span>LATEST EVIDENCE</span><h2>最新可核验岗位</h2></div><button onClick={() => onNavigate("jobs")}>查看全部 →</button></div>
        <div className="cx-job-rows">
          {verifiedJobs.slice(0,4).map((job) => <button key={job.id} onClick={() => onJob(job)}>
            <span className="cx-company-badge">{job.company.slice(0,1)}</span>
            <span className="cx-job-main"><b>{job.title}</b><small>{job.company} · {job.track} · {job.location}</small></span>
            <span className={`cx-status ${job.status === "在招" ? "live" : "review"}`}>{job.status}</span><i>↗</i>
          </button>)}
        </div>
      </div>
      <div className="cx-panel cx-signal-list">
        <div className="cx-panel-head"><div><span>WHAT CHANGED</span><h2>证据快讯</h2></div><small>不是市场推断</small></div>
        <ol>
          <li><i>01</i><div><b>百度 AI 产品经理</b><p>JD 明确要求大模型落地、人机协作与 AI 工具使用。</p></div></li>
          <li><i>02</i><div><b>阿里 2027 产品实习</b><p>明确强调用户研究、PRD、数据指标与跨团队交付。</p></div></li>
          <li><i>03</i><div><b>网易游戏 2027 校招</b><p>产品策划、运营与 PM 已进入官方招聘项目范围。</p></div></li>
        </ol>
      </div>
    </section>

    <section className="cx-company-health">
      <div className="cx-panel-head"><div><span>SOURCE HEALTH</span><h2>13 家公司覆盖状态</h2></div><button onClick={() => onNavigate("sources")}>数据源审计 →</button></div>
      <div className="cx-health-grid">{companySources.slice(0,6).map((source) => <article key={source.name}><div><span className={`cx-level l${source.level}`}>{source.level}</span><b>{source.name}</b></div><small>{source.status}</small><button onClick={() => onRefresh(source.name)}>请求更新</button></article>)}</div>
    </section>
  </>;
}

function MatrixView({ onJob }: { onJob:(job:JobRecord)=>void }) {
  const [family, setFamily] = useState("AI产品 / 通用产品");
  return <>
    <PageTitle eyebrow="02 / ABILITY MATRIX" title="同类岗位能力透视" desc="先按岗位族对齐，再比较不同公司与招聘阶段；样本不足时不生成“行业普遍要求”。" actions={<><button className="cx-select">近一年⌄</button><button className="cx-primary">导出当前视图 ↗</button></>} />
    <div className="cx-sample-warning"><span>LIMITED SAMPLE</span><p>当前矩阵只使用 <b>百度与阿里巴巴 4 条职责完整样本</b>。其他公司仅展示已核验职位，不计入百分比。</p></div>
    <div className="cx-family-tabs">{["AI产品 / 通用产品","商业化运营","管培生 / 人才计划"].map((item) => <button key={item} className={family === item ? "active" : ""} onClick={() => setFamily(item)}>{item}</button>)}</div>
    {family === "AI产品 / 通用产品" ? <div className="cx-matrix-layout">
      <section className="cx-panel cx-big-matrix">
        <div className="cx-panel-head"><div><span>COMPANY COVERAGE</span><h2>能力 × 公司</h2></div><small>职责/要求明示口径</small></div>
        <div className="cx-matrix-grid cx-matrix-head"><span>能力标签</span><span>百度</span><span>阿里巴巴</span><span>覆盖</span></div>
        {matrixRows.map((row) => <div className="cx-matrix-grid" key={row.name}><b>{row.name}</b>{["百度","阿里巴巴"].map((name) => <span key={name} className={row.values[name as keyof typeof row.values] === "明确" ? "yes" : "no"}>{row.values[name as keyof typeof row.values]}</span>)}<strong>{row.note}</strong></div>)}
        <div className="cx-matrix-legend"><span><i className="yes" /> JD 明确</span><span><i className="no" /> 未明示，不等于不需要</span></div>
      </section>
      <aside className="cx-panel cx-stage-ladder">
        <div className="cx-panel-head"><div><span>CAREER LADDER</span><h2>阶段差异</h2></div></div>
        <div className="cx-stage"><i>01</i><div><b>实习 / 校招</b><p>重视用户洞察、基本产品方法、数据意识和可验证项目。</p></div></div>
        <div className="cx-stage"><i>02</i><div><b>人才计划 / 管培生</b><p>增加 AI 前沿业务、商业化全局视角与领导潜力。</p></div></div>
        <div className="cx-stage"><i>03</i><div><b>资深社招</b><p>作为能力风向标，关注复杂业务闭环、组织影响与长期结果。</p></div></div>
      </aside>
    </div> : <EmptyMatrix family={family} />}
    <section className="cx-panel cx-evidence-chain">
      <div className="cx-panel-head"><div><span>EVIDENCE CHAIN</span><h2>支撑该视图的岗位</h2></div></div>
      <div>{verifiedJobs.filter((job) => ["百度","阿里巴巴"].includes(job.company) && job.skills.length).map((job) => <button key={job.id} onClick={() => onJob(job)}><span>{job.company}</span><b>{job.title}</b><small>{job.sourceTier}</small><i>查看证据 ↗</i></button>)}</div>
    </section>
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
      <div className="cx-job-card-top"><span className="cx-company-badge">{job.company.slice(0,1)}</span><div><b>{job.company}</b><small>{job.sourceTier}</small></div><span className={`cx-status ${job.status === "在招" ? "live" : job.status === "招聘项目" ? "program" : "review"}`}>{job.status}</span></div>
      <h2>{job.title}</h2><p>{job.summary}</p>
      <div className="cx-tags">{[...job.ai,...job.skills].slice(0,5).map((tag) => <span key={tag}>{tag}</span>)}{job.skills.length + job.ai.length === 0 && <span className="muted">职责待同步</span>}</div>
      <div className="cx-job-meta"><span>⌖ {job.location}</span><span>◷ {job.date}</span></div>
      <button onClick={() => onJob(job)}>查看原文证据 <b>↗</b></button>
    </article>)}</section>
    {jobs.length === 0 && <div className="cx-panel cx-empty"><strong>没有匹配的已核验记录</strong><p>试试减少筛选条件。Cortex 不会为了填满列表生成不存在的岗位。</p></div>}
  </>;
}

function LearnView({ reviews, onReview, onNotify }: { reviews:Record<string,number>; onReview:(id:string,q:number)=>void; onNotify:()=>void }) {
  const [selected, setSelected] = useState(knowledgeCards[0]);
  return <>
    <PageTitle eyebrow="04 / AI LEARNING" title="从招聘要求到可讲述能力" desc="每个知识点都关联岗位证据、非技术解释、动手练习与艾宾浩斯复习计划。" actions={<button className="cx-primary" onClick={onNotify}>开启浏览器提醒 ♢</button>} />
    <section className="cx-learn-summary">
      <div><span>今日待复习</span><strong>{knowledgeCards.length - Object.keys(reviews).length}</strong><small>按照 1 / 2 / 4 / 7 / 15 / 30 天安排</small></div>
      <div className="cx-review-curve"><span>记忆巩固节奏</span><div>{reviewIntervals.map((day,index) => <i key={day} style={{ height:`${28 + index * 10}px` }}><b>{day}</b></i>)}</div><small>DAY</small></div>
      <div><span>已掌握</span><strong>{Object.values(reviews).filter((value) => value >= 3).length}</strong><small>能解释、能识别、能设计方案</small></div>
    </section>
    <div className="cx-learn-layout">
      <section className="cx-course-list">
        <div className="cx-panel-head"><div><span>KNOWLEDGE MAP</span><h2>优先学习路径</h2></div><small>来自当前岗位证据</small></div>
        {knowledgeCards.map((card,index) => <button key={card.id} className={selected.id === card.id ? "active" : ""} onClick={() => setSelected(card)}>
          <i>{String(index+1).padStart(2,"0")}</i><div><span>{card.level} · {card.minutes} MIN</span><b>{card.title}</b><p>{card.desc}</p></div><strong>{card.relevance}<small>% 相关</small></strong>
        </button>)}
      </section>
      <aside className="cx-panel cx-lesson">
        <div className="cx-lesson-label"><span>{selected.level}</span><b>{selected.minutes} MIN</b></div><h2>{selected.title}</h2><p className="cx-lesson-desc">{selected.desc}</p>
        <h3>为什么与你有关</h3><p>{selected.why}</p>
        <div className="cx-lesson-tags">{selected.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
        <div className="cx-mini-task"><span>MINI PROJECT</span><b>用一个真实 JD 设计 3 个测试问题，并定义“回答合格”的判断标准。</b></div>
        <a href={selected.source} target="_blank" rel="noreferrer">查看岗位/官方学习证据 ↗</a>
        <div className="cx-review-actions"><span>这次掌握得怎样？</span><button onClick={() => onReview(selected.id,1)}>需要重学</button><button onClick={() => onReview(selected.id,3)}>基本掌握</button><button className="good" onClick={() => onReview(selected.id,5)}>可以讲清楚</button></div>
      </aside>
    </div>
  </>;
}

function SourcesView({ onRefresh, onTestModel, modelStatus }: { onRefresh:(name:string)=>void; onTestModel:()=>void; modelStatus:string }) {
  return <>
    <PageTitle eyebrow="05 / SOURCE AUDIT" title="数据来源与可信状态" desc="A/B/C 是自动化可行性分级，不是公司招聘质量评分；任何源站限制都不会被绕过。" actions={<button className="cx-primary" onClick={onTestModel}>测试 AI 连接 · {modelStatus}</button>} />
    <div className="cx-source-legend"><span><b className="cx-level lA">A</b> 公开结构清晰</span><span><b className="cx-level lB">B</b> 条件自动接入</span><span><b className="cx-level lC">C</b> 人工/半自动校验</span></div>
    <section className="cx-source-grid">{companySources.map((source) => <article key={source.name}>
      <div className="cx-source-top"><span className={`cx-level l${source.level}`}>{source.level}</span><div><h2>{source.name}</h2><small>{source.status}</small></div><span className="cx-source-dot" /></div>
      <p>{source.note}</p><div className="cx-source-actions"><a href={source.url} target="_blank" rel="noreferrer">官方入口 ↗</a><button onClick={() => onRefresh(source.name)}>请求更新</button></div>
    </article>)}</section>
    <section className="cx-compliance"><div><span>BLOCKED BY POLICY</span><h2>BOSS 直聘与实习僧</h2></div><p>两家平台协议均限制未经授权的爬虫或批量抓取。连接器保留为“待授权”，取得覆盖聚合用途的书面许可或官方 API 前不会启用。</p><div><a href="https://www.zhipin.com/web/common/protocol/protocol-2019-09-30.html" target="_blank" rel="noreferrer">BOSS 协议 ↗</a><a href="https://www.shixiseng.com/rule" target="_blank" rel="noreferrer">实习僧协议 ↗</a></div></section>
  </>;
}

function JobDrawer({ job, onClose }: { job:JobRecord; onClose:()=>void }) {
  return <div className="cx-overlay" role="button" tabIndex={0} aria-label="关闭岗位详情" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }} onKeyDown={(event) => { if (event.key === "Escape" || event.key === "Enter") onClose(); }}><aside className="cx-drawer">
    <button className="cx-close" onClick={onClose}>×</button><div className="cx-drawer-label"><span>{job.company}</span><b>{job.sourceTier}</b></div><h1>{job.title}</h1><div className="cx-drawer-meta"><span>{job.track}</span><span>{job.location}</span><span>{job.date}</span></div>
    <section><h3>结构化摘要</h3><p>{job.summary}</p></section>
    <section><h3>AI 与业务标签</h3><div className="cx-tags">{[...job.ai,...job.skills].map((tag) => <span key={tag}>{tag}</span>)}{!job.ai.length && !job.skills.length && <span className="muted">公开职责不足，未生成标签</span>}</div></section>
    <section><h3>原文证据片段</h3><ul className="cx-evidence-list">{job.evidence.map((item,index) => <li key={item}><i>{String(index+1).padStart(2,"0")}</i><span>{item}</span></li>)}</ul></section>
    <div className="cx-integrity-note"><b>证据规则</b><p>未在公开原文中出现的能力不计入统计；“未明示”不等于公司不需要。</p></div>
    <a className="cx-source-link" href={job.sourceUrl} target="_blank" rel="noreferrer">前往官方来源 <b>↗</b></a>
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
      <form onSubmit={submit}>{mode === "signup" && <><label>角色名称<input name="username" required minLength={2} placeholder="例如：AI 产品探索者" /></label><div className="cx-form-row"><label>身份阶段<select name="stage"><option>本科在校生</option><option>硕士在校生</option><option>博士在校生</option><option>应届生</option></select></label><label>目标方向<select name="target"><option>产品</option><option>运营</option><option>尚未确定</option></select></label></div></>}<label>邮箱<input name="email" type="email" required placeholder="name@example.com" /></label><label>密码<input name="password" type="password" required minLength={8} placeholder="至少 8 位" /></label>{error && <div className="cx-form-error">{error}</div>}<button className="cx-auth-submit" disabled={loading}>{loading ? "处理中…" : mode === "login" ? "登录 Cortex" : "创建 Cortex 账号"}</button></form>
      {!config.configured && <div className="cx-auth-status"><i /> Supabase 账号服务等待项目授权</div>}
    </>}
  </div></div>;
}
