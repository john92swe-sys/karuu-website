import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {prepareCommerceSchemaMigration,validatedCommerceSchema} from './lib/commerce-schema-migration.mjs';
import {bootstrapAdministrator,bootstrapDatabaseSchema} from './lib/commerce-admin-bootstrap.mjs';

const base=fs.readFileSync(new URL('../db/001-commerce.sql',import.meta.url),'utf8');
const prepared=prepareCommerceSchemaMigration(base),target=prepared.schema;
const testRoot=path.resolve(process.env.KARUU_TEST_DIR??path.join(process.cwd(),'work','commerce-schema-tests'));fs.mkdirSync(testRoot,{recursive:true});
async function fixture(work){
 const directory=fs.mkdtempSync(path.join(testRoot,'schema-')),db=new PGlite(directory);await db.waitReady;
 try{return await work(db);}finally{await db.close();const resolved=path.resolve(directory);assert.ok(resolved.startsWith(testRoot+path.sep)&&path.basename(resolved).startsWith('schema-'));fs.rmSync(resolved,{recursive:true,force:true});}
}
async function deniedRole(db,role,sql){await db.exec(`SET ROLE "${role}"`);try{await assert.rejects(db.exec(sql),{code:'42501'});}finally{await db.exec('RESET ROLE');}}
async function recover(db){await db.exec('ROLLBACK');}
async function namespaceState(db){return (await db.query("SELECT n.nspname,n.nspacl::text,obj_description(n.oid,'pg_namespace') AS comment FROM pg_namespace n WHERE n.nspname IN ('public','private') ORDER BY n.nspname")).rows;}

await test('wrapper validates the fixed target and reviewed version-1 manifest without any database URL',()=>{
 assert.equal(prepared.tables.length,22);assert.equal(prepared.indexes.length,4);assert.equal(prepared.baseSha256,createHash('sha256').update(base).digest('hex'));assert.equal(prepareCommerceSchemaMigration(base).sql,prepared.sql);
 for(const schema of ['public','private','auth','karuu_commerce;DROP SCHEMA public','karuu_commerce.extra','KARUU_COMMERCE'])assert.throws(()=>validatedCommerceSchema(schema),{code:'invalid_schema'});
 assert.throws(()=>prepareCommerceSchemaMigration(base.replace('BEGIN;','')),{code:'invalid_base'});assert.throws(()=>prepareCommerceSchemaMigration(base.replace('commerce_kru_records (','commerce_new_records (')),{code:'unsupported_base'});
 assert.throws(()=>prepareCommerceSchemaMigration(base+'\nDROP TABLE public.unrelated_fixture;'),{code:'unsupported_base'});
 assert.ok(prepared.sql.includes('SET LOCAL search_path TO "karuu_commerce", pg_catalog, pg_temp'));assert.ok(!prepared.sql.includes('CREATE ROLE'));assert.ok(!prepared.sql.includes('CREATE POLICY'));assert.ok(!prepared.sql.includes('FORCE ROW LEVEL SECURITY'));
});

