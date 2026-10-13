import { Pool, PoolClient, QueryResultRow } from 'pg';
import { fail, uuid } from './core';

let pool: Pool | undefined;
export function databaseConfigured() { return Boolean(process.env.KARUU_DATABASE_URL); }
function connection() {
  if(!databaseConfigured()) fail(503,'database_not_configured','The secure database is not configured. Please use the published email contact.');
  if(!pool) pool = new Pool({connectionString:process.env.KARUU_DATABASE_URL,max:3,idleTimeoutMillis:15000,connectionTimeoutMillis:8000});
  return pool;
}
export async function query<T extends QueryResultRow=QueryResultRow>(sql:string,values:unknown[]=[]):Promise<T[]> { return (await connection().query<T>(sql,values)).rows; }
export async function transaction<T>(work:(client:PoolClient)=>Promise<T>):Promise<T> {
  const client=await connection().connect();
  try { await client.query('BEGIN'); const result=await work(client); await client.query('COMMIT'); return result; }
  catch(error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
export async function audit(client:PoolClient,actor:string|null,action:string,target:string,reason:string,detail:unknown={}) {
  await client.query('INSERT INTO commerce_audit(id,actor_id,action,target,reason,detail) VALUES($1,$2,$3,$4,$5,$6)',[uuid(),actor,action,target,reason,JSON.stringify(detail)]);
}
export async function limit(key:string,max:number,seconds:number) {
  const rows=await query<{count:number}>(`INSERT INTO commerce_rate_limits(key,window_start,count) VALUES($1,now(),1)
    ON CONFLICT(key) DO UPDATE SET count=CASE WHEN commerce_rate_limits.window_start < now()-($2*interval '1 second') THEN 1 ELSE commerce_rate_limits.count+1 END,
    window_start=CASE WHEN commerce_rate_limits.window_start < now()-($2*interval '1 second') THEN now() ELSE commerce_rate_limits.window_start END RETURNING count`,[key,seconds]);
  if(rows[0].count>max) fail(429,'rate_limited','Too many attempts. Please try again later.');
}
