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
  const db = getDb();
  const lookupCutoff = new Date(Date.now()-30*60*1000).toISOString().slice(0,19).replace("T"," ");
  const [recent] = await db.select().from(refreshRequests).where(and(eq(refreshRequests.userId,user.id),eq(refreshRequests.company,payload.company),gt(refreshRequests.requestedAt,lookupCutoff))).orderBy(desc(refreshRequests.requestedAt)).limit(1);
  if (recent) {
    const shortCooldownStatuses = ["failed","needs_review","requires_browser","source_moved","needs_adapter","no_matching_jobs"];
    const cooldownMinutes = shortCooldownStatuses.includes(recent.status) ? 3 : 30;
    const requestedAt = Date.parse(`${recent.requestedAt.replace(" ","T")}Z`);
    const retryAfterSeconds = Math.max(0,Math.ceil((requestedAt+cooldownMinutes*60_000-Date.now())/1000));
    if (retryAfterSeconds > 0) return Response.json({
      error:"cooldown",
      requestedAt:recent.requestedAt,
      lastStatus:recent.status,
      retryAfterSeconds,
      message:recent.status === "needs_review"
        ? `上次找到候选岗位，但逐字证据仍需复核；${Math.ceil(retryAfterSeconds/60)} 分钟后可重试。`
        : recent.status === "requires_browser"
          ? `源站要求浏览器会话校验，这不代表没有岗位；${Math.ceil(retryAfterSeconds/60)} 分钟后可重试。`
          : recent.status === "source_moved"
            ? `旧官方入口已经迁移，正在等待新入口；${Math.ceil(retryAfterSeconds/60)} 分钟后可重试。`
        : recent.status === "failed"
          ? `上次连接失败；${Math.ceil(retryAfterSeconds/60)} 分钟后可重试。`
          : `采集任务刚刚运行过；${Math.ceil(retryAfterSeconds/60)} 分钟后可再次请求，避免重复消耗源站与模型资源。`,
    }, { status:429, headers:{ "Retry-After":String(retryAfterSeconds) } });
  }
  const [row] = await db.insert(refreshRequests).values({ userId:user.id, company:payload.company }).returning();
  const result = await runCompanyCollection(payload.company as CompanyName, row.id);
  return Response.json({ request:{ ...row, status:result.status }, result }, { status:201 });
}
