import { and, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { reviewStates } from "../../../db/schema";
import { verifyUser } from "../_lib/auth";

const intervals = [1, 2, 4, 7, 15, 30];

export async function GET(request: Request) {
  const user = await verifyUser(request);
  if (!user) return Response.json({ error:"unauthorized" }, { status:401 });
  const rows = await getDb().select().from(reviewStates).where(eq(reviewStates.userId,user.id));
  return Response.json({ reviews:rows });
}

export async function POST(request: Request) {
  const user = await verifyUser(request);
  if (!user) return Response.json({ error:"unauthorized" }, { status:401 });
  const payload = await request.json() as { cardId?:string; quality?:number };
  if (!payload.cardId || !Number.isInteger(payload.quality) || payload.quality! < 1 || payload.quality! > 5) return Response.json({ error:"invalid review" }, { status:400 });
  const db = getDb();
  const [previous] = await db.select().from(reviewStates).where(and(eq(reviewStates.userId,user.id),eq(reviewStates.cardId,payload.cardId))).limit(1);
  const index = payload.quality! >= 3 ? Math.min((previous?.intervalIndex ?? -1)+1,intervals.length-1) : 0;
  const due = new Date(Date.now()+intervals[index]*86400000).toISOString();
  await db.insert(reviewStates).values({ userId:user.id, cardId:payload.cardId, quality:payload.quality!, intervalIndex:index, dueAt:due }).onConflictDoUpdate({ target:[reviewStates.userId,reviewStates.cardId], set:{ quality:payload.quality!, intervalIndex:index, dueAt:due, updatedAt:new Date().toISOString() } });
  return Response.json({ cardId:payload.cardId, quality:payload.quality, intervalIndex:index, dueAt:due });
}
