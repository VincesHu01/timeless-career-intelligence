export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  return Response.json({ url, key, configured: Boolean(url && key) }, {
    headers: { "Cache-Control": "no-store" },
  });
}
