export type VerifiedUser = { id:string; email:string; metadata:Record<string,string> };

function configuredOperatorEmails() {
  return new Set(
    (process.env.CORTEX_OPERATOR_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function canRunCostlyOperation(user: VerifiedUser) {
  if (process.env.CORTEX_ALLOW_PUBLIC_COSTLY_ACTIONS?.trim().toLowerCase() === "true") {
    return true;
  }
  return configuredOperatorEmails().has(user.email.trim().toLowerCase());
}

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
