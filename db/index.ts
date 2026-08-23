import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";
import { remoteD1FromEnvironment } from "./remote-d1";

declare global {
  // The Cloudflare worker sets its per-deployment D1 binding before routing.
  // Vercel uses the authenticated remote D1 HTTP adapter instead.
  var __TIMELESS_D1__: unknown;
}

export function getDb() {
  const database=globalThis.__TIMELESS_D1__ || remoteD1FromEnvironment();
  if (!database) {
    throw new Error(
      "数据库不可用：Sites/Cloudflare 需要 DB binding；Vercel 需要 CLOUDFLARE_ACCOUNT_ID、CLOUDFLARE_D1_DATABASE_ID 与 CLOUDFLARE_D1_API_TOKEN。"
    );
  }
  return drizzle(database as Parameters<typeof drizzle>[0], { schema });
}
