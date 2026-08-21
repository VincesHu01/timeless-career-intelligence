import { desc } from "drizzle-orm";
import { getDb } from "../../../db";
import { crawlRuns } from "../../../db/schema";

export async function GET() {
  const rows = await getDb().select().from(crawlRuns).orderBy(desc(crawlRuns.startedAt)).limit(100);
  const latest = new Map<string,typeof rows[number]>();
  rows.forEach((row) => { if (!latest.has(row.company)) latest.set(row.company,row); });
  return Response.json({
    sources:[...latest.values()].map((row) => ({
      company:row.company,
      status:row.status,
      discovered:row.discovered,
      message:row.errorMessage,
      checkedAt:row.finishedAt || row.startedAt,
    })),
  });
}
