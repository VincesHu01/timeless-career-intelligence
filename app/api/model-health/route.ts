export async function GET() {
  const configured = Boolean(process.env.ARK_API_KEY && process.env.ARK_MODEL_ID);
  return Response.json({ configured, provider:"火山方舟", status:configured ? "ready_for_test" : "not_configured" }, { headers:{ "Cache-Control":"no-store" } });
}

export async function POST() {
  const key = process.env.ARK_API_KEY;
  const model = process.env.ARK_MODEL_ID;
  const base = process.env.ARK_BASE_URL || "https://ark.cn-beijing.volces.com/api/v3";
  if (!key || !model) return Response.json({ ok:false, error:"ARK_API_KEY 或 ARK_MODEL_ID 未配置" }, { status:503 });
  try {
    const response = await fetch(`${base}/chat/completions`, { method:"POST", headers:{ Authorization:`Bearer ${key}`, "Content-Type":"application/json" }, body:JSON.stringify({ model, messages:[{ role:"user", content:"只回复 CORTEX_OK" }], max_tokens:16 }) });
    if (!response.ok) return Response.json({ ok:false, error:`方舟返回 HTTP ${response.status}` }, { status:502 });
    const data = await response.json() as { choices?:Array<{ message?:{ content?:string } }> };
    return Response.json({ ok:true, response:data.choices?.[0]?.message?.content ?? "" });
  } catch (error) { return Response.json({ ok:false, error:error instanceof Error ? error.message : "方舟调用失败" }, { status:502 }); }
}
