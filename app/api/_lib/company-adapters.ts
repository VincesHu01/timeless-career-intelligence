type JsonRecord = Record<string, unknown>;

export type AdapterJob = {
  id: string;
  title: string;
  location: string;
  track: string;
  description: string;
  requirements: string;
  sourceUrl: string;
};

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

function record(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
}

function list(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? value.map(record) : [];
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : typeof value === "number" ? String(value) : "";
}

function texts(value: unknown): string[] {
  return Array.isArray(value) ? value.map(text).filter(Boolean) : [];
}

function htmlText(value: unknown): string {
  return text(value)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function jsonRequest(url: string, init: RequestInit, timeout = 25_000): Promise<JsonRecord> {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(timeout) });
  if (!response.ok) throw new Error(`官方职位接口返回 HTTP ${response.status}`);
  return record(await response.json());
}

function dedupe(rows: AdapterJob[], cap = 120) {
  return [...new Map(rows.filter((row) => row.id && row.title).map((row) => [row.id, row])).values()].slice(0, cap);
}

function isTarget(title: string) {
  return /(产品经理|产品策划|运营|管培生)/i.test(title)
    && !/(新媒体|内容运营|内容营销|内容编辑|短视频运营|直播运营|社交媒体|小红书运营|公众号运营|文案运营|社区内容)/i.test(title);
}

async function fetchMeituan(): Promise<AdapterJob[]> {
  const root = "https://zhaopin.meituan.com";
  const rows: AdapterJob[] = [];
  for (const keyword of ["产品", "运营"]) {
    for (let pageNo = 1; pageNo <= 4; pageNo += 1) {
      const payload = await jsonRequest(`${root}/api/official/job/getJobList`, {
        method: "POST",
        headers: { "User-Agent": UA, Accept: "application/json", "Content-Type": "application/json", Origin: root, Referer: `${root}/web/social` },
        body: JSON.stringify({ page: { pageNo, pageSize: 100 }, jobShareType: "1", keywords: keyword, cityList: [], department: [], jobType: ["1", "2", "3"].map((code) => ({ code, subCode: [] })) }),
      });
      const data = record(payload.data);
      const batch = list(data.list);
      for (const item of batch) {
        const title = text(item.name);
        if (!isTarget(title)) continue;
        const id = text(item.jobUnionId);
        const cities = list(item.cityList).map((city) => text(city.name)).filter(Boolean).join(" / ");
        const type = text(item.jobType);
        rows.push({ id, title, location: cities || "以官方详情为准", track: type === "1" ? "校园招聘" : type === "2" ? "实习" : "社会招聘", description: htmlText(item.jobDuty || item.desc || item.departmentIntro), requirements: htmlText(item.jobRequirement || item.highLight || item.precedence), sourceUrl: `${root}/web/position/detail?jobUnionId=${encodeURIComponent(id)}&jobShareType=1&highlightType=${type === "3" ? "social" : "campus"}` });
      }
      const page = record(data.page);
      if (batch.length < 100 || pageNo >= Number(page.totalPage || 1)) break;
    }
  }
  return dedupe(rows);
}

async function fetchKuaishou(): Promise<AdapterJob[]> {
  const root = "https://campus.kuaishou.cn/recruit/campus/e";
  const rows: AdapterJob[] = [];
  for (const keyword of ["产品", "运营"]) {
    for (let pageNum = 1; pageNum <= 8; pageNum += 1) {
      const payload = await jsonRequest(`${root}/api/v1/open/positions/simple`, {
        method: "POST",
        headers: { "User-Agent": UA, Accept: "application/json", "Content-Type": "application/json", Origin: "https://campus.kuaishou.cn", Referer: `${root}/` },
        body: JSON.stringify({ pageNum, pageSize: 100, name: keyword }),
      });
      if (Number(payload.code) !== 0) throw new Error(text(payload.message) || "快手官方职位接口返回异常");
      const data = record(payload.result);
      const batch = list(data.list);
      for (const item of batch) {
        const title = text(item.name);
        if (!isTarget(title)) continue;
        const id = text(item.code || item.id);
        const locations = list(item.workLocationDicts).map((city) => text(city.name)).filter(Boolean).join(" / ");
        rows.push({ id, title, location: locations || "以官方详情为准", track: text(item.positionNatureCode) === "intern" ? "实习" : "校园招聘", description: htmlText(item.description), requirements: htmlText(item.positionDemand), sourceUrl: `${root}/#/campus/job-info/?code=${encodeURIComponent(id)}` });
      }
      if (batch.length < 100 || rows.length >= Number(data.total || 0)) break;
    }
  }
  return dedupe(rows);
}

