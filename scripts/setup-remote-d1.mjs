import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const required=["CLOUDFLARE_ACCOUNT_ID","CLOUDFLARE_D1_DATABASE_ID","CLOUDFLARE_D1_API_TOKEN"];
const missing=required.filter((key) => !process.env[key]?.trim());
if (missing.length) throw new Error(`缺少环境变量：${missing.join("、")}`);

const accountId=process.env.CLOUDFLARE_ACCOUNT_ID.trim();
const databaseId=process.env.CLOUDFLARE_D1_DATABASE_ID.trim();
const apiToken=process.env.CLOUDFLARE_D1_API_TOKEN.trim();
const endpoint=`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/d1/database/${encodeURIComponent(databaseId)}/query`;
const migrationDir=path.resolve("drizzle");
const files=(await readdir(migrationDir)).filter((name) => /^\d+.*\.sql$/.test(name)).sort();

async function query(body) {
  const response=await fetch(endpoint,{
    method:"POST",
    headers:{ Authorization:`Bearer ${apiToken}`,"Content-Type":"application/json" },
    body:JSON.stringify(body),
  });
  const payload=await response.json();
  if (!response.ok || !payload.success) {
    const detail=payload.errors?.map((error) => error.message).filter(Boolean).join("；") || "未知错误";
    throw new Error(`D1 请求失败（HTTP ${response.status}）：${detail}`);
  }
  return payload.result ?? [];
}

await query({ sql:"CREATE TABLE IF NOT EXISTS `_timeless_migrations` (`name` text PRIMARY KEY NOT NULL, `applied_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL)" });
const appliedResult=await query({ sql:"SELECT `name` FROM `_timeless_migrations`" });
const applied=new Set((appliedResult[0]?.results ?? []).map((row) => row.name));

for (const file of files) {
  if (applied.has(file)) {
    console.log(`- ${file}（已执行）`);
    continue;
  }
  const sql=await readFile(path.join(migrationDir,file),"utf8");
  const statements=sql.split("--> statement-breakpoint").map((statement) => statement.trim()).filter(Boolean).map((statement) => ({ sql:statement }));
  await query({ batch:[...statements,{ sql:"INSERT INTO `_timeless_migrations` (`name`) VALUES (?)",params:[file] }] });
  console.log(`✓ ${file}`);
}

console.log(`远程 D1 初始化完成，共执行 ${files.length} 个迁移文件。`);
