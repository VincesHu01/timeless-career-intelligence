import assert from "node:assert/strict";
import test from "node:test";
import { RemoteD1Database } from "../db/remote-d1";

test("remote D1 adapter preserves prepared parameters, batch results, and raw rows", async () => {
  const originalFetch=globalThis.fetch;
  const calls:Array<{url:string;authorization:string|null;body:Record<string,unknown>}> = [];
  globalThis.fetch=async (input,init) => {
    const body=JSON.parse(String(init?.body)) as { batch?:unknown[] };
    calls.push({
      url:String(input),
      authorization:new Headers(init?.headers).get("authorization"),
      body,
    });
    const result=body.batch
      ? body.batch.map((_,index) => ({ success:true,results:[{ index }],meta:{ changes:index+1 } }))
      : [{ success:true,results:[{ id:"job-1",count:2 }],meta:{ rows_read:1 } }];
    return Response.json({ success:true,result });
  };

  try {
    const database=new RemoteD1Database({ accountId:"account",databaseId:"database",apiToken:"test-token" });
    const statement=database.prepare("SELECT * FROM jobs WHERE id = ?").bind("job-1");
    const all=await statement.all<{id:string;count:number}>();
    assert.deepEqual(all.results,[{ id:"job-1",count:2 }]);
    assert.deepEqual(await statement.raw(),[["job-1",2]]);
    const batch=await database.batch([statement,database.prepare("UPDATE jobs SET status = ?").bind("已下线")]);
    assert.equal(batch.length,2);
    assert.deepEqual(calls[0].body,{ sql:"SELECT * FROM jobs WHERE id = ?",params:["job-1"] });
    assert.equal(calls[0].authorization,"Bearer test-token");
    assert.match(calls[0].url,/accounts\/account\/d1\/database\/database\/query$/);
    assert.ok(Array.isArray(calls[2].body.batch));
  } finally {
    globalThis.fetch=originalFetch;
  }
});