async function fetchJd(): Promise<AdapterJob[]> {
  const root = "https://campus.jd.com";
  const rows: AdapterJob[] = [];
  for (const recruitType of ["present", "internship", "talent"]) {
    for (const keyword of ["产品", "运营"]) {
      for (let pageIndex = 0; pageIndex < 6; pageIndex += 1) {
        const payload = await jsonRequest(`${root}/api/wx/position/page?type=${recruitType}`, {
          method: "POST",
          headers: { "User-Agent": UA, Accept: "application/json", "Content-Type": "application/json", Referer: `${root}/` },
          body: JSON.stringify({ pageSize: 200, pageIndex, parameter: { positionName: keyword, planIdList: [], positionDeptList: [], jobDirectionCodeList: [], workCityCodeList: [] } }),
        });
        if (payload.success !== true) throw new Error(text(payload.errorMessage) || "京东官方职位接口返回异常");
        const body = record(payload.body);
        const batch = list(body.items);
        for (const item of batch) {
          const title = text(item.positionName);
          if (!isTarget(title)) continue;
          const id = text(item.publishId);
          const requirements = list(item.requirementVoList);
          const locations = [...new Set(requirements.map((entry) => text(entry.workCity)).filter(Boolean))].join(" / ");
          rows.push({ id, title, location: locations || "以官方详情为准", track: recruitType === "present" ? "校园招聘" : recruitType === "internship" ? "实习" : "人才计划", description: htmlText(item.workContent), requirements: htmlText(item.qualification), sourceUrl: `${root}/#/newDetails?publishId=${encodeURIComponent(id)}` });
        }
        if (batch.length < 200 || (pageIndex + 1) * 200 >= Number(body.totalNumber || 0)) break;
      }
    }
  }
  return dedupe(rows);
}

async function fetchNetease(): Promise<AdapterJob[]> {
  const root = "https://hr.163.com";
  const rows: AdapterJob[] = [];
  for (const workType of ["1", "0"]) {
    for (const keyword of ["产品", "运营"]) {
      for (let currentPage = 1; currentPage <= 12; currentPage += 1) {
        const payload = await jsonRequest(`${root}/api/hr163/position/queryPage`, {
          method: "POST",
          headers: { "User-Agent": UA, Accept: "application/json", "Content-Type": "application/json", Origin: root, Referer: `${root}/job-list` },
          body: JSON.stringify({ currentPage, pageSize: 200, workType, keyword }),
        });
        if (Number(payload.code) !== 200) throw new Error(text(payload.message) || "网易官方职位接口返回异常");
        const data = record(payload.data);
        const batch = list(data.list);
        for (const item of batch) {
          const title = text(item.name);
          if (!isTarget(title)) continue;
          const id = text(item.id);
          rows.push({ id, title, location: texts(item.workPlaceNameList).join(" / ") || "以官方详情为准", track: workType === "1" ? "校园招聘 / 实习" : "社会招聘", description: htmlText(item.description), requirements: htmlText(item.requirement), sourceUrl: `${root}/job-detail?id=${encodeURIComponent(id)}` });
        }
        if (batch.length < 200 || currentPage >= Number(data.pages || 1)) break;
      }
    }
  }
  return dedupe(rows);
}

async function fetchCtrip(): Promise<AdapterJob[]> {
  const root = "https://careers.ctrip.com";
  const payload = await jsonRequest(`${root}/api/hrrecruit/getJobAd`, {
    method: "POST",
    headers: { "User-Agent": UA, Accept: "application/json", "Content-Type": "application/json", Origin: root, Referer: `${root}/campus` },
    body: JSON.stringify({ condition: { pageIndex: 1, pageSize: 100 } }),
  });
  if (text(payload.retCode) !== "201") throw new Error(text(payload.retMessage) || "携程官方职位接口返回异常");
  const rows = list(record(payload.retValue).recruitJobAdList).flatMap((item) => {
    const title = text(item.jobTitle);
    if (!isTarget(title)) return [];
    const id = text(item.fromId || item.jobId || item.id);
    return [{ id, title, location: text(item.cityName || item.city) || "以官方详情为准", track: text(item.kind) === "3" ? "实习" : text(item.category) === "2" ? "校园招聘" : "社会招聘", description: htmlText(item.duty || item.requirements), requirements: htmlText(item.requirements), sourceUrl: `${root}/campus#/experienced/job-detail/${encodeURIComponent(text(item.fromId) || id)}` }];
  });
  return dedupe(rows);
}

