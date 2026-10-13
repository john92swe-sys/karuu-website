import {randomUUID} from 'node:crypto';

export class AdminBootstrapError extends Error {
  constructor(code,message){super(message);this.name='AdminBootstrapError';this.code=code;}
}
function reject(code,message){throw new AdminBootstrapError(code,message);}
function bounded(value,min,max,code,message){if(typeof value!=='string')reject(code,message);const result=value.trim();if(result.length<min||result.length>max)reject(code,message);return result;}
export function normalizeBootstrapInput(input){
  if(!input||typeof input!=='object'||Array.isArray(input))reject('invalid_input','Provide the documented operator inputs.');
  const email=bounded(input.email,3,254,'invalid_email','Provide the existing verified account email.').toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))reject('invalid_email','Provide the existing verified account email.');
  if(!Array.isArray(input.brands)||!input.brands.length||input.brands.length>2||input.brands.some(brand=>!['karuu','jkj-plus'].includes(brand))||new Set(input.brands).size!==input.brands.length)reject('invalid_brands','Explicitly choose karuu, jkj-plus, or both once each.');
  const operator=bounded(input.operator,3,120,'operator_required','Provide the authorized operator identity for the audit.');
  const reason=bounded(input.reason,10,1000,'reason_required','Provide an authorization reason of 10 to 1000 characters.');
  if(input.apply!==undefined&&typeof input.apply!=='boolean')reject('invalid_mode','Apply must be an explicit boolean.');
  const apply=input.apply===true;
  let confirmUserId=null;
  if(input.confirmUserId!=null){confirmUserId=bounded(input.confirmUserId,36,36,'invalid_confirmation','Confirm the exact existing user UUID.').toLowerCase();if(!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(confirmUserId))reject('invalid_confirmation','Confirm the exact existing user UUID.');}
  if(apply&&!confirmUserId)reject('confirmation_required','Run the dry-run and explicitly confirm its existing user UUID before apply.');
  return {email,brands:[...input.brands].sort(),operator,reason,apply,confirmUserId};
}