await test('all 22 tables, 4 business indexes, owners and foreign keys stay private, RLS-enabled with zero policies',async()=>fixture(async db=>{
 await db.exec(prepared.sql);
 const tables=(await db.query("SELECT c.relname,c.relrowsecurity,c.relforcerowsecurity,r.rolname=current_user AS owner FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_roles r ON r.oid=c.relowner WHERE n.nspname=$1 AND c.relkind='r' ORDER BY c.relname",[target])).rows;
 assert.deepEqual(tables.map(row=>row.relname),[...prepared.tables].sort());assert.ok(tables.every(row=>row.relrowsecurity&&!row.relforcerowsecurity&&row.owner));
 assert.equal((await db.query('SELECT * FROM pg_policies WHERE schemaname=$1',[target])).rows.length,0);
 const fks=(await db.query("SELECT sn.nspname AS source,tn.nspname AS target FROM pg_constraint co JOIN pg_class s ON s.oid=co.conrelid JOIN pg_namespace sn ON sn.oid=s.relnamespace JOIN pg_class t ON t.oid=co.confrelid JOIN pg_namespace tn ON tn.oid=t.relnamespace WHERE co.contype='f' AND sn.nspname=$1",[target])).rows;assert.ok(fks.length>15);assert.ok(fks.every(row=>row.source===target&&row.target===target));
 const indexes=(await db.query('SELECT indexname FROM pg_indexes WHERE schemaname=$1',[target])).rows.map(row=>row.indexname);for(const index of prepared.indexes)assert.ok(indexes.includes(index.name));
 assert.deepEqual((await db.query(`SELECT version FROM "${target}".commerce_schema`)).rows,[{version:1}]);assert.equal((await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'commerce_%'")).rows.length,0);
}));

await test('public and existing private data, ACLs and public-scoped defaults survive same-name collision and replay',async()=>fixture(async db=>{
 await db.exec("CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA private; GRANT USAGE ON SCHEMA private TO anon,authenticated; CREATE TABLE public.commerce_users(id text PRIMARY KEY,legacy_data text); INSERT INTO public.commerce_users VALUES('public-fixture','untouched'); CREATE TABLE private.reflex20_revoked_tokens(token text PRIMARY KEY); INSERT INTO private.reflex20_revoked_tokens VALUES('private-fixture'); ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon,authenticated");
 const before=await namespaceState(db),defaults=(await db.query("SELECT defaclrole,defaclnamespace,defaclobjtype,defaclacl::text FROM pg_default_acl WHERE defaclnamespace='public'::regnamespace")).rows;
 await db.exec(prepared.sql);const id=randomUUID();await db.query(`INSERT INTO "${target}".commerce_users(id,email,display_name,password_hash) VALUES($1,'schema-fixture@example.test','Private fixture','not-a-real-password')`,[id]);
 await db.exec(prepared.sql);assert.deepEqual(await namespaceState(db),before);assert.deepEqual((await db.query("SELECT defaclrole,defaclnamespace,defaclobjtype,defaclacl::text FROM pg_default_acl WHERE defaclnamespace='public'::regnamespace")).rows,defaults);
 assert.deepEqual((await db.query('SELECT * FROM public.commerce_users')).rows,[{id:'public-fixture',legacy_data:'untouched'}]);assert.deepEqual((await db.query('SELECT * FROM private.reflex20_revoked_tokens')).rows,[{token:'private-fixture'}]);assert.equal((await db.query(`SELECT id FROM "${target}".commerce_users`)).rows[0].id,id);assert.equal((await db.query(`SELECT version FROM "${target}".commerce_schema`)).rows.length,1);
}));

await test('PUBLIC, anon and authenticated cannot use private tables; future-table defaults remain denied and future function EXECUTE is documented',async()=>fixture(async db=>{
 await db.exec('CREATE ROLE anon; CREATE ROLE authenticated');await db.exec(prepared.sql);
 for(const role of ['anon','authenticated']){
  const schema=(await db.query('SELECT has_schema_privilege($1,$2,\'USAGE\') AS usage,has_schema_privilege($1,$2,\'CREATE\') AS create',[role,target])).rows[0];assert.deepEqual(schema,{usage:false,create:false});
  for(const table of prepared.tables)assert.equal((await db.query('SELECT has_table_privilege($1,$2,\'SELECT,INSERT,UPDATE,DELETE\') AS allowed',[role,`${target}.${table}`])).rows[0].allowed,false);
  await deniedRole(db,role,`SELECT * FROM "${target}".commerce_schema`);
 }
 assert.equal((await db.query("SELECT count(*)::integer AS count FROM pg_namespace n CROSS JOIN LATERAL aclexplode(n.nspacl) a WHERE n.nspname=$1 AND a.grantee=0",[target])).rows[0].count,0);
 await db.exec(`CREATE TABLE "${target}".fixture_future_table(id integer); CREATE FUNCTION "${target}".fixture_future_function() RETURNS text LANGUAGE sql AS 'SELECT ''fixture''::text'`);
 for(const role of ['anon','authenticated']){
  assert.equal((await db.query('SELECT has_table_privilege($1,$2,\'SELECT\') AS allowed',[role,`${target}.fixture_future_table`])).rows[0].allowed,false);
  // PostgreSQL's built-in global function default is still PUBLIC EXECUTE;
  // per-schema default revokes cannot remove it. Schema USAGE blocks invocation.
  assert.equal((await db.query('SELECT has_function_privilege($1,$2,\'EXECUTE\') AS allowed',[role,`${target}.fixture_future_function()`])).rows[0].allowed,true);
  await deniedRole(db,role,`SELECT "${target}".fixture_future_function()`);
 }
 await db.exec(`REVOKE ALL PRIVILEGES ON FUNCTION "${target}".fixture_future_function() FROM PUBLIC`);
}));

await test('a non-owner runtime role remains default-denied by RLS even after fixture-only schema/table grants',async()=>fixture(async db=>{
 await db.exec(prepared.sql);await db.exec(`CREATE ROLE runtime_fixture; GRANT USAGE ON SCHEMA "${target}" TO runtime_fixture; GRANT SELECT,INSERT ON "${target}".commerce_schema TO runtime_fixture; SET ROLE runtime_fixture`);
 try{assert.deepEqual((await db.query(`SELECT * FROM "${target}".commerce_schema`)).rows,[]);await assert.rejects(db.exec(`INSERT INTO "${target}".commerce_schema(version) VALUES(2)`),{code:'42501'});}finally{await db.exec('RESET ROLE');}
 assert.deepEqual((await db.query(`SELECT version FROM "${target}".commerce_schema`)).rows,[{version:1}]);
}));

await test('unknown target schema, unexpected replay objects, unsafe global defaults and mid-migration failure abort atomically',async()=>fixture(async db=>{
 await db.exec(`CREATE SCHEMA "${target}"; CREATE TABLE "${target}".other_system(id integer); INSERT INTO "${target}".other_system VALUES(7)`);await assert.rejects(db.exec(prepared.sql),/unrecognized provenance/);await recover(db);assert.deepEqual((await db.query(`SELECT * FROM "${target}".other_system`)).rows,[{id:7}]);await db.exec(`DROP SCHEMA "${target}" CASCADE`);
 const failed=prepared.sql.replace('ENABLE ROW LEVEL SECURITY;','ENABLE ROW LEVEL SECURITY; SELECT karuu_fixture_abort_missing_function();');await assert.rejects(db.exec(failed));await recover(db);assert.equal((await db.query('SELECT 1 FROM pg_namespace WHERE nspname=$1',[target])).rows.length,0);
 await db.exec('CREATE ROLE anon; ALTER DEFAULT PRIVILEGES GRANT SELECT ON TABLES TO anon');const defaults=(await db.query("SELECT defaclobjtype,defaclacl::text FROM pg_default_acl WHERE defaclnamespace=0")).rows;await assert.rejects(db.exec(prepared.sql),/unsafe global default grants/);await recover(db);assert.equal((await db.query('SELECT 1 FROM pg_namespace WHERE nspname=$1',[target])).rows.length,0);assert.deepEqual((await db.query("SELECT defaclobjtype,defaclacl::text FROM pg_default_acl WHERE defaclnamespace=0")).rows,defaults);
 await db.exec('ALTER DEFAULT PRIVILEGES REVOKE SELECT ON TABLES FROM anon');await db.exec(prepared.sql);await db.exec(`CREATE VIEW "${target}".unexpected_view AS SELECT 1 AS fixture`);await assert.rejects(db.exec(prepared.sql),/unexpected objects/);await recover(db);assert.equal((await db.query(`SELECT * FROM "${target}".unexpected_view`)).rows[0].fixture,1);
}));

await test('explicit pg_temp last prevents temporary commerce names from shadowing migration and runtime queries',async()=>fixture(async db=>{
 await db.exec('CREATE TEMPORARY TABLE pg_namespace(fake integer); CREATE TEMPORARY TABLE pg_roles(fake integer); CREATE TEMPORARY TABLE commerce_schema(version integer); INSERT INTO commerce_schema VALUES(99); CREATE TEMPORARY TABLE commerce_users(id text); INSERT INTO commerce_users VALUES(\'temporary-fixture\')');await db.exec(prepared.sql);
 await db.exec(`SET search_path TO "${target}",pg_catalog,pg_temp`);assert.deepEqual((await db.query('SELECT version FROM commerce_schema')).rows,[{version:1}]);assert.equal((await db.query('SELECT id FROM commerce_users')).rows.length,0);assert.deepEqual((await db.query('SELECT version FROM pg_temp.commerce_schema')).rows,[{version:99}]);
}));

await test('replay refuses table, column, constraint, index, policy, RLS and privilege drift instead of silently repairing it',async()=>fixture(async db=>{
 await db.exec(prepared.sql);const changes=[
  `ALTER TABLE "${target}".commerce_assets ADD COLUMN fixture_drift text`,
  `ALTER TABLE "${target}".commerce_schema ADD CONSTRAINT fixture_drift CHECK(version>0)`,
  `DROP INDEX "${target}".commerce_outbox_ready`,
  `ALTER TABLE "${target}".commerce_schema FORCE ROW LEVEL SECURITY`,
  `ALTER TABLE "${target}".commerce_schema DISABLE ROW LEVEL SECURITY`,
  `CREATE POLICY fixture_drift ON "${target}".commerce_schema USING(true)`,
  `GRANT USAGE ON SCHEMA "${target}" TO PUBLIC`,
  `DROP TABLE "${target}".commerce_kru_records`
 ];
 for(const change of changes){await db.exec('BEGIN');await db.exec(change);await assert.rejects(db.exec(prepared.sql),/unrecognized provenance/);await recover(db);assert.equal((await db.query(`SELECT version FROM "${target}".commerce_schema`)).rows[0].version,1);}
 await db.exec(prepared.sql);
}));

await test('the administrator tool selects only the configured private account/audit namespace and rejects unsafe identifiers',async()=>fixture(async db=>{
 await db.exec(base);await db.exec(prepared.sql);const id=randomUUID(),publicId=randomUUID();for(const [schema,userId] of [[target,id],['public',publicId]])await db.query(`INSERT INTO "${schema}".commerce_users(id,email,display_name,password_hash,verified_at) VALUES($1,'owner@example.test','Schema fixture','not-a-real-password',now())`,[userId]);
 const pool={connect:async()=>({query:(sql,values=[])=>db.query(sql,values),release:()=>{}})};const input={email:'owner@example.test',brands:['karuu'],operator:'Private schema fixture',reason:'Isolated private-schema bootstrap acceptance only.'};
 const preview=await bootstrapAdministrator(pool,input,{schema:target});assert.equal(preview.schema,target);assert.equal(preview.target.id,id);
 await bootstrapAdministrator(pool,{...input,apply:true,confirmUserId:id},{schema:target});assert.equal((await db.query(`SELECT role FROM "${target}".commerce_users WHERE id=$1`,[id])).rows[0].role,'admin');assert.equal((await db.query('SELECT role FROM public.commerce_users WHERE id=$1',[publicId])).rows[0].role,'customer');assert.equal((await db.query('SELECT id FROM public.commerce_audit')).rows.length,0);assert.equal((await db.query(`SELECT detail FROM "${target}".commerce_audit`)).rows[0].detail.schema,target);
 for(const schema of ['pg_catalog','pg_temp','information_schema','karuu_commerce;public','karuu_commerce,public'])assert.throws(()=>bootstrapDatabaseSchema(schema),{code:'invalid_schema'});
}));
console.log('Boundary: isolated PGlite PostgreSQL-WASM permissions and schema SQL; no real Supabase migration, API data, provider credential, account, email or payment. No production multi-connection or PostgREST configuration claim. Fixture database directories removed.');
