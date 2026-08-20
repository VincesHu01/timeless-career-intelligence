import { generateWeeklyReport } from "../_lib/report";
import { runCompanyCollection, SOURCE_REGISTRY, type CompanyName } from "../_lib/collector";

function normalizeSecret(value: string | null | undefined) {
  return value?.trim().replace(/^(["'])(.*)\1$/, "$2").replace(/^Bearer\s+/i, "").trim();
}

export async function POST(request: Request) {
  const expected = normalizeSecret(process.env.CORTEX_CRON_SECRET);
  const received = normalizeSecret(request.headers.get("authorization"));
  if (!expected || !received || expected !== received) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => ({})) as { company?: string; action?: string };
  if (payload.action === "weekly-report") {
    return Response.json({ report: await generateWeeklyReport() });
  }
  if (!payload.company || !(payload.company in SOURCE_REGISTRY)) {
    return Response.json({ error: "invalid company" }, { status: 400 });
  }
  return Response.json({ result: await runCompanyCollection(payload.company as CompanyName) });
}
