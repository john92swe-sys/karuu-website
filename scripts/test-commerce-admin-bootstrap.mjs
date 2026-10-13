import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {PGlite} from '@electric-sql/pglite';
import {bootstrapAdministrator,normalizeBootstrapInput,operatorConnectionString,parseBootstrapArguments,safeBootstrapFailure} from './lib/commerce-admin-bootstrap.mjs';

const testRoot=path.resolve(process.env.KARUU_TEST_DIR??path.join(process.cwd(),'work','commerce-admin-tests'));fs.mkdirSync(testRoot,{recursive:true});
const migration=fs.readFileSync(new URL('../db/001-commerce.sql',import.meta.url),'utf8');
const input={email:'owner@example.test',brands:['karuu'],operator:'Isolated fixture operator',reason:'Isolated account authorization acceptance fixture.'};
async function fixture(work){
 const directory=fs.mkdtempSync(path.join(testRoot,'bootstrap-'));let db=new PGlite(directory);await db.waitReady;await db.exec(migration);
 let queue=Promise.resolve();const trace=[];let releases=0;
 const pool={connect:async()=>{const previous=queue;let unlock;queue=new Promise(resolve=>{unlock=resolve;});await previous;return {query:(sql,values=[])=>{trace.push(sql);return db.query(sql,values);},release:()=>{releases++;unlock();}};}};
 async function seed(email='owner@example.test',verified=true){const id=randomUUID();await db.query('INSERT INTO commerce_users(id,email,display_name,password_hash,verified_at) VALUES($1,$2,$3,$4,$5)',[id,email,'Isolated verified owner','fixture-only-password-hash',verified?'2026-10-13T00:00:00Z':null]);return id;}
 async function session(id){await db.query('INSERT INTO commerce_sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval \'1 day\')',[randomUUID(),id]);}
 try{return await work({get db(){return db;},pool,trace,seed,session,get releases(){return releases;},reopen:async()=>{await db.close();db=new PGlite(directory);await db.waitReady;}});}
 finally{await db.close();const resolved=path.resolve(directory);assert.ok(resolved.startsWith(testRoot+path.sep)&&path.basename(resolved).startsWith('bootstrap-'));fs.rmSync(resolved,{recursive:true,force:true});}
}
await test('first-admin dry-run resolves a real verified UUID but changes no role, session, audit or account',async()=>fixture(async f=>{
 const id=await f.seed();await f.session(id);await f.session(id);
 const parsed=parseBootstrapArguments(['--email',' OWNER@EXAMPLE.TEST ','--brands','jkj-plus','--operator',input.operator,'--reason',input.reason]);
 const result=await bootstrapAdministrator(f.pool,parsed);assert.equal(result.mode,'dry_run');assert.equal(result.applied,false);assert.equal(result.target.id,id);assert.deepEqual(result.after.brands,['jkj-plus']);assert.equal(result.sessionsToRevoke,2);
 const user=(await f.db.query('SELECT role,brands,password_hash,verified_at FROM commerce_users WHERE id=$1',[id])).rows[0];assert.equal(user.role,'customer');assert.deepEqual(user.brands,['karuu']);assert.equal(user.password_hash,'fixture-only-password-hash');
 assert.equal((await f.db.query('SELECT id FROM commerce_users')).rows.length,1);assert.equal((await f.db.query('SELECT token_hash FROM commerce_sessions')).rows.length,2);assert.equal((await f.db.query('SELECT id FROM commerce_audit')).rows.length,0);assert.equal(f.trace.at(-1),'ROLLBACK');assert.equal(f.releases,1);
}));
await test('apply requires exact UUID; missing, unverified or wrong target cannot become administrator',async()=>fixture(async f=>{
 const verified=await f.seed(),unverified=await f.seed('unverified@example.test',false);
 await assert.rejects(bootstrapAdministrator(f.pool,{...input,apply:true}),{code:'confirmation_required'});
 await assert.rejects(bootstrapAdministrator(f.pool,{...input,apply:true,confirmUserId:unverified}),{code:'confirmation_mismatch'});
 await assert.rejects(bootstrapAdministrator(f.pool,{...input,email:'unverified@example.test',apply:true,confirmUserId:unverified}),{code:'email_not_verified'});
 await assert.rejects(bootstrapAdministrator(f.pool,{...input,email:'missing@example.test'}),{code:'account_not_found'});
 assert.equal((await f.db.query("SELECT id FROM commerce_users WHERE role='admin'")).rows.length,0);assert.equal((await f.db.query('SELECT id FROM commerce_audit')).rows.length,0);assert.equal((await f.db.query('SELECT id FROM commerce_users')).rows.length,2);assert.notEqual(verified,unverified);
}));
await test('apply is brand-scoped, audited and revokes only the existing target sessions without modifying credentials or funds',async()=>fixture(async f=>{
 const id=await f.seed(),other=await f.seed('other@example.test');await f.session(id);await f.session(id);await f.session(other);
 const before=(await f.db.query('SELECT password_hash,verified_at FROM commerce_users WHERE id=$1',[id])).rows[0];
 const result=await bootstrapAdministrator(f.pool,{...input,brands:['jkj-plus'],apply:true,confirmUserId:id});assert.equal(result.applied,true);assert.equal(result.sessionsRevoked,2);
 const target=(await f.db.query('SELECT role,brands,password_hash,verified_at FROM commerce_users WHERE id=$1',[id])).rows[0];assert.equal(target.role,'admin');assert.deepEqual(target.brands,['jkj-plus']);assert.equal(target.password_hash,before.password_hash);assert.deepEqual(target.verified_at,before.verified_at);assert.equal((await f.db.query('SELECT user_id FROM commerce_sessions')).rows[0].user_id,other);
 const audit=(await f.db.query('SELECT * FROM commerce_audit')).rows[0];assert.equal(audit.id,result.auditId);assert.equal(audit.action,'admin_bootstrap');assert.equal(audit.actor_id,null);assert.equal(audit.target,id);assert.equal(audit.reason,input.reason);assert.equal(audit.detail.operator,input.operator);assert.equal(audit.detail.source,'database_owner_cli');assert.deepEqual(audit.detail.after.brands,['jkj-plus']);assert.equal(audit.detail.sessionsRevoked,2);
 for(const table of ['commerce_orders','commerce_entitlements','commerce_outbox','commerce_point_ledger','commerce_kru_records'])assert.equal((await f.db.query(`SELECT count(*)::integer AS count FROM ${table}`)).rows[0].count,0);
 assert.ok(f.trace.some(sql=>sql.includes('pg_advisory_xact_lock')));assert.equal(f.trace.at(-1),'COMMIT');
}));
await test('a failing real SQL audit constraint rolls back the privilege update and session revocation',async()=>fixture(async f=>{
 const id=await f.seed();await f.session(id);await f.db.exec("ALTER TABLE commerce_audit ADD CONSTRAINT fixture_reject_bootstrap CHECK(action<>'admin_bootstrap')");
 await assert.rejects(bootstrapAdministrator(f.pool,{...input,apply:true,confirmUserId:id}));
 assert.equal((await f.db.query('SELECT role FROM commerce_users WHERE id=$1',[id])).rows[0].role,'customer');assert.equal((await f.db.query('SELECT user_id FROM commerce_sessions')).rows.length,1);assert.equal((await f.db.query('SELECT id FROM commerce_audit')).rows.length,0);assert.equal(f.trace.at(-1),'ROLLBACK');assert.equal(f.releases,1);
}));
await test('competing first-admin invocations and later replay cannot create a second administrator',async()=>fixture(async f=>{
 const first=await f.seed(),second=await f.seed('second@example.test');
 const results=await Promise.allSettled([bootstrapAdministrator(f.pool,{...input,apply:true,confirmUserId:first}),bootstrapAdministrator(f.pool,{...input,email:'second@example.test',apply:true,confirmUserId:second})]);
 assert.equal(results.filter(result=>result.status==='fulfilled').length,1);assert.equal(results.find(result=>result.status==='rejected').reason.code,'bootstrap_already_completed');assert.equal((await f.db.query("SELECT id FROM commerce_users WHERE role='admin'")).rows.length,1);assert.equal((await f.db.query('SELECT id FROM commerce_audit')).rows.length,1);
 await assert.rejects(bootstrapAdministrator(f.pool,{...input,brands:['karuu','jkj-plus'],apply:true,confirmUserId:first}),{code:'bootstrap_already_completed'});
}));
await test('the exact first-admin authorization and audit survive reopening the disk SQL database',async()=>fixture(async f=>{
 const id=await f.seed();const result=await bootstrapAdministrator(f.pool,{...input,apply:true,confirmUserId:id});await f.reopen();
 assert.equal((await f.db.query('SELECT role FROM commerce_users WHERE id=$1',[id])).rows[0].role,'admin');assert.equal((await f.db.query('SELECT id FROM commerce_audit')).rows[0].id,result.auditId);await assert.rejects(bootstrapAdministrator(f.pool,input),{code:'bootstrap_already_completed'});
}));
await test('operator input and connection validation reject implicit scope, insecure remote URLs and credential-bearing CLI arguments',()=>{
 for(const brands of [[],['karuu','karuu'],['other'],undefined])assert.throws(()=>normalizeBootstrapInput({...input,brands}),{code:'invalid_brands'});
 assert.throws(()=>normalizeBootstrapInput({...input,reason:'short'}),{code:'reason_required'});assert.throws(()=>normalizeBootstrapInput({...input,operator:''}),{code:'operator_required'});
 assert.throws(()=>operatorConnectionString(undefined),{code:'operator_database_not_configured'});assert.throws(()=>operatorConnectionString('postgres://owner:fixture-only@db.example.test/commerce'),{code:'operator_tls_required'});assert.throws(()=>operatorConnectionString('https://db.example.test'),{code:'invalid_operator_database'});
 assert.equal(operatorConnectionString('postgres://owner:fixture-only@db.example.test/commerce?sslmode=verify-full'),'postgres://owner:fixture-only@db.example.test/commerce?sslmode=verify-full');assert.equal(operatorConnectionString('postgres://localhost/fixture'),'postgres://localhost/fixture');
 assert.throws(()=>parseBootstrapArguments(['--database-url','fixture-never-print']),{code:'invalid_arguments'});assert.throws(()=>parseBootstrapArguments(['--apply','--apply']),{code:'invalid_arguments'});assert.deepEqual(parseBootstrapArguments(['--help']),{help:true});
 const safe=JSON.stringify(safeBootstrapFailure(new Error('Database password fixture-never-print in internal response')));assert.ok(!safe.includes('fixture-never-print'));assert.ok(safe.includes('database_operation_unconfirmed'));
});
await test('CLI help and missing operator configuration never connect or expose passwords',()=>{
 const env={SystemRoot:process.env.SystemRoot,PATH:process.env.PATH,KARUU_ADMIN_DATABASE_URL:''};
 const help=spawnSync(process.execPath,['scripts/commerce-admin-bootstrap.mjs','--help'],{encoding:'utf8',env});assert.equal(help.status,0);assert.ok(help.stdout.includes('dry-run only'));
 const missing=spawnSync(process.execPath,['scripts/commerce-admin-bootstrap.mjs','--email',input.email,'--brands','karuu','--operator',input.operator,'--reason',input.reason],{encoding:'utf8',env});assert.equal(missing.status,1);assert.equal(JSON.parse(missing.stderr).code,'operator_database_not_configured');
 const unknown=spawnSync(process.execPath,['scripts/commerce-admin-bootstrap.mjs','--database-url','postgres://operator:fixture-never-print@db.example.test'],{encoding:'utf8',env});assert.equal(unknown.status,1);assert.ok(!unknown.stderr.includes('fixture-never-print'));
});
console.log('Boundary: isolated PGlite SQL plus CLI validation; no real account, database connection, customer email or payment. Test databases were removed. The fixture queue is serial and does not prove production multi-connection locking.');
