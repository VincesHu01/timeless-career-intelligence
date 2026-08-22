import { desc } from "drizzle-orm";
import { getDb } from "../../../db";
import { jobs } from "../../../db/schema";
import { extractAiTechnicalTerms } from "../../ai-taxonomy";

function list(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function GET(request:Request) {
  const url=new URL(request.url);
  const limit=Math.min(500,Math.max(1,Number(url.searchParams.get("limit")) || 500));
  const offset=Math.max(0,Number(url.searchParams.get("offset")) || 0);
  const db = getDb();
  const records = await db.select().from(jobs).orderBy(desc(jobs.lastSeenAt)).limit(limit).offset(offset);
  return Response.json({
    jobs: records.map((job) => ({
      id: job.id,
      company: job.company,
      title: job.title,
      family: job.roleFamily,
      roleType: job.roleType,
      track: job.recruitmentTrack,
      location: job.location,
      experienceLevel: job.experienceLevel,
      date: job.sourcePublishedAt || job.lastSeenAt.slice(0, 10),
      sourceTier: job.sourceTier,
      sourceUrl: job.sourceUrl,
      summary: job.summary,
      skills: list(job.skillsJson),
      ai: extractAiTechnicalTerms(list(job.aiSkillsJson)),
      bonusSignals: list(job.bonusSignalsJson),
      evidence: list(job.evidenceJson),
      technicalRequirements: job.technicalRequirements,
      experienceRequirements: job.experienceRequirements,
      softRequirements: job.softRequirements,
      status: job.status,
      firstSeenAt: job.firstSeenAt,
      lastSeenAt: job.lastSeenAt,
    })),
    pagination:{ limit,offset,hasMore:records.length === limit,nextOffset:records.length === limit ? offset+limit : null },
  }, { headers: { "Cache-Control": "no-store" } });
}
