import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {prepareCommerceSchemaMigration} from './lib/commerce-schema-migration.mjs';
import {prepareCommerceRuntimeRole,RUNTIME_TABLE_PERMISSIONS} from './lib/commerce-runtime-role.mjs';

const base=fs.readFileSync(new URL('../db/001-commerce.sql',import.meta.url),'utf8'),schema=prepareCommerceSchemaMigration(base),strict=prepareCommerceRuntimeRole(base),platform=prepareCommerceRuntimeRole(base,{allowExistingPlatformStatistics:true});
const testRoot=path.resolve(process.env.KARUU_TEST_DIR??path.join(process.cwd(),'work','commerce-runtime-tests'));fs.mkdirSync(testRoot,{recursive:true});
async function fixture(work){const directory=fs.mkdtempSync(path.join(testRoot,'runtime-')),db=new PGlite(directory);await db.waitReady;try{await db.exec('CREATE ROLE anon; CREATE ROLE authenticated');await db.exec(schema.sql);return await work(db);}finally{await db.close();const resolved=path.resolve(directory);assert.ok(resolved.startsWith(testRoot+path.sep)&&path.basename(resolved).startsWith('runtime-'));fs.rmSync(resolved,{recursive:true,force:true});}}
async function asRuntime(db,work){await db.exec('SET SESSION AUTHORIZATION karuu_web; SET search_path TO karuu_commerce,pg_catalog,pg_temp');try{assert.equal((await db.query('SELECT session_user')).rows[0].session_user,'karuu_web');return await work();}finally{await db.exec('RESET SESSION AUTHORIZATION; SET search_path TO pg_catalog,pg_temp');}}
async function rejectedApply(db,sql,pattern){await assert.rejects(db.exec(sql),pattern);await db.exec('ROLLBACK');}
async function roleCount(db){return (await db.query("SELECT count(*)::integer AS count FROM pg_roles WHERE rolname='karuu_web'")).rows[0].count;}
async function ownerUser(db){const id=randomUUID();await db.query("INSERT INTO karuu_commerce.commerce_users(id,email,display_name,password_hash,verified_at) VALUES($1,'fixture-owner@example.test','Fixture','fixture-hash',now())",[id]);return id;}

await test('role preparation is fixed, deterministic, credential-free and strict unless the two exact platform exceptions are chosen',()=>{
 assert.equal(strict.role,'karuu_web');assert.equal(strict.credentialIncluded,false);assert.equal(strict.applied,false);assert.equal(strict.policyCount,56);assert.deepEqual(strict.platformStatisticsExceptions,[]);assert.deepEqual(platform.platformStatisticsExceptions,['extensions.pg_stat_statements','extensions.pg_stat_statements_info']);assert.equal(strict.sql,prepareCommerceRuntimeRole(base).sql);
 assert.ok(strict.sql.includes('NOLOGIN PASSWORD NULL NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS'));assert.ok(strict.sql.includes('SET search_path TO "karuu_commerce",pg_catalog,pg_temp'));assert.ok(!strict.sql.includes('GRANT ALL'));assert.ok(!strict.sql.includes('WITH GRANT OPTION'));assert.ok(!strict.sql.includes('CREATE POLICY')||!strict.sql.includes('TO PUBLIC'));assert.ok(!strict.sql.includes('ALTER DEFAULT PRIVILEGES'));
 for(const role of ['postgres','authenticated','other','karuu_web;other'])assert.throws(()=>prepareCommerceRuntimeRole(base,{role}),{code:'invalid_runtime_options'});assert.throws(()=>prepareCommerceRuntimeRole(base,{allowExistingPlatformStatistics:'yes'}),{code:'invalid_runtime_options'});
});

