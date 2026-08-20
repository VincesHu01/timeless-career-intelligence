import { and, desc, eq, gt } from "drizzle-orm";
import { getDb } from "../../../db";
import { refreshRequests } from "../../../db/schema";
import { verifyUser } from "../_lib/auth";
import { runCompanyCollection, SOURCE_REGISTRY, type CompanyName } from "../_lib/collector";

const allowedCompanies = new Set(Object.keys(SOURCE_REGISTRY));

export async function POST(request: Request) {
  const user = await verifyUser(request);
  if (!user) return Response.json({ error:"请登录后请求更新" }, { status:401 });
  const payload = await request.json() as { company?:string };
  if (!payload.company || !allowedCompanies.has(payload.company)) return Response.json({ error:"invalid company" }, { status:400 });
  const cutoff = new Date(Date.now()-30*60*1000).toISOString().slice(0,19).replace("T"," ");
  const db = getDb();
  const [recent] = await db.select().from(refreshRequests).where(and(eq(refreshRequests.userId,user.id),eq(refreshRequests.company,payload.company),gt(refreshRequests.requestedAt,cutoff))).orderBy(desc(refreshRequests.requestedAt)).limit(1);
  if (recent) return Response.json({ error:"cooldown", requestedAt:recent.requestedAt }, { status:429 });
  const [row] = await db.insert(refreshRequests).values({ userId:user.id, company:payload.company }).returning();
  const result = await runCompanyCollection(payload.company as CompanyName, row.id);
  return Response.json({ request:{ ...row, status:result.status }, result }, { status:201 });
}
