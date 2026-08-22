import { getLatestWeeklyReport, generateWeeklyReport } from "../_lib/report";
import { verifyUser } from "../_lib/auth";

export async function GET() {
  return Response.json({ report: await getLatestWeeklyReport() }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const user = await verifyUser(request);
  if (!user) return Response.json({ error: "请登录后生成周报" }, { status: 401 });
  return Response.json({ report: await generateWeeklyReport() });
}