await test('staged role has no login, bypass, ownership, outbound memberships or destructive grants; only creator ADMIN governance and exact policies',async()=>fixture(async db=>{
 await db.exec(platform.sql);const role=(await db.query("SELECT oid,rolsuper,rolinherit,rolcreaterole,rolcreatedb,rolcanlogin,rolreplication,rolbypassrls,rolconnlimit FROM pg_roles WHERE rolname='karuu_web'")).rows[0];for(const flag of ['rolsuper','rolinherit','rolcreaterole','rolcreatedb','rolcanlogin','rolreplication','rolbypassrls'])assert.equal(role[flag],false);assert.equal(role.rolconnlimit,10);
 assert.equal((await db.query('SELECT 1 FROM pg_auth_members WHERE member=$1',[role.oid])).rows.length,0);const governance=(await db.query('SELECT admin_option,inherit_option,set_option,member=current_user::regrole::oid AS creator FROM pg_auth_members WHERE roleid=$1',[role.oid])).rows;assert.deepEqual(governance,[{admin_option:true,inherit_option:false,set_option:false,creator:true}]);assert.equal((await db.query('SELECT 1 FROM pg_class WHERE relowner=$1',[role.oid])).rows.length,0);assert.equal((await db.query('SELECT 1 FROM pg_namespace WHERE nspowner=$1',[role.oid])).rows.length,0);
 const settings=(await db.query('SELECT setconfig FROM pg_db_role_setting WHERE setrole=$1',[role.oid])).rows.flatMap(row=>row.setconfig);assert.ok(settings.includes('search_path=karuu_commerce, pg_catalog, pg_temp'));assert.ok(settings.includes('row_security=on'));
 const policies=(await db.query("SELECT p.polname,p.polroles,p.polcmd,c.relname FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='karuu_commerce'")).rows;assert.equal(policies.length,56);assert.ok(policies.every(policy=>policy.polroles.length===1&&policy.polroles[0]===role.oid));
 for(const table of schema.tables){assert.ok(policies.some(policy=>policy.relname===table&&policy.polcmd==='r'));assert.equal((await db.query("SELECT has_table_privilege('karuu_web',$1,'TRUNCATE,REFERENCES,TRIGGER') AS allowed",[`karuu_commerce.${table}`])).rows[0].allowed,false);for(const denied of ['anon','authenticated'])assert.equal((await db.query("SELECT has_table_privilege($1,$2,'SELECT,INSERT,UPDATE,DELETE') AS allowed",[denied,`karuu_commerce.${table}`])).rows[0].allowed,false);}
 assert.equal((await db.query("SELECT has_schema_privilege('karuu_web','karuu_commerce','USAGE') AS usage,has_schema_privilege('karuu_web','karuu_commerce','CREATE') AS create")).rows[0].usage,true);assert.equal((await db.query("SELECT has_schema_privilege('karuu_web','karuu_commerce','CREATE') AS allowed")).rows[0].allowed,false);
 assert.deepEqual(Object.keys(RUNTIME_TABLE_PERMISSIONS),schema.tables);await rejectedApply(db,schema.sql,/unrecognized provenance/);assert.equal(await roleCount(db),1);await rejectedApply(db,platform.sql,/role collision/);
 await db.exec('CREATE TABLE karuu_commerce.fixture_future_table(id integer)');await asRuntime(db,async()=>{await assert.rejects(db.exec('SELECT * FROM fixture_future_table'),{code:'42501'});});
}));

