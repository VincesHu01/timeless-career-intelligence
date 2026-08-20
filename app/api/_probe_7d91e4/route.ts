export async function GET() {
  const apiKey = process.env.ARK_API_KEY;
  const model = process.env.ARK_MODEL_ID;
  const baseUrl = process.env.ARK_BASE_URL || "https://ark.cn-beijing.volces.com/api/v3";
  if (!apiKey || !model) return Response.json({ ok:false, error:"not_configured" }, { status:503 });
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/,"")}/chat/completions`, {
      method:"POST",
      headers:{ "Content-Type":"application/json", Authorization:`Bearer ${apiKey}` },
      body:JSON.stringify({ model, messages:[{ role:"user", content:"只回复 OK" }], max_tokens:8, temperature:0 }),
      signal:AbortSignal.timeout(45000),
    });
    const body = await response.json().catch(() => ({})) as { error?:{ message?:string }; choices?:unknown[] };
    if (!response.ok) {
      const message = body.error?.message || `upstream_${response.status}`;
      console.error("Cortex model probe failed",response.status,message);
      return Response.json({ ok:false, provider:"火山方舟", model, status:response.status, error:message }, { status:502 });
    }
    return Response.json({ ok:true, provider:"火山方舟", model, responseReceived:Array.isArray(body.choices) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "request_failed";
    console.error("Cortex model probe failed",message);
    return Response.json({ ok:false, provider:"火山方舟", model, error:message }, { status:504 });
  }
}
