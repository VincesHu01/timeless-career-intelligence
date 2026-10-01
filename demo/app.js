const jobs=[
 {title:"AI 产品经理",company:"字节跳动",track:"社会招聘",city:"北京",date:"2026-09-29",skills:["Agent","模型评测","数据分析"],summary:"负责智能体产品规划、评测体系与用户反馈闭环。",evidence:["理解大模型能力边界与典型失败模式","建立离线与在线评测指标","使用数据推动产品迭代"]},
 {title:"增长产品经理",company:"腾讯",track:"校园招聘",city:"深圳",date:"2026-09-28",skills:["A/B 测试","SQL","指标体系"],summary:"通过实验和数据分析提升产品增长效率。",evidence:["能拆解北极星指标","熟悉实验设计与统计判断","具备基础 SQL 能力"]},
 {title:"内容策略运营",company:"小红书",track:"校园招聘",city:"上海",date:"2026-09-27",skills:["内容策略","AI 工作流","用户研究"],summary:"识别社区内容机会，设计人机协作的运营流程。",evidence:["理解内容生态与创作者需求","能够使用 AI 工具提升生产效率","具备定性用户研究能力"]},
 {title:"商业产品经理",company:"阿里巴巴",track:"社会招聘",city:"杭州",date:"2026-09-25",skills:["商业化","需求分析","跨团队协作"],summary:"围绕商家经营场景设计平台产品与商业机制。",evidence:["能够抽象复杂业务流程","协调产研与业务团队","关注收入和客户价值"]},
 {title:"用户运营",company:"美团",track:"校园招聘",city:"北京",date:"2026-09-23",skills:["用户分层","活动运营","数据分析"],summary:"基于用户生命周期制定精细化运营策略。",evidence:["建立用户分层策略","复盘活动效果","使用数据识别增长机会"]},
 {title:"AI 策略产品经理",company:"腾讯",track:"社会招聘",city:"深圳",date:"2026-09-21",skills:["Prompt","RAG","产品策略"],summary:"将模型能力转化为可控、可评估的业务方案。",evidence:["熟悉 RAG 与提示工程","定义模型效果标准","分析业务落地优先级"]},
 {title:"供应链产品经理",company:"美团",track:"社会招聘",city:"上海",date:"2026-09-19",skills:["供应链","流程设计","项目管理"],summary:"优化履约流程并建设供应链数字化产品。",evidence:["理解履约关键节点","具备复杂项目推进能力","能用指标评估流程效率"]},
 {title:"国际化产品运营",company:"字节跳动",track:"校园招聘",city:"上海",date:"2026-09-17",skills:["市场洞察","英语","数据分析"],summary:"支持海外产品增长、市场研究与跨文化运营。",evidence:["英语可作为工作语言","分析海外用户行为","跨时区协调合作方"]}
];
const capabilities=[
 ["数据分析",[92,84,88,96,79]],["用户研究",[76,82,71,74,69]],["AI 应用",[63,57,98,72,81]],["实验设计",[70,61,82,95,77]],["业务抽象",[89,72,91,85,94]],["跨团队协作",[86,88,90,84,92]]
];
const lessons=[
 {name:"大模型产品基础",meta:"5 个岗位提及 · 45 分钟",body:"理解上下文窗口、幻觉、工具调用和模型评测，重点不是记术语，而是判断模型适合解决什么问题。",tasks:["画出一个 Agent 的输入—决策—工具—反馈链路","为问答产品设计 3 个效果指标","记录一个模型失败案例并归因"]},
 {name:"RAG 与知识检索",meta:"3 个岗位提及 · 35 分钟",body:"理解检索增强生成如何把企业知识接入模型，以及召回、重排和引用如何共同影响答案可信度。",tasks:["比较关键词与语义召回","设计一条可追溯引用","列出知识库更新风险"]},
 {name:"AI 产品评测",meta:"6 个岗位提及 · 50 分钟",body:"从业务目标出发构造评测集，结合准确性、可用性、安全性、成本与延迟做多维判断。",tasks:["写 10 条代表性测试问题","定义通过与失败标准","设计人工抽检流程"]},
 {name:"数据实验方法",meta:"7 个岗位提及 · 40 分钟",body:"将模糊的增长目标转成可验证假设，理解样本、对照、指标污染和实验结论的适用边界。",tasks:["写出一个可证伪假设","选择主指标与护栏指标","识别三类实验偏差"]}
];
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>s.replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const titles={radar:"市场雷达",jobs:"岗位情报库",matrix:"能力矩阵",learning:"AI 学习路径"};
function switchView(id){$$(".nav,.view").forEach(x=>x.classList.remove("active"));$('[data-view="'+id+'"]').classList.add("active");$("#"+id).classList.add("active");$("#viewTitle").textContent=titles[id];window.scrollTo({top:0,behavior:"smooth"})}
$(".sidebar nav").onclick=e=>{const b=e.target.closest("[data-view]");if(b)switchView(b.dataset.view)};
const companies=[...new Set(jobs.map(j=>j.company))];$("#companyFilter").innerHTML+=companies.map(x=>`<option>${x}</option>`).join("");
function renderJobs(){const q=$("#jobQuery").value.trim().toLowerCase(),co=$("#companyFilter").value,tr=$("#trackFilter").value;const list=jobs.filter(j=>(!q||JSON.stringify(j).toLowerCase().includes(q))&&(!co||j.company===co)&&(!tr||j.track===tr));$("#jobCount").textContent=`找到 ${list.length} 条可追溯岗位证据`;$("#jobList").innerHTML=list.length?list.map((j,i)=>`<article class="job" data-job="${jobs.indexOf(j)}" tabindex="0"><div><h3>${esc(j.title)}</h3><p>${esc(j.summary)}</p></div><span class="company">${j.company} · ${j.city}</span><span class="track">${j.track}<br>${j.date}</span><div class="tags">${j.skills.map(s=>`<span>${s}</span>`).join("")}</div><span>查看</span></article>`).join(""):`<div class="empty">没有符合当前条件的岗位。试试清除筛选。</div>`}
["jobQuery","companyFilter","trackFilter"].forEach(id=>$("#"+id).addEventListener(id==="jobQuery"?"input":"change",renderJobs));$("#clearFilters").onclick=()=>{$("#jobQuery").value="";$("#companyFilter").value="";$("#trackFilter").value="";renderJobs()};
function openJob(i){const j=jobs[i];$("#drawerContent").innerHTML=`<p class="meta">${j.company} · ${j.city} · ${j.track} · ${j.date}</p><h2>${j.title}</h2><p>${j.summary}</p><h3>岗位原文中的能力证据</h3><ul>${j.evidence.map(x=>`<li>${x}</li>`).join("")}</ul><h3>提取的能力标签</h3><p>${j.skills.join("　")}</p><p class="meta">这是合成演示岗位，不指向真实招聘页面。</p>`;$("#drawer").classList.add("open");$("#drawer").setAttribute("aria-hidden","false")}
$("#jobList").onclick=e=>{const j=e.target.closest("[data-job]");if(j)openJob(+j.dataset.job)};$("#jobList").onkeydown=e=>{if((e.key==="Enter"||e.key===" ")&&e.target.closest("[data-job]"))openJob(+e.target.closest("[data-job]").dataset.job)};
$("#closeDrawer").onclick=()=>{$("#drawer").classList.remove("open");$("#drawer").setAttribute("aria-hidden","true")};$("#drawer").onclick=e=>{if(e.target===$("#drawer"))$("#closeDrawer").click()};
$$("[data-company]").forEach(b=>b.onclick=()=>{switchView("jobs");$("#companyFilter").value=b.dataset.company;renderJobs()});$$("[data-open-job]").forEach(b=>b.onclick=()=>{switchView("jobs");$("#jobQuery").value=b.dataset.openJob;renderJobs()});
function renderMatrix(){$("#matrixBody").innerHTML=capabilities.map(([name,vals])=>`<tr><td><b>${name}</b></td>${vals.map((v,i)=>`<td><button class="cell ${v>85?"high":v>72?"mid":"low"}" data-cap="${name}" data-value="${v}" aria-label="${name} ${v} 分">${v}</button></td>`).join("")}</tr>`).join("")}$("#matrixBody").onclick=e=>{const b=e.target.closest("[data-cap]");if(!b)return;$("#capTitle").textContent=b.dataset.cap;$("#capDesc").textContent=`该能力在所选岗位方向的证据强度为 ${b.dataset.value}/100。分数来自示例岗位原文的出现频率与要求强度。`;$("#capEvidence").innerHTML=jobs.filter(j=>j.skills.some(s=>s.includes(b.dataset.cap)||b.dataset.cap.includes("AI")&&["Agent","RAG","Prompt"].includes(s))).slice(0,3).map(j=>`<div class="evidence-item">${j.company} · ${j.title}：${j.evidence[0]}</div>`).join("")||`<div class="evidence-item">点击其他单元格，比较不同岗位方向的证据强度。</div>`};
function renderLessons(){ $("#lessonList").innerHTML=lessons.map((l,i)=>`<button data-lesson="${i}" class="${i===0?"active":""}"><b>${l.name}</b><span>${l.meta}</span></button>`).join("");openLesson(0)}function openLesson(i){const l=lessons[i];$$("[data-lesson]").forEach(x=>x.classList.toggle("active",+x.dataset.lesson===i));$("#lessonDetail").innerHTML=`<p class="eyebrow">LEARNING UNIT ${String(i+1).padStart(2,"0")}</p><h3>${l.name}</h3><p>${l.body}</p><div class="lesson-tasks">${l.tasks.map((t,n)=>`<div><b>${n+1}. 实践任务</b><br>${t}</div>`).join("")}</div>`}$("#lessonList").onclick=e=>{const b=e.target.closest("[data-lesson]");if(b)openLesson(+b.dataset.lesson)};
renderJobs();renderMatrix();renderLessons();