await test('actual runtime account upsert, verification, sessions, catalog, inquiries, order and append-only audit SQL work through RLS',async()=>fixture(async db=>{
 await db.exec(platform.sql);const id=randomUUID(),orderId=randomUUID(),inquiryId=randomUUID(),auditId=randomUUID();
 await asRuntime(db,async()=>{
  await db.query("INSERT INTO commerce_users(id,email,display_name,password_hash) VALUES($1,'runtime-fixture@example.test','Runtime fixture','fixture-one') ON CONFLICT(email) DO UPDATE SET password_hash=CASE WHEN commerce_users.verified_at IS NULL THEN EXCLUDED.password_hash ELSE commerce_users.password_hash END",[id]);
  await db.query("INSERT INTO commerce_users(id,email,display_name,password_hash) VALUES($1,'runtime-fixture@example.test','Runtime fixture','fixture-two') ON CONFLICT(email) DO UPDATE SET password_hash=CASE WHEN commerce_users.verified_at IS NULL THEN EXCLUDED.password_hash ELSE commerce_users.password_hash END",[id]);
  await db.query('UPDATE commerce_users SET verified_at=now() WHERE id=$1',[id]);assert.equal((await db.query('SELECT id FROM commerce_users WHERE id=$1 FOR UPDATE',[id])).rows[0].id,id);
  await db.query("INSERT INTO commerce_sessions(token_hash,user_id,expires_at) VALUES('fixture-token',$1,now()+interval '1 day')",[id]);assert.equal((await db.query("DELETE FROM commerce_sessions WHERE token_hash='fixture-token' RETURNING user_id")).rows[0].user_id,id);
  await db.exec("INSERT INTO commerce_assets(id,work_slug,title,format,language,object_key) VALUES('fixture-epub','fixture-work','Fixture','EPUB','en','fixture/private.epub'); INSERT INTO commerce_skus(id,slug,title,kind,currency) VALUES('fixture-sku','fixture-work','Fixture','ebook','SEK'); INSERT INTO commerce_costs(sku_id,inputs) VALUES('fixture-sku','{}') ON CONFLICT(sku_id) DO UPDATE SET inputs=EXCLUDED.inputs; INSERT INTO commerce_creations(slug,publication_status,data) VALUES('fixture-work','draft','{}') ON CONFLICT(slug) DO UPDATE SET publication_status=EXCLUDED.publication_status; SELECT id FROM commerce_assets WHERE id='fixture-epub' FOR SHARE; SELECT id FROM commerce_skus WHERE id='fixture-sku' FOR SHARE");
  await db.query("INSERT INTO commerce_inquiries(id,reference,brand,idempotency_key,request_hash,data) VALUES($1,'FIXTURE-ONLY','karuu','fixture-key','fixture-hash','{}') RETURNING id",[inquiryId]);await db.query("UPDATE commerce_inquiries SET status='in_progress' WHERE id=$1",[inquiryId]);
  await db.query("INSERT INTO commerce_orders(id,user_id,idempotency_key,request_hash,status,currency,total_minor,market,snapshot,consent_version,consent_at) VALUES($1,$2,'fixture-order','fixture-request','pending','SEK',100,'SE','[]','fixture-only',now())",[orderId,id]);await db.query("UPDATE commerce_orders SET status='paid' WHERE id=$1",[orderId]);
  await db.query("INSERT INTO commerce_payment_events(id,type,object_id) VALUES('fixture-event','fixture.type',$1) ON CONFLICT DO NOTHING RETURNING id",[orderId]);await db.query("INSERT INTO commerce_entitlements(user_id,asset_id,order_id,status) VALUES($1,'fixture-epub',$2,'active') ON CONFLICT DO NOTHING",[id,orderId]);
  await db.query("INSERT INTO commerce_audit(id,actor_id,action,target,reason,detail) VALUES($1,$2,'fixture_runtime',$3,'Isolated permission fixture','{}')",[auditId,id,orderId]);assert.equal((await db.query('SELECT id FROM commerce_audit WHERE id=$1',[auditId])).rows[0].id,auditId);
  await db.query("UPDATE commerce_entitlements SET status='revoked' WHERE order_id=$1",[orderId]);await db.query("UPDATE commerce_orders SET status='refunded',refunded_minor=100 WHERE id=$1",[orderId]);assert.equal((await db.query('SELECT version FROM commerce_schema')).rows[0].version,1);
 });
 assert.equal((await db.query('SELECT role,brands,password_hash FROM karuu_commerce.commerce_users WHERE id=$1',[id])).rows[0].role,'customer');
}));

await test('runtime cannot promote/admin-scope users, rewrite audit/events/ledger, delete orders, change schema/RLS or bypass anon isolation',async()=>fixture(async db=>{
 const id=await ownerUser(db);await db.exec(platform.sql);await asRuntime(db,async()=>{
  const denied=[`UPDATE commerce_users SET role='admin' WHERE id='${id}'`,`UPDATE commerce_users SET brands=ARRAY['jkj-plus'] WHERE id='${id}'`,"INSERT INTO commerce_users(id,email,display_name,password_hash,role) VALUES('00000000-0000-4000-8000-000000000001','denied@example.test','Denied','fixture','admin')",'DELETE FROM commerce_orders','UPDATE commerce_audit SET reason=\'tampered\'','DELETE FROM commerce_audit','UPDATE commerce_payment_events SET type=\'tampered\'','UPDATE commerce_point_ledger SET units=99','INSERT INTO commerce_schema(version) VALUES(2)','TRUNCATE commerce_inquiries','ALTER TABLE commerce_users DISABLE ROW LEVEL SECURITY','CREATE TABLE karuu_commerce.unauthorized(id integer)'];
  for(const sql of denied)await assert.rejects(db.exec(sql),{code:'42501'});
  await assert.rejects(db.exec('SET ROLE pg_read_all_stats'),{code:'42501'});await db.exec('SET row_security=off');await assert.rejects(db.exec('SELECT * FROM commerce_users'),{code:'42501'});await db.exec('SET row_security=on');
 });assert.equal((await db.query('SELECT role FROM karuu_commerce.commerce_users WHERE id=$1',[id])).rows[0].role,'customer');
}));