async function fetchPdd(): Promise<AdapterJob[]> {
  const root = "https://careers.pinduoduo.com";
  const rows: AdapterJob[] = [];
  for (const path of ["/api/careers/api/recruit/position/list", "/api/careers/api/recruit/position/train/list"]) {
    for (let page = 1; page <= 12; page += 1) {
      const payload = await jsonRequest(`${root}${path}`, {
        method: "POST",
        headers: { "User-Agent": UA, Accept: "application/json", "Content-Type": "application/json", Origin: root, Referer: `${root}/campus/grad` },
        body: JSON.stringify({ pageSize: 10, page }),
      });
      if (payload.success !== true) throw new Error(text(payload.errorMsg) || "拼多多官方职位接口返回异常");
      const data = record(payload.result);
      const batch = list(data.list);
      for (const item of batch) {
        const title = text(item.name);
        if (!isTarget(title)) continue;
        const id = text(item.id);
        rows.push({ id, title, location: text(item.workLocationName || item.workLocation) || "以官方详情为准", track: path.includes("train") ? "实习" : text(item.recruitTypeName) || "校园招聘", description: htmlText(item.jobDuty), requirements: htmlText(item.jobDuty), sourceUrl: `${root}/campus/grad?id=${encodeURIComponent(id)}` });
      }
      if (batch.length < 10 || page * 10 >= Number(data.total || 0)) break;
    }
  }
  return dedupe(rows);
}

async function fetchXiaohongshu(): Promise<AdapterJob[]> {
  const root = "https://job.xiaohongshu.com";
  const summaries: Array<{ item: JsonRecord; channel: "campus" | "social" }> = [];
  for (const channel of ["campus", "social"] as const) {
    for (const keyword of ["产品", "运营"]) {
      for (let pageNum = 1; pageNum <= 10; pageNum += 1) {
        const payload = await jsonRequest(`${root}/websiterecruit/position/pageQueryPosition`, {
          method: "POST",
          headers: { "User-Agent": UA, Accept: "application/json", "Content-Type": "application/json", Origin: root, Referer: `${root}/${channel}/position` },
          body: JSON.stringify({ recruitType: channel, pageNum, pageSize: 100, positionName: keyword }),
        });
        const data = record(payload.data);
        const batch = list(data.list);
        summaries.push(...batch.map((item) => ({ item, channel })));
        if (batch.length < 100 || pageNum >= Number(data.totalPage || 1)) break;
      }
    }
  }
  const unique = [...new Map(summaries.map((row) => [text(row.item.positionId), row])).values()]
    .filter(({ item }) => isTarget(text(item.positionName))).slice(0, 120);
  const rows = await Promise.all(unique.map(async ({ item, channel }) => {
    const id = text(item.positionId);
    let detail = item;
    try {
      const payload = await jsonRequest(`${root}/websiterecruit/position/queryPositionDetail?positionId=${encodeURIComponent(id)}`, { headers: { "User-Agent": UA, Accept: "application/json", Referer: `${root}/${channel}/position/${id}` } });
      detail = { ...item, ...record(payload.data) };
    } catch { /* list evidence remains usable */ }
    return { id, title: text(detail.positionName), location: text(detail.workplace) || "以官方详情为准", track: channel === "social" ? "社会招聘" : text(detail.jobProjectName) || "校园招聘 / 实习", description: htmlText(detail.duty), requirements: htmlText(detail.qualification), sourceUrl: `${root}/${channel}/position/${encodeURIComponent(id)}` };
  }));
  return dedupe(rows);
}

