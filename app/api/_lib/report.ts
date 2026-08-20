import { desc, eq, gte } from "drizzle-orm";
import { getDb } from "../../../db";
import { jobs, weeklyReports } from "../../../db/schema";

function parseList(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function weekBounds(date = new Date()) {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() - day + 1);
  const start = utc.toISOString().slice(0, 10);
  const endDate = new Date(utc);
  endDate.setUTCDate(endDate.getUTCDate() + 6);
  return { start, end: endDate.toISOString().slice(0, 10) };
}

export async function generateWeeklyReport() {
  const db = getDb();
  const { start, end } = weekBounds();
  const allJobs = await db.select().from(jobs).where(eq(jobs.status, "在招"));
  const newThisWeek = await db.select().from(jobs).where(gte(jobs.firstSeenAt, `${start} 00:00:00`));
  const companies = new Set(allJobs.map((job) => job.company));
  const aiJobs = allJobs.filter((job) => parseList(job.aiSkillsJson).length > 0);
  const offline = await db.select().from(jobs).where(eq(jobs.status, "已下线"));

  const groups = new Map<string, typeof allJobs>();
  allJobs.forEach((job) => {
    const key = `${job.clusterKey}｜${job.recruitmentTrack}`;
    groups.set(key, [...(groups.get(key) || []), job]);
  });
  const clusters = [...groups.entries()]
    .map(([key, records]) => ({
      key,
      roleFamily: records[0]?.clusterKey || "未分类",
      recruitmentTrack: records[0]?.recruitmentTrack || "未明示",
      count: records.length,
      companies: [...new Set(records.map((job) => job.company))],
      skills: topTerms(records.flatMap((job) => parseList(job.skillsJson))),
      aiSkills: topTerms(records.flatMap((job) => parseList(job.aiSkillsJson))),
      bonusSignals: topTerms(records.flatMap((job) => parseList(job.bonusSignalsJson))),
      jobIds: records.map((job) => job.id),
    }))
    .sort((a, b) => b.count - a.count);

  const sources = [...new Map(allJobs.map((job) => [job.sourceUrl, { company: job.company, title: job.title, url: job.sourceUrl }])).values()];
  const metrics = {
    activeJobs: allJobs.length,
    newJobs: newThisWeek.length,
    offlineJobs: offline.length,
    companies: companies.size,
    aiMentionJobs: aiJobs.length,
    analyzableClusters: clusters.filter((cluster) => cluster.count >= 3 && cluster.companies.length >= 2).length,
  };
  const summary = allJobs.length
    ? `本周数据库包含 ${metrics.activeJobs} 个在招岗位，覆盖 ${metrics.companies} 家公司；其中 ${metrics.aiMentionJobs} 个岗位在原文中明确提及 AI 知识或工具。跨公司能力结论仅对至少覆盖 2 家公司且样本不少于 3 条的岗位簇开放。`
    : "本周尚无通过原文证据校验的动态岗位；系统不会用推断数据填充趋势。";
  const report = {
    id: `weekly-${start}`,
    weekStart: start,
    weekEnd: end,
    title: `${start}—${end} 招聘趋势周报`,
    summary,
    metricsJson: JSON.stringify(metrics),
    clustersJson: JSON.stringify(clusters),
    sourceLinksJson: JSON.stringify(sources),
  };
  await db.insert(weeklyReports).values(report).onConflictDoUpdate({
    target: weeklyReports.weekStart,
    set: report,
  });
  return { ...report, metrics, clusters, sources };
}

export async function getLatestWeeklyReport() {
  const db = getDb();
  const [report] = await db.select().from(weeklyReports).orderBy(desc(weeklyReports.weekStart)).limit(1);
  if (!report) return null;
  return {
    ...report,
    metrics: JSON.parse(report.metricsJson),
    clusters: JSON.parse(report.clustersJson),
    sources: JSON.parse(report.sourceLinksJson),
  };
}

function topTerms(values: string[]) {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-CN"))
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));
}
