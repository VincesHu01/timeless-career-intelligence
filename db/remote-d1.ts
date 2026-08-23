type D1Value = string | number | boolean | null | ArrayBuffer | ArrayBufferView;

type D1Meta = {
  changes?: number;
  duration?: number;
  last_row_id?: number;
  rows_read?: number;
  rows_written?: number;
  [key: string]: unknown;
};

type D1QueryResult<T = Record<string, unknown>> = {
  results: T[];
  success: boolean;
  meta: D1Meta;
};

type D1ApiEnvelope = {
  success: boolean;
  result?: Array<{ results?: Array<Record<string, unknown>>; success?: boolean; meta?: D1Meta }>;
  errors?: Array<{ message?: string }>;
};

type RemoteD1Config = { accountId:string; databaseId:string; apiToken:string };

class RemoteD1PreparedStatement {
  readonly sql:string;
  readonly params:D1Value[];

  constructor(private readonly database:RemoteD1Database, sql:string, params:D1Value[] = []) {
    this.sql = sql;
    this.params = params;
  }

  bind(...params:D1Value[]) {
    return new RemoteD1PreparedStatement(this.database,this.sql,params);
  }

  async all<T = Record<string, unknown>>():Promise<D1QueryResult<T>> {
    return this.database.execute<T>(this.sql,this.params);
  }

  async run<T = Record<string, unknown>>():Promise<D1QueryResult<T>> {
    return this.database.execute<T>(this.sql,this.params);
  }

  async first<T = Record<string, unknown>>(column?:string):Promise<T | unknown | null> {
    const result=await this.all<T>();
    const row=result.results[0] ?? null;
    return row && column ? (row as Record<string,unknown>)[column] ?? null : row;
  }

  async raw<T extends unknown[] = unknown[]>():Promise<T[]> {
    const result=await this.all<Record<string,unknown>>();
    return result.results.map((row) => Object.values(row) as T);
  }
}

export class RemoteD1Database {
  private readonly endpoint:string;

  constructor(private readonly config:RemoteD1Config) {
    this.endpoint=`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(config.accountId)}/d1/database/${encodeURIComponent(config.databaseId)}/query`;
  }

  prepare(sql:string) {
    return new RemoteD1PreparedStatement(this,sql);
  }

  async batch(statements:RemoteD1PreparedStatement[]) {
    return this.request({ batch:statements.map((statement) => ({ sql:statement.sql,params:statement.params })) });
  }

  async exec(sql:string) {
    const [result]=await this.request({ sql });
    return { count:result.meta.changes ?? 0,duration:result.meta.duration ?? 0 };
  }

  async execute<T = Record<string,unknown>>(sql:string,params:D1Value[] = []):Promise<D1QueryResult<T>> {
    const [result]=await this.request({ sql,params });
    return result as D1QueryResult<T>;
  }

  private async request(body:{ sql:string;params?:D1Value[] } | { batch:Array<{sql:string;params:D1Value[]}> }):Promise<D1QueryResult[]> {
    const response=await fetch(this.endpoint,{
      method:"POST",
      headers:{ Authorization:`Bearer ${this.config.apiToken}`,"Content-Type":"application/json" },
      body:JSON.stringify(body),
      cache:"no-store",
    });
    const payload=await response.json() as D1ApiEnvelope;
    if (!response.ok || !payload.success || !payload.result?.length) {
      const detail=payload.errors?.map((error) => error.message).filter(Boolean).join("；");
      throw new Error(`远程 D1 查询失败（HTTP ${response.status}）${detail ? `：${detail}` : ""}`);
    }
    return payload.result.map((result) => ({
      results:result.results ?? [],
      success:result.success ?? true,
      meta:result.meta ?? {},
    }));
  }
}

export function remoteD1FromEnvironment() {
  const accountId=process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const databaseId=process.env.CLOUDFLARE_D1_DATABASE_ID?.trim();
  const apiToken=process.env.CLOUDFLARE_D1_API_TOKEN?.trim();
  if (!accountId || !databaseId || !apiToken) return null;
  return new RemoteD1Database({ accountId,databaseId,apiToken });
}
