import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import util from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import {PGlite} from '@electric-sql/pglite';
import {prepareCommerceSchemaMigration} from './lib/commerce-schema-migration.mjs';
import {prepareCommerceRuntimeRole} from './lib/commerce-runtime-role.mjs';

// Actual helper/admin/export/auth/http and validators, with local PostgreSQL-WASM
// RLS. Transport and framework serialization are local fixtures. No provider,
// password, production account, real registration or business-cost claim exists.
const root=path.resolve(import.meta.dirname,'..');
const base=fs.readFileSync(path.join(root,'db/001-commerce.sql'),'utf8');
const migration=fs.readFileSync(path.join(root,'db/003-global-tax-preparation.sql'),'utf8');
const sentinel='PRIVATE_PROOF_PERSON_EMAIL_AND_SECRET_NOT_FOR_EXPORT';
const ownerPath='SET search_path TO karuu_commerce,pg_catalog,pg_temp';
const iso=()=>new Date().toISOString();
const adminUser={id:crypto.randomUUID(),email:'private-operator@example.test',role:'admin',brands:['karuu']};

async function fixture(work,{version3=false}={}){
  const db=new PGlite();await db.waitReady;
  await db.exec('CREATE ROLE anon; CREATE ROLE authenticated');
  await db.exec(prepareCommerceSchemaMigration(base).sql);
  await db.exec(prepareCommerceRuntimeRole(base).sql);
  await db.exec(ownerPath+'; INSERT INTO commerce_schema(version) VALUES(2)');
  if(version3)await db.exec(migration);
  const trace=[];let token=null,networkCalls=0;
  const unexpected=()=>{networkCalls++;throw Error('No provider operation is allowed in preparation review');};
  const database={
    query:async(sql,values=[])=>{
      trace.push(sql);assert.match(sql.trim(),/^SELECT\b/,'Preparation reads must not mutate the database');
      await db.exec('SET SESSION AUTHORIZATION karuu_web; '+ownerPath);
      try{return (await db.query(sql,values)).rows;}
      finally{await db.exec('SET SESSION AUTHORIZATION postgres; '+ownerPath);}
    },transaction:unexpected,audit:unexpected,limit:unexpected,
  };
  const modules=new Map(),env={KARUU_AUTOMATIC_TAX_ENABLED:'true',KARUU_TAX_CONFIG_APPROVED:'true',KARUU_LIVE_COMMERCE_APPROVED:'true'};
  function loadFile(filename){
    if(modules.has(filename))return modules.get(filename);
    const module={exports:{}};modules.set(filename,module.exports);
    const require=name=>{
      if(name==='node:crypto')return crypto;if(name==='node:util')return util;
      if(name==='next/server')return {NextResponse:Response};
      if(name==='next/headers')return {cookies:async()=>({get:key=>key==='karuu_session'&&token?{value:token}:undefined})};
      if(name==='./db'||name==='@/lib/server/db')return database;
      if(name==='./mail')return {brandMailConfigured:unexpected,sendBrandMail:unexpected};
      if(name==='./commerce')return {status:unexpected,stripeClient:unexpected};
      if(name==='./delivery')return {entitledAsset:unexpected};
      if(name==='./works')return {saveCreation:unexpected};
      if(name==='./payments')return {requestFullRefund:unexpected};
      if(name==='./private-media')return {privateBucket:unexpected,confirmPrivateR2Object:unexpected};
      if(name.startsWith('@/lib/server/'))return load(name.slice('@/lib/server/'.length));
      if(name.startsWith('./'))return loadFile(path.resolve(path.dirname(filename),name+'.ts'));
      throw Error('Unapproved dependency '+name);
    };
    const code=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
    vm.runInContext(code,vm.createContext({module,exports:module.exports,require,process:{env},Date,Buffer,URL,Request,Response,Headers,console,fetch:unexpected}),{filename});modules.set(filename,module.exports);return module.exports;
  }
  const load=name=>loadFile(path.join(root,'src/lib/server',name+'.ts'));
  const readiness=load('tax-readiness'),admin=load('admin'),core=load('core');
  const exportRoute=loadFile(path.join(root,'src/app/api/admin/export/route.ts'));
  async function sku(id,{mode='manual_verified',preparation={},costs=null}={}){
    await db.query("INSERT INTO commerce_skus(id,slug,title,kind,currency,components) VALUES($1,$1,'Fixture edition','ebook','USD',$2)",[id,JSON.stringify([{assetId:'ebook-one',allocationBps:10000}])]);
    if(version3)await db.query('UPDATE commerce_skus SET tax_mode=$2,automatic_tax_config=$3 WHERE id=$1',[id,mode,JSON.stringify(preparation)]);
    if(costs!==null)await db.query('INSERT INTO commerce_costs(sku_id,inputs) VALUES($1,$2)',[id,JSON.stringify(costs)]);
  }
  async function session(user=adminUser){
    await db.query('INSERT INTO commerce_users(id,email,display_name,password_hash,verified_at,role,brands) VALUES($1,$2,$3,$4,now(),$5,$6)',[user.id,user.email,'Isolated user','fixture',user.role,user.brands]);
    token=crypto.randomBytes(32).toString('hex');await db.query("INSERT INTO commerce_sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')",[core.hash(token),user.id]);
  }
  const exportGet=()=>exportRoute.GET(new Request('https://karuu.example.test/api/admin/export?view=tax_readiness'));
  try{await work({db,sku,session,exportGet,readiness,admin,core,trace,setToken:value=>{token=value;},networkCalls:()=>networkCalls});assert.equal(networkCalls,0,'No Stripe, mail, transaction or other provider operation may execute');}
  finally{await db.close();}
}
function prep(){const review={reviewedAt:iso(),evidenceReference:sentinel};return {version:'karuu-automatic-tax-preparation-v1',components:[{assetId:'ebook-one',taxCode:'txcd_10302000',review}],jurisdictions:[{country:'SE',registrationId:'taxreg_privateIdentity',registrationCountry:'SE',registrationType:'standard',placeOfSupplyScheme:'standard',review}],pricing:{mode:'checkout_automatic',percentFee:0.005,fixedFeeMinor:0,inclusiveTaxRateCeiling:0.3,review},sandboxReview:review,privateProof:sentinel,personEmail:sentinel,serverSecret:sentinel};}
const code=expected=>error=>error.code===expected;

