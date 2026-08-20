export async function GET() {
  const configured = Boolean(process.env.ARK_API_KEY && process.env.ARK_MODEL_ID);
  return Response.json({ configured, provider:"火山方舟", status:configured ? "ready_for_test" : "not_configured" }, { headers:{ "Cache-Control":"no-store" } });
}

export async function POST(request:Request) {
  const user = await verifyUser(request);
  if (!user) return Response.json({ ok:false, error:"请登录后测试 AI 连接" }, { status:401 });
  const key = process.env.ARK_API_KEY;
  const model = process.env.ARK_MODEL_ID;
  const base = process.env.ARK_BASE_URL || "https://ark.cn-beijing.volces.com/api/v3";
  if (!key || !model) return Response.json({ ok:false, error:"ARK_API_KEY 或 ARK_MODEL_ID 未配置" }, { status:503 });
  const db = getDb();
  const cutoff = new Date(Date.now()-10*60*1000).toISOString();
  const [recent] = await db.select().from(modelHealthChecks).where(and(eq(modelHealthChecks.userId,user.id),gt(modelHealthChecks.checkedAt,cutoff))).orderBy(desc(modelHealthChecks.checkedAt)).limit(1);
  if (recent) return Response.json({ ok:false, error:"测试冷却中，请 10 分钟后再试" }, { status:429 });
  try {
    const response = await fetch(`${base.replace(/\/$/,"")}/chat/completions`, { method:"POST", headers:{ Authorization:`Bearer ${key}`, "Content-Type":"application/json" }, body:JSON.stringify({ model, messages:[{ role:"user", content:"只回复 CORTEX_OK" }], max_tokens:16 }), signal:AbortSignal.timeout(45000) });
    if (!response.ok) {
      const error = `方舟返回 HTTP ${response.status}`;
      await db.insert(modelHealthChecks).values({ userId:user.id, model, status:"failed", errorMessage:error });
      return Response.json({ ok:false, error }, { status:502 });
    }
    const data = await response.json() as { choices?:Array<{ message?:{ content?:string } }> };
    await db.insert(modelHealthChecks).values({ userId:user.id, model, status:"success" });
    return Response.json({ ok:true, model, response:data.choices?.[0]?.message?.content ?? "" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "方舟调用失败";
    await db.insert(modelHealthChecks).values({ userId:user.id, model, status:"failed", errorMessage:message });
    return Response.json({ ok:false, error:message }, { status:502 });
  }
}
import { and, desc, eq, gt } from "drizzle-orm";
import { getDb } from "../../../db";
import { modelHealthChecks } from "../../../db/schema";
import { verifyUser } from "../_lib/auth";