await test('funding locks remain usable while funding mutations are denied; campaign/KRU writes stay column-scoped',async()=>fixture(async db=>{
 const id=await ownerUser(db);await db.query("INSERT INTO karuu_commerce.commerce_game_funding(id,user_id,game_id,original_funding_id,units,rules_version,status) VALUES('fixture-funding',$1,'fixture-game','fixture-receipt',5,'fixture-v1','confirmed')",[id]);await db.exec("INSERT INTO karuu_commerce.commerce_game_campaigns(id,game_id,rules_version,reward_units,budget_units) VALUES('fixture-campaign','fixture-game','fixture-v1',1,5)");const kruId=randomUUID();await db.query("INSERT INTO karuu_commerce.commerce_kru_records(id,user_id,event_key) VALUES($1,$2,'fixture-kru')",[kruId,id]);await db.exec(platform.sql);
 await asRuntime(db,async()=>{
  assert.equal((await db.query("SELECT * FROM commerce_game_funding WHERE id='fixture-funding' FOR UPDATE")).rows[0].status,'confirmed');await assert.rejects(db.exec("UPDATE commerce_game_funding SET id=id WHERE id='fixture-funding'"),{code:'42501'});await assert.rejects(db.exec("UPDATE commerce_game_funding SET status='reversed' WHERE id='fixture-funding'"),{code:'42501'});
  await db.exec("UPDATE commerce_game_campaigns SET used_units=used_units+1 WHERE id='fixture-campaign'");await assert.rejects(db.exec("UPDATE commerce_game_campaigns SET budget_units=999 WHERE id='fixture-campaign'"),{code:'42501'});await db.query("UPDATE commerce_kru_records SET state='cancelled' WHERE id=$1",[kruId]);await assert.rejects(db.query("UPDATE commerce_kru_records SET units=999 WHERE id=$1",[kruId]),{code:'42501'});
  await db.query("INSERT INTO commerce_point_ledger(id,user_id,game_id,source,units,event_key) VALUES($1,$2,'fixture-game','gift',1,'fixture-append')",[randomUUID(),id]);
 });
}));

await test('pre-existing role/membership and baseline drift are never repaired, and injected failure rolls back new role and policies',async()=>fixture(async db=>{
 await db.exec('CREATE ROLE unrelated_fixture; CREATE ROLE karuu_web BYPASSRLS; GRANT unrelated_fixture TO karuu_web');const before=(await db.query("SELECT rolbypassrls FROM pg_roles WHERE rolname='karuu_web'")).rows;await rejectedApply(db,platform.sql,/role collision/);assert.deepEqual((await db.query("SELECT rolbypassrls FROM pg_roles WHERE rolname='karuu_web'")).rows,before);assert.equal((await db.query("SELECT 1 FROM pg_auth_members m JOIN pg_roles r ON r.oid=m.member WHERE r.rolname='karuu_web'")).rows.length,1);await db.exec('REVOKE unrelated_fixture FROM karuu_web; DROP ROLE karuu_web');
 await db.exec('BEGIN; ALTER TABLE karuu_commerce.commerce_users ADD COLUMN fixture_drift text');await rejectedApply(db,platform.sql,/baseline drift/);assert.equal(await roleCount(db),0);
 await rejectedApply(db,platform.sql.replace('CREATE POLICY karuu_web_select ON "karuu_commerce"."commerce_schema"','SELECT fixture_abort_missing();\nCREATE POLICY karuu_web_select ON "karuu_commerce"."commerce_schema"'));assert.equal(await roleCount(db),0);assert.equal((await db.query("SELECT 1 FROM pg_policies WHERE schemaname='karuu_commerce'")).rows.length,0);
 // An initially permissive creator edge is narrowed before completion.
 await db.exec(platform.sql.replace('COMMENT ON ROLE','GRANT karuu_web TO CURRENT_USER;\nCOMMENT ON ROLE'));assert.deepEqual((await db.query("SELECT m.admin_option,m.inherit_option,m.set_option FROM pg_auth_members m JOIN pg_roles r ON r.oid=m.roleid WHERE r.rolname='karuu_web'")).rows,[{admin_option:true,inherit_option:false,set_option:false}]);
}));

