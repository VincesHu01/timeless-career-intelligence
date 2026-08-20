import { and, desc, eq, gt } from "drizzle-orm";
import { getDb } from "../../../db";
import { refreshRequests } from "../../../db/schema";
import { verifyUser } from "../_lib/auth";

const allowedCompanies = new Set(["字节跳动","阿里巴巴","腾讯","美团","快手","百度","携程","京东","拼多多","得物","网易","Bilibili","米哈游"]);

export async function POST(request: Request) {
  const user = await verifyUser(request);
  if (!user) return Response.json({ error:"请登录后请求更新" }, { status:401 });
  const payload = await request.json() as { company?:string };
  if (!payload.company || !allowedCompanies.has(payload.company)) return Response.json({ error:"invalid company" }, { status:400 });
  const cutoff = new Date(Date.now()-30*60*1000).toISOString();
  const db = getDb();
  const [recent] = await db.select().from(refreshRequests).where(and(eq(refreshRequests.userId,user.id),eq(refreshRequests.company,payload.company),gt(refreshRequests.requestedAt,cutoff))).orderBy(desc(refreshRequests.requestedAt)).limit(1);
  if (recent) return Response.json({ error:"cooldown", requestedAt:recent.requestedAt }, { status:429 });
  const [row] = await db.insert(refreshRequests).values({ userId:user.id, company:payload.company }).returning();
  return Response.json({ request:row }, { status:201 });
}