async function fetchBilibili(): Promise<AdapterJob[]> {
  const root = "https://jobs.bilibili.com";
  const baseHeaders = { "User-Agent": UA, Accept: "application/json", "Content-Type": "application/json", "X-AppKey": "ops.ehr-api.auth", "X-UserType": "2", Referer: `${root}/` };
  const tokenPayload = await jsonRequest(`${root}/api/auth/v1/csrf/token`, { headers: baseHeaders });
  if (Number(tokenPayload.code) !== 0 || !text(tokenPayload.data)) throw new Error(text(tokenPayload.message) || "Bilibili 匿名校验失败");
  const token = text(tokenPayload.data);
  const rows: AdapterJob[] = [];
  for (const channel of ["campus", "social"] as const) {
    const path = channel === "social" ? "/api/srs/position/positionList" : "/api/campus/position/positionList";
    for (const keyword of ["产品", "运营"]) {
      for (let pageNum = 1; pageNum <= 8; pageNum += 1) {
        const payload = await jsonRequest(`${root}${path}`, { method: "POST", headers: { ...baseHeaders, "X-CSRF": token, Cookie: `X-CSRF=${token}` }, body: JSON.stringify({ pageNum, pageSize: 100, positionName: keyword, deptCodeList: [], workTypeList: [], positionTypeList: [], workLocationList: [] }) });
        if (Number(payload.code) !== 0) throw new Error(text(payload.message) || "Bilibili 官方职位接口返回异常");
        const data = record(payload.data);
        const batch = list(data.list);
        for (const item of batch) {
          const title = text(item.positionName);
          if (!isTarget(title)) continue;
          const id = text(item.id);
          const full = htmlText(item.positionDescription);
          rows.push({ id, title, location: text(item.workLocation) || "以官方详情为准", track: channel === "social" ? "社会招聘" : text(item.positionTypeName) || "校园招聘 / 实习", description: full, requirements: full, sourceUrl: `${root}/${channel}/positions/${encodeURIComponent(id)}` });
        }
        if (batch.length < 100 || pageNum * 100 >= Number(data.total || 0)) break;
      }
    }
  }
  return dedupe(rows);
}

async function fetchMihoyo(): Promise<AdapterJob[]> {
  const api = "https://ats.openout.mihoyo.com/ats-portal";
  const portal = "https://jobs.mihoyo.com";
  const headers = { "User-Agent": UA, Accept: "application/json", "Content-Type": "application/json", Origin: portal, Referer: `${portal}/` };
  const summaries: JsonRecord[] = [];
  for (const hireType of [0, 1]) {
    for (const keyword of ["产品", "运营"]) {
      for (let pageNo = 1; pageNo <= 8; pageNo += 1) {
        const payload = await jsonRequest(`${api}/v1/job/list`, { method: "POST", headers, body: JSON.stringify({ channelDetailIds: [1], hireType, pageSize: 100, pageNo, jobName: keyword }) });
        if (Number(payload.code) !== 0) throw new Error(text(payload.message) || "米哈游官方职位接口返回异常");
        const data = record(payload.data);
        const batch = list(data.list).map((item) => ({ ...item, _hireType: hireType }));
        summaries.push(...batch);
        if (batch.length < 100 || pageNo * 100 >= Number(data.total || 0)) break;
      }
    }
  }
  const unique = [...new Map(summaries.map((item) => [text(item.id), item])).values()].filter((item) => isTarget(text(item.title))).slice(0, 120);
  const rows = await Promise.all(unique.map(async (item) => {
    const id = text(item.id);
    let detail = item;
    try {
      const payload = await jsonRequest(`${api}/v1/job/info`, { method: "POST", headers, body: JSON.stringify({ id, channelDetailIds: [1] }) });
      detail = { ...item, ...record(payload.data) };
    } catch { /* retain list data */ }
    const locations = list(detail.addressDetailList).map((entry) => text(entry.addressDetail)).filter(Boolean).join(" / ");
    return { id, title: text(detail.title), location: locations || "以官方详情为准", track: Number(item._hireType) === 1 ? "校园招聘 / 实习" : "社会招聘", description: htmlText(detail.description || detail.jobSummary), requirements: htmlText(detail.jobRequire || detail.addition), sourceUrl: `${portal}/#/position/${encodeURIComponent(id)}` };
  }));
  return dedupe(rows);
}

async function fetchDewu(): Promise<AdapterJob[]> {
  const host = "campus.dewu.com";
  const channel = "578078";
  const root = `https://${host}`;
  const rows: AdapterJob[] = [];
  for (const keyword of ["产品", "运营"]) {
    for (let offset = 0; offset < 600; offset += 100) {
      const payload = await jsonRequest(`${root}/api/v1/search/job/posts`, {
        method: "POST",
        headers: { "User-Agent": UA, Accept: "application/json", "Content-Type": "application/json", "portal-channel": channel, "portal-platform": "pc", "website-path": channel, Origin: root, Referer: `${root}/${channel}/position/list` },
        body: JSON.stringify({ keyword, limit: 100, offset, portal_type: 3, portal_entrance: 1, language: "zh" }),
      });
      if (Number(payload.code) !== 0) throw new Error(text(payload.message) || "得物官方职位接口返回异常");
      const data = record(payload.data);
      const batch = list(data.job_post_list);
      for (const item of batch) {
        const title = text(item.title);
        if (!isTarget(title)) continue;
        const id = text(item.id);
        const locations = list(item.city_list).map((city) => text(city.name)).filter(Boolean).join(" / ");
        const recruitType = record(item.recruit_type);
        rows.push({ id, title, location: locations || text(record(item.city_info).name) || "以官方详情为准", track: text(recruitType.name) || "校园招聘 / 实习", description: htmlText(item.description), requirements: htmlText(item.requirement), sourceUrl: `${root}/${channel}/position/${encodeURIComponent(id)}/detail` });
      }
      if (batch.length < 100 || offset + 100 >= Number(data.count || data.total || 0)) break;
    }
  }
  return dedupe(rows);
}

