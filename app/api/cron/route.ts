import { generateWeeklyReport } from "../_lib/report";
import { runCompanyCollection, SOURCE_REGISTRY, type CompanyName } from "../_lib/collector";

function normalizeSecret(value: string | null | undefined) {
  return value?.trim().replace(/^(["'])(.*)\1$/, "$2").replace(/^Bearer\s+/i, "").trim();
}

async function handleRequest(request: Request, payload: { company?: string; action?: string }) {
  const expected = [process.env.CORTEX_CRON_SECRET, process.env.CORTEX_BACKFILL_SECRET]
    .map(normalizeSecret)
    .filter(Boolean);
  const requestUrl = new URL(request.url);
  const received = normalizeSecret(
    request.headers.get("authorization") ?? requestUrl.searchParams.get("token"),
  );
  if (!received || !expected.includes(received)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  if (payload.action === "weekly-report") {
    return Response.json({ report: await generateWeeklyReport() });
  }
  if (!payload.company || !(payload.company in SOURCE_REGISTRY)) {
    return Response.json({ error: "invalid company" }, { status: 400 });
  }
  return Response.json({ result: await runCompanyCollection(payload.company as CompanyName) });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({})) as { company?: string; action?: string };
  return handleRequest(request, payload);
}

// Temporary operator-only backfill entrypoint. The isolated token is rotated after the backfill.
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  return handleRequest(request, {
    company: requestUrl.searchParams.get("company") ?? undefined,
  });
}
