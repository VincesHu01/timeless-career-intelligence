import { desc } from "drizzle-orm";
import { getDb } from "../../../db";
import { jobs } from "../../../db/schema";

function list(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function GET() {
  const db = getDb();
  const records = await db.select().from(jobs).orderBy(desc(jobs.lastSeenAt)).limit(500);
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
      ai: list(job.aiSkillsJson),
      bonusSignals: list(job.bonusSignalsJson),
      evidence: list(job.evidenceJson),
      status: job.status,
      firstSeenAt: job.firstSeenAt,
      lastSeenAt: job.lastSeenAt,
    })),
  }, { headers: { "Cache-Control": "public, max-age=60" } });
}
