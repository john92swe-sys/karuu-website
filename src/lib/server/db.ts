import { Client, Pool, PoolClient, QueryResultRow } from 'pg';
import { fail, uuid } from './core';
import { commerceHyperdrive } from './cloudflare';

let nodePool: Pool | undefined;
export type DbClient=Pick<PoolClient,'query'>;
export function commerceSchema() {
  const schema=process.env.KARUU_DATABASE_SCHEMA || 'public';
  if(!/^[a-z][a-z0-9_]{0,62}$/.test(schema)) fail(503,'database_schema_invalid','The database schema configuration is invalid.');
  return schema;
}
export async function databaseConfigured() {
  const hyperdrive=await commerceHyperdrive();
  return hyperdrive?Boolean(hyperdrive.connectionString):Boolean(process.env.KARUU_DATABASE_URL);
}
function localConnection(){
  if(!process.env.KARUU_DATABASE_URL)fail(503,'database_not_configured','The secure database is not configured. Please use the published email contact.');
  // This pool exists only in ordinary Node.js. Workers never reuse request-owned sockets.
  if(!nodePool)nodePool=new Pool({connectionString:process.env.KARUU_DATABASE_URL,options:`-c search_path=${commerceSchema()},pg_catalog,pg_temp`,max:3,idleTimeoutMillis:15000,connectionTimeoutMillis:8000});
  return nodePool;
}
async function workerClient(){
  const hyperdrive=await commerceHyperdrive();
  if(!hyperdrive)return null;
  if(!hyperdrive.connectionString)fail(503,'database_not_configured','The secure Worker database binding is not configured.');
  if(!hyperdrive.cacheDisabledConfirmed)fail(503,'database_freshness_unconfirmed','Authentication, billing and delivery require a verified cache-disabled database binding.');
  const client=new Client({connectionString:hyperdrive.connectionString,connectionTimeoutMillis:8000});
  try{
    await client.connect();
    // Request-owned connections select only this site's schema; no public fallback.
    await client.query(`SET search_path TO "${commerceSchema()}", pg_catalog, pg_temp`);
    return client;
  }catch(error){await client.end().catch(()=>{});throw error;}
}
export async function query<T extends QueryResultRow=QueryResultRow>(sql:string,values:unknown[]=[]):Promise<T[]> {
  const client=await workerClient();
  if(!client)return (await localConnection().query<T>(sql,values)).rows;
  try{return (await client.query<T>(sql,values)).rows;}finally{await client.end();}
}
export async function transaction<T>(work:(client:DbClient)=>Promise<T>):Promise<T> {
  const worker=await workerClient(),client=worker??await localConnection().connect();
  try { await client.query('BEGIN'); const result=await work(client); await client.query('COMMIT'); return result; }
  catch(error) { await client.query('ROLLBACK'); throw error; }
  finally { if(worker)await worker.end();else(client as PoolClient).release(); }
}
export async function audit(client:DbClient,actor:string|null,action:string,target:string,reason:string,detail:unknown={}) {
  await client.query('INSERT INTO commerce_audit(id,actor_id,action,target,reason,detail) VALUES($1,$2,$3,$4,$5,$6)',[uuid(),actor,action,target,reason,JSON.stringify(detail)]);
}
export async function limit(key:string,max:number,seconds:number) {
  const rows=await query<{count:number}>(`INSERT INTO commerce_rate_limits(key,window_start,count) VALUES($1,now(),1)
    ON CONFLICT(key) DO UPDATE SET count=CASE WHEN commerce_rate_limits.window_start < now()-($2*interval '1 second') THEN 1 ELSE commerce_rate_limits.count+1 END,
    window_start=CASE WHEN commerce_rate_limits.window_start < now()-($2*interval '1 second') THEN now() ELSE commerce_rate_limits.window_start END RETURNING count`,[key,seconds]);
  if(rows[0].count>max) fail(429,'rate_limited','Too many attempts. Please try again later.');
}