// This is a database-owner operation, not a public API or startup privilege grant.
// No account, password, email verification or commercial configuration is created.
export function bootstrapDatabaseSchema(value='public'){
  if(typeof value!=='string'||!/^[a-z][a-z0-9_]{0,62}$/.test(value)||value.startsWith('pg_')||value==='information_schema')reject('invalid_schema','Use the configured, reviewed commerce schema identifier.');
  return value;
}
export async function bootstrapAdministrator(pool,input,{schema='public'}={}){
  const requested=normalizeBootstrapInput(input),schemaName=bootstrapDatabaseSchema(schema),client=await pool.connect();let transactionOpen=false;
  try{
    await client.query('BEGIN');transactionOpen=true;
    await client.query("SET LOCAL statement_timeout = '10s'");
    await client.query("SET LOCAL lock_timeout = '5s'");
    await client.query(`SET LOCAL search_path TO "${schemaName}", pg_catalog, pg_temp`);
    // Namespace reserved for this first-admin operation; two compliant invocations
    // serialize even when they target different existing users.
    await client.query('SELECT pg_advisory_xact_lock($1::integer,$2::integer)',[1262572117,1]);
    const schema=await client.query('SELECT version FROM commerce_schema WHERE version=1');
    if(schema.rows.length!==1)reject('schema_not_ready','Apply and verify the existing commerce schema before administrator setup.');
    const existing=await client.query("SELECT id FROM commerce_users WHERE role='admin' LIMIT 1");
    if(existing.rows.length)reject('bootstrap_already_completed','An administrator already exists. This first-admin tool cannot add staff or change existing administrator permissions.');
    const targetRows=await client.query('SELECT id,email,role,brands,verified_at FROM commerce_users WHERE email=$1 FOR UPDATE',[requested.email]);
    const target=targetRows.rows[0];
    if(!target)reject('account_not_found','No existing account matches this email. Register and verify the intended account through the normal account flow first.');
    if(!target.verified_at)reject('email_not_verified','This account has not completed email verification. This tool does not bypass verification.');
    if(target.role!=='customer')reject('unexpected_role','The intended account must be an existing customer before first administrator setup.');
    if(requested.apply&&requested.confirmUserId!==target.id)reject('confirmation_mismatch','The confirmed UUID does not match the existing verified account. No authorization was applied.');
    const sessionRows=await client.query('SELECT count(*)::integer AS count FROM commerce_sessions WHERE user_id=$1',[target.id]);
    const databaseRole=(await client.query('SELECT current_user AS database_role')).rows[0].database_role;
    const preview={mode:requested.apply?'apply':'dry_run',schema:schemaName,target:{id:target.id,email:target.email,emailVerified:true},before:{role:target.role,brands:target.brands},after:{role:'admin',brands:requested.brands},operator:requested.operator,reason:requested.reason,sessionsToRevoke:sessionRows.rows[0].count};
    if(!requested.apply){await client.query('ROLLBACK');transactionOpen=false;return {...preview,applied:false};}
    const updated=await client.query("UPDATE commerce_users SET role='admin',brands=$2::text[] WHERE id=$1 AND role='customer' AND verified_at IS NOT NULL RETURNING id",[target.id,requested.brands]);
    if(updated.rows.length!==1)reject('account_changed','The target account state changed. Review it before another authorization attempt.');
    const revoked=await client.query('DELETE FROM commerce_sessions WHERE user_id=$1 RETURNING 1 AS revoked',[target.id]);
    const auditId=randomUUID();
    await client.query('INSERT INTO commerce_audit(id,actor_id,action,target,reason,detail) VALUES($1,NULL,$2,$3,$4,$5::jsonb)',[auditId,'admin_bootstrap',target.id,requested.reason,JSON.stringify({source:'database_owner_cli',schema:schemaName,operator:requested.operator,databaseRole,before:preview.before,after:preview.after,emailVerifiedAt:target.verified_at,sessionsRevoked:revoked.rows.length})]);
    await client.query('COMMIT');transactionOpen=false;
    return {...preview,applied:true,auditId,sessionsRevoked:revoked.rows.length,message:'First administrator authorization is recorded. Sign in again through the normal verified account flow.'};
  }catch(error){if(transactionOpen)await client.query('ROLLBACK').catch(()=>{});throw error;}
  finally{client.release();}
}

export function parseBootstrapArguments(argv){
  if(argv.length===1&&argv[0]==='--help')return {help:true};
  const options={},names={'--email':'email','--brands':'brands','--operator':'operator','--reason':'reason','--confirm-user-id':'confirmUserId'};
  for(let index=0;index<argv.length;index++){
    const flag=argv[index];
    if(flag==='--apply'){if(options.apply!==undefined)reject('invalid_arguments','An option was repeated. Use --help for the supported arguments.');options.apply=true;continue;}
    const key=names[flag];if(!key||options[key]!==undefined||!argv[index+1]||argv[index+1].startsWith('--'))reject('invalid_arguments','Use the supported arguments exactly once. See --help; database credentials belong only in the operator environment.');
    options[key]=argv[++index];
  }
  if(options.brands!==undefined)options.brands=options.brands.split(',').map(value=>value.trim());
  return normalizeBootstrapInput(options);
}

export function operatorConnectionString(value){
  if(typeof value!=='string'||!value.trim())reject('operator_database_not_configured','Set KARUU_ADMIN_DATABASE_URL in the trusted operator environment. Never add it to a Worker or public variable.');
  let url;try{url=new URL(value);}catch{reject('invalid_operator_database','Provide a valid operator PostgreSQL URL without printing its credentials.');}
  if(!['postgres:','postgresql:'].includes(url.protocol)||!url.hostname)reject('invalid_operator_database','Provide an operator PostgreSQL URL.');
  if(!['localhost','127.0.0.1','[::1]'].includes(url.hostname)&&url.searchParams.get('sslmode')!=='verify-full')reject('operator_tls_required','A non-local operator connection must explicitly use sslmode=verify-full and the provider trust configuration.');
  return value;
}

export function safeBootstrapFailure(error){
  return error instanceof AdminBootstrapError?{code:error.code,error:error.message}:{code:'database_operation_unconfirmed',error:'The database operation could not be confirmed. Inspect the account and admin_bootstrap audit before retrying. Database credentials and internal errors are not printed.'};
}
