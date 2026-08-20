export type VerifiedUser = { id:string; email:string; metadata:Record<string,string> };

export async function verifyUser(request: Request): Promise<VerifiedUser | null> {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!token || !url || !key) return null;
  const response = await fetch(`${url}/auth/v1/user`, { headers:{ Authorization:`Bearer ${token}`, apikey:key } });
  if (!response.ok) return null;
  const user = await response.json() as { id:string; email?:string; user_metadata?:Record<string,string> };
  if (!user.id || !user.email) return null;
  return { id:user.id, email:user.email, metadata:user.user_metadata ?? {} };
}