type AliCsrf = { token: string; session: string };

async function fetchAlibaba(): Promise<AdapterJob[]> {
  const root = "https://campus-talent.alibaba.com";
  const landing = await fetch(`${root}/campus/position`, { headers: { "User-Agent": UA, Accept: "text/html" }, signal: AbortSignal.timeout(25_000) });
  if (!landing.ok) throw new Error(`阿里巴巴招聘入口返回 HTTP ${landing.status}`);
  const getSetCookie = (landing.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie;
  const cookies = typeof getSetCookie === "function" ? getSetCookie.call(landing.headers) : [landing.headers.get("set-cookie") || ""];
  const csrf: AliCsrf = { token: "", session: "" };
  for (const cookie of cookies) {
    const token = cookie.match(/(?:^|,\s*)XSRF-TOKEN=([^;,]+)/)?.[1];
    const session = cookie.match(/(?:^|,\s*)SESSION=([^;,]+)/)?.[1];
    if (token) csrf.token = token;
    if (session) csrf.session = session;
  }
  if (!csrf.token) throw new Error("阿里巴巴官方招聘接口未签发公开校验令牌");
  const call = async (path: string, body: unknown) => {
    const payload = await jsonRequest(`${root}${path}`, { method: "POST", headers: { "User-Agent": UA, Accept: "application/json", "Content-Type": "application/json", Referer: `${root}/campus/position`, "X-XSRF-TOKEN": csrf.token, Cookie: `XSRF-TOKEN=${csrf.token}${csrf.session ? `; SESSION=${csrf.session}` : ""}` }, body: JSON.stringify(body) });
    if (payload.success === false) throw new Error(text(payload.errorMsg || payload.errorCode) || "阿里巴巴官方职位接口返回异常");
    return record(payload.content);
  };
  const batchPayload = await call("/searchCondition/listBatch", { channel: "new_campus_group_official_site", language: "zh" });
  const batches = [...list(batchPayload.graduate), ...list(batchPayload.internship), ...list(batchPayload.topTalentPlan)];
  const uniqueBatches = [...new Map(batches.map((batch) => [text(batch.id), batch])).values()];
  const rows: AdapterJob[] = [];
  for (const batch of uniqueBatches) {
    for (const keyword of ["产品", "运营"]) {
      for (let pageIndex = 1; pageIndex <= 8; pageIndex += 1) {
        const data = await call("/position/search", { batchId: Number(batch.id), pageIndex, pageSize: 100, channel: "new_campus_group_official_site", language: "zh", searchKey: keyword });
        const found = list(data.datas);
        for (const item of found) {
          const title = text(item.name);
          if (!isTarget(title)) continue;
          const id = text(item.id);
          rows.push({ id, title, location: texts(item.workLocations).join(" / ") || "以官方详情为准", track: text(item.batchName || batch.name || item.categoryType) || "校园招聘 / 实习", description: htmlText(item.description), requirements: htmlText(item.requirement), sourceUrl: `${root}/campus/position/${encodeURIComponent(id)}` });
        }
        if (found.length < 100 || pageIndex * 100 >= Number(data.totalCount || 0)) break;
      }
    }
  }
  return dedupe(rows);
}

export async function fetchStructuredCompany(company: string): Promise<AdapterJob[] | null> {
  if (company === "阿里巴巴") return fetchAlibaba();
  if (company === "美团") return fetchMeituan();
  if (company === "快手") return fetchKuaishou();
  if (company === "携程") return fetchCtrip();
  if (company === "京东") return fetchJd();
  if (company === "拼多多") return fetchPdd();
  if (company === "得物") return fetchDewu();
  if (company === "网易") return fetchNetease();
  if (company === "Bilibili") return fetchBilibili();
  if (company === "米哈游") return fetchMihoyo();
  if (company === "小红书") return fetchXiaohongshu();
  return null;
}