await test('v2/legacy database safely reports unapplied preparation migration without referencing missing columns or applying DDL',async()=>fixture(async f=>{
  await f.sku('legacy');const before=(await f.db.query('SELECT version FROM commerce_schema ORDER BY version')).rows;
  const result=await f.admin.adminView(adminUser,'tax_readiness');assert.equal(result.preparationSchemaApplied,false);assert.match(result.schemaStatus,/not been applied/);assert.equal(result.items[0].tax_setup,'Manual tax setup');assert.equal(result.items[0].preparationComplete,null);assert.equal(result.providerEvidenceChecked,false);
  assert.deepEqual((await f.db.query('SELECT version FROM commerce_schema ORDER BY version')).rows,before);assert.equal((await f.db.query("SELECT 1 FROM information_schema.columns WHERE table_schema='karuu_commerce' AND table_name='commerce_skus' AND column_name='tax_mode'")).rows.length,0);
}));
await test('stored automatic preparation reports genuine missing review fields and unknown costs, not readiness',async()=>fixture(async f=>{
  await f.sku('partial',{mode:'stripe_automatic'});const report=await f.readiness.taxReadiness(adminUser),item=report.items[0];
  assert.equal(report.preparationSchemaApplied,true);assert.match(item.preparation_status,/not been saved/);assert.equal(item.preparationComplete,false);assert.equal(item.costInputsComplete,false);assert.ok(item.missingCostFields.includes('delivery'));assert.ok(item.preparationGapCodes.includes('component_tax_classification'));assert.ok(item.preparationGapCodes.includes('automatic_tax_checkout_not_implemented'));assert.equal(item.merchantRegistrationVerified,null);assert.equal(item.taxRegistrationCompleted,null);assert.equal(item.taxFilingCompleted,null);
},{version3:true}));
await test('complete recorded preparation remains provider-unverified and hard-locked despite environment flags; raw proof and personal/secret fields never serialize',async()=>fixture(async f=>{
  const inputs=Object.fromEntries(f.core.costFields.map(key=>[key,key==='vatRate'?null:0]));await f.sku('recorded',{mode:'stripe_automatic',preparation:prep(),costs:inputs});
  const report=await f.admin.adminView(adminUser,'tax_readiness'),item=report.items[0];assert.equal(item.preparationComplete,true);assert.equal(item.costInputsComplete,true);assert.equal(item.automaticTaxCheckoutImplemented,false);assert.equal(item.automaticTaxCollectionEnabled,false);assert.equal(item.actualQuoteProfitabilityVerified,null);assert.equal(item.merchantRegistrationVerified,null);assert.match(item.merchant_evidence,/Not verified/);assert.ok(item.preparationGapCodes.includes('automatic_tax_checkout_not_implemented'));
  const serialized=JSON.stringify(report);for(const forbidden of [sentinel,'taxreg_privateIdentity','private-operator@example.test','privateProof','serverSecret','evidenceReference','reviewedAt'])assert.equal(serialized.includes(forbidden),false,forbidden);
},{version3:true}));
await test('explicit zero costs remain known, while null fields and incomplete original allocations remain unknown',async()=>fixture(async f=>{
  const zero=Object.fromEntries(f.core.costFields.map(key=>[key,0]));await f.sku('known-zero',{costs:zero});await f.sku('unknown',{costs:{...zero,delivery:null,contentPerOrder:null,contentTotal:100,contentOrders:null}});
  const items=(await f.readiness.taxReadiness(adminUser)).items,known=items.find(item=>item.id==='known-zero'),unknown=items.find(item=>item.id==='unknown');assert.equal(known.costInputsComplete,true);assert.deepEqual(Array.from(known.missingCostFields),[]);assert.equal(known.actualQuoteProfitabilityVerified,null);assert.equal(unknown.costInputsComplete,false);assert.ok(unknown.missingCostFields.includes('delivery'));assert.ok(unknown.missingCostFields.includes('contentPerOrder'));assert.match(unknown.cost_status,/unknown/);
},{version3:true}));
await test('invalid preparation/cost records are isolated per edition and return safe diagnostics without original input',async()=>fixture(async f=>{
  await f.sku('invalid',{mode:'stripe_automatic',preparation:{version:sentinel},costs:{percentFees:sentinel}});await f.sku('manual');
  const report=await f.readiness.taxReadiness(adminUser),invalid=report.items.find(item=>item.id==='invalid');assert.equal(report.items.length,2);assert.equal(invalid.preparationComplete,false);assert.match(invalid.preparation_status,/invalid/);assert.match(invalid.cost_status,/invalid/);assert.equal(JSON.stringify(report).includes(sentinel),false);assert.equal(report.items.find(item=>item.id==='manual').preparationComplete,null);
},{version3:true}));
await test('unknown destination-tax election remains unknown even with two fixture sales totals of zero',async()=>fixture(async f=>{
  const preparation=prep(),year=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Stockholm',year:'numeric'}).format(new Date()));
  preparation.jurisdictions[0]={...preparation.jurisdictions[0],country:'DE',placeOfSupplyScheme:'small_seller',smallSellerCoverage:{establishedOnlyInSweden:true,destinationCountryTaxElectionMade:null,aggregationScope:'eu_cross_border_b2c_tbe_and_sweden_dispatched_distance_goods_all_channels_karuu_as_supplier',currency:'EUR',currentCalendarYear:year,currentYearExVatSalesMinor:0,previousCalendarYear:year-1,previousYearExVatSalesMinor:0,review:{reviewedAt:iso(),evidenceReference:sentinel}}};
  await f.sku('election-unknown',{mode:'stripe_automatic',preparation});const item=(await f.readiness.taxReadiness(adminUser)).items[0];assert.equal(item.preparationComplete,false);assert.ok(item.preparationGapCodes.includes('swedish_cross_border_small_seller_evidence'));assert.deepEqual(Array.from(item.unknownSmallSellerFacts),['Destination-country tax election']);assert.ok(item.needs_attention.some(text=>text.includes('Unknown: Destination-country tax election')));
},{version3:true}));
await test('helper and real cookie-authenticated export reject anonymous, customers and JKJ-only administrators without granting KARUU access',async()=>fixture(async f=>{
  await f.sku('private');let result=await f.exportGet();assert.equal(result.status,401);assert.equal((await result.json()).code,'authentication_required');
  const customer={...adminUser,id:crypto.randomUUID(),email:'customer@example.test',role:'customer'};await f.session(customer);result=await f.exportGet();assert.equal(result.status,403);assert.equal((await result.json()).code,'admin_required');
  const other={...adminUser,id:crypto.randomUUID(),email:'other-brand@example.test',brands:['jkj-plus']};await f.session(other);result=await f.exportGet();assert.equal(result.status,403);assert.equal((await result.json()).code,'brand_denied');
  const before=f.trace.length;await assert.rejects(f.readiness.taxReadiness(customer),code('brand_denied'));await assert.rejects(f.readiness.taxReadiness(other),code('brand_denied'));assert.equal(f.trace.length,before);
}));
await test('protected JSON download uses actual adminView, private cache headers and sanitized limited preparation scope without writes',async()=>fixture(async f=>{
  await f.sku('export',{mode:'stripe_automatic',preparation:prep()});await f.session();const before=(await f.db.query('SELECT count(*)::int AS count FROM commerce_audit')).rows[0].count;
  const response=await f.exportGet();assert.equal(response.status,200);assert.equal(response.headers.get('Cache-Control'),'private, no-store');assert.match(response.headers.get('Content-Disposition'),/karuu-tax_readiness\.json/);assert.equal(response.headers.get('X-Content-Type-Options'),'nosniff');
  const body=await response.json();assert.equal(body.view,'tax_readiness');assert.match(body.scope,/does not verify a registration/);assert.equal(body.taxFilingCompleted,null);assert.equal(body.items.length,1);assert.equal(JSON.stringify(body).includes(sentinel),false);assert.equal((await f.db.query('SELECT count(*)::int AS count FROM commerce_audit')).rows[0].count,before);
},{version3:true}));
await test('bounded JSON report declares truncation rather than claiming a complete historical filing export',async()=>fixture(async f=>{
  for(let n=0;n<201;n++)await f.sku('edition-'+String(n).padStart(3,'0'));
  const result=await f.readiness.taxReadiness(adminUser);assert.equal(result.items.length,200);assert.equal(result.limit,200);assert.equal(result.truncated,true);assert.equal(result.taxFilingCompleted,null);
}));
await test('unavailable database fails the report safely instead of inferring an unapplied migration or returning an apparently complete empty report',async()=>fixture(async f=>{
  await f.session();await f.db.exec('REVOKE SELECT ON commerce_skus FROM karuu_web');const response=await f.exportGet();assert.equal(response.status,503);const body=await response.json();assert.equal(body.code,'service_unavailable');assert.equal('items' in body,false);assert.equal(JSON.stringify(body).includes('karuu_commerce'),false);
}));
console.log('Read-only preparation review: actual server validators/auth/export with PGlite private schema and runtime RLS. No external tax API, DDL on a real database, registration, fee, payment, personal-data export or deployment occurred.');