await test('outside business table/column/sequence/CREATE/definer access aborts without touching shared ACLs',async()=>fixture(async db=>{
 const unsafe=[
  "CREATE TABLE public.other_business(id integer); GRANT SELECT ON public.other_business TO PUBLIC",
  "CREATE TABLE public.other_business(id integer); GRANT SELECT(id) ON public.other_business TO PUBLIC",
  "CREATE SEQUENCE public.other_sequence; GRANT USAGE ON public.other_sequence TO PUBLIC",
  "GRANT CREATE ON SCHEMA public TO PUBLIC",
  "CREATE FUNCTION public.other_definer() RETURNS integer LANGUAGE sql SECURITY DEFINER AS 'SELECT 1'"
  ,"CREATE SCHEMA pgmq; GRANT USAGE ON SCHEMA pgmq TO PUBLIC; CREATE TABLE pgmq.business(id integer); GRANT SELECT ON pgmq.business TO PUBLIC"
  ,"ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO PUBLIC"
 ];
 for(const setup of unsafe){await db.exec('BEGIN');await db.exec(setup);await assert.rejects(db.exec(platform.sql),/inherited data access|outside sequence|persistent CREATE|SECURITY DEFINER|PUBLIC table\/sequence defaults/);await db.exec('ROLLBACK');assert.equal(await roleCount(db),0);}
 await db.exec(platform.sql);
}));

await test('actual local non-superuser CREATEROLE owner can stage the role and retain only ADMIN management without runtime inheritance',async()=>fixture(async db=>{
 await db.exec('DROP SCHEMA karuu_commerce CASCADE; CREATE ROLE operator_fixture CREATEROLE NOLOGIN');const database=(await db.query('SELECT current_database() AS name')).rows[0].name;assert.ok(/^[a-zA-Z0-9_-]+$/.test(database));await db.exec(`GRANT CREATE ON DATABASE "${database}" TO operator_fixture; SET SESSION AUTHORIZATION operator_fixture; SET search_path TO pg_catalog,pg_temp`);
 try{
  assert.equal((await db.query("SELECT rolsuper FROM pg_roles WHERE rolname=current_user")).rows[0].rolsuper,false);await db.exec(schema.sql);await db.exec(platform.sql);await db.exec("ALTER ROLE karuu_web SET statement_timeout='30s'");
  const graph=(await db.query("SELECT m.admin_option,m.inherit_option,m.set_option,member=current_user::regrole::oid AS creator FROM pg_auth_members m JOIN pg_roles r ON r.oid=m.roleid WHERE r.rolname='karuu_web'")).rows;assert.deepEqual(graph,[{admin_option:true,inherit_option:false,set_option:false,creator:true}]);assert.equal((await db.query("SELECT 1 FROM pg_auth_members m JOIN pg_roles r ON r.oid=m.member WHERE r.rolname='karuu_web'")).rows.length,0);
 }finally{await db.exec('ROLLBACK; RESET SESSION AUTHORIZATION');}
}));

await test('platform exceptions never accept extensions namespace generally or namesake/replaced business views',async()=>fixture(async db=>{
 await db.exec('CREATE SCHEMA extensions; GRANT USAGE ON SCHEMA extensions TO PUBLIC');
 for(const name of ['another_view','pg_stat_statements','pg_stat_statements_info']){
  await db.exec(`BEGIN; CREATE VIEW extensions."${name}" AS SELECT 1 AS fixture; GRANT SELECT ON extensions."${name}" TO PUBLIC`);await assert.rejects(db.exec(platform.sql),/inherited data access/);await db.exec('ROLLBACK');assert.equal(await roleCount(db),0);
 }
 await db.exec(strict.sql);assert.equal(await roleCount(db),1);
}));
console.log('Boundary: isolated PGlite permission/RLS SQL only; no real role, login credential, Supabase authorization, email or payment. Real C pg_stat_statements redaction is supported by official docs + read-only live metadata, not simulated as an installed PGlite extension. Fixture directories removed; no multi-connection claim.');
