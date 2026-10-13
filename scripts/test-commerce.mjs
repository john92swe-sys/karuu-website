import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import Module from 'node:module';
import crypto from 'node:crypto';
import ts from 'typescript';
import { PGlite } from '@electric-sql/pglite';
import RealStripe from 'stripe';

// This is an isolated PostgreSQL WASM database with real SQL constraints and disk persistence.
// The Stripe, private-object and email boundaries are fixtures: no external account is contacted.
const testRoot=path.resolve(process.env.KARUU_TEST_DIR??path.join(process.cwd(),'work','commerce-tests'));
fs.mkdirSync(testRoot,{recursive:true});
const directory=fs.mkdtempSync(path.join(testRoot,'isolated-'));
let database=new PGlite(directory);
await database.waitReady;
const migration=fs.readFileSync(new URL('../db/001-commerce.sql',import.meta.url),'utf8');
await database.exec(migration);await database.exec(migration);
let queue=Promise.resolve();
async function acquire(){const previous=queue;let release;queue=new Promise(resolve=>{release=resolve;});await previous;return release;}
class TestPool{
  async query(sql,values=[]){if(databaseUnavailable)throw new Error('IsolatedDatabaseOutage');const release=await acquire();try{return await database.query(sql,values);}finally{release();}}
  async connect(){const release=await acquire();return {query:(sql,values=[])=>database.query(sql,values),release};}
}
let workerClients=0,workerEnds=0,adapterLoads=0;
const workerTrace=[];
const fixtureWorkerEnv={HYPERDRIVE_COMMERCE:{connectionString:'postgres://workers-fixture-only'},KARUU_HYPERDRIVE_CACHING_DISABLED:'true'};
class TestWorkerClient{
  constructor(config){assert.equal(config.connectionString,fixtureWorkerEnv.HYPERDRIVE_COMMERCE.connectionString);this.id=++workerClients;}
  async connect(){this.release=await acquire();}
  async query(sql,values=[]){workerTrace.push({id:this.id,sql});return database.query(sql,values);}
  async end(){if(this.release){this.release();this.release=null;}workerEnds++;}
}
const cookieJar=new Map(),sessions=new Map(),charges=new Map(),taxRates=new Map(),refunds=new Map(),mail=[];
let createCalls=0,storageAvailable=true,lastRange;
let databaseUnavailable=false;
const realStripe=new RealStripe('sk_test_isolated_fixture_key');
class TestStripe{
  static createFetchHttpClient(){return RealStripe.createFetchHttpClient();}
  static createSubtleCryptoProvider(){return RealStripe.createSubtleCryptoProvider();}
  webhooks=realStripe.webhooks;
  taxRates={retrieve:async id=>{if(!taxRates.has(id))throw new Error('MissingTestTaxRate');return taxRates.get(id);}};
  checkout={sessions:{create:async(params,options)=>{
    if(sessions.has(options.idempotencyKey))return sessions.get(options.idempotencyKey);
    createCalls++;const id=`cs_test_${createCalls}`,amount=params.line_items.reduce((sum,item)=>sum+item.price_data.unit_amount,0);
    const session={id,livemode:false,metadata:params.metadata,client_reference_id:params.client_reference_id,amount_total:amount,currency:params.line_items[0].price_data.currency,payment_status:'unpaid',payment_intent:`pi_test_${createCalls}`,customer_details:{address:{country:'SE'}},url:`https://checkout.stripe.test/${id}`};
    sessions.set(id,session);sessions.set(options.idempotencyKey,session);return session;
  },retrieve:async id=>sessions.get(id)}};
  charges={retrieve:async id=>charges.get(id)};
  paymentIntents={retrieve:async id=>({id,metadata:{orderId:[...sessions.values()].find(s=>s.payment_intent===id)?.metadata.orderId}})};
  refunds={create:async(params,options)=>{if(refunds.has(options.idempotencyKey))return refunds.get(options.idempotencyKey);const value={id:'re_test_one',status:'pending',...params};refunds.set(options.idempotencyKey,value);return value;}};
}
const originalLoad=Module._load,originalResolve=Module._resolveFilename;
Module._load=function(name,parent,isMain){
  if(name==='pg')return {Pool:TestPool,Client:TestWorkerClient};
  if(name==='stripe')return TestStripe;
  if(name==='@opennextjs/cloudflare'){adapterLoads++;return {getCloudflareContext:()=>({env:fixtureWorkerEnv})};}
  if(name==='next/headers')return {cookies:()=>({get:key=>cookieJar.has(key)?{value:cookieJar.get(key)}:undefined})};
  return originalLoad.call(this,name,parent,isMain);
};
Module._resolveFilename=function(name,parent,...rest){
  if(name.startsWith('@/'))name=path.join(process.cwd(),'src',name.slice(2));
  return originalResolve.call(this,name,parent,...rest);
};
Module._extensions['.ts']=function(module,filename){const code=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;module._compile(code,filename);};
const require=Module.createRequire(import.meta.url);
const core=require('../src/lib/server/core.ts'),auth=require('../src/lib/server/auth.ts'),commerce=require('../src/lib/server/commerce.ts'),admin=require('../src/lib/server/admin.ts'),inquiries=require('../src/lib/server/inquiries.ts'),payments=require('../src/lib/server/payments.ts'),delivery=require('../src/lib/server/delivery.ts'),http=require('../src/lib/server/http.ts');
Object.assign(process.env,{KARUU_RUNTIME:'node',KARUU_DATABASE_URL:'postgres://isolated-fixture-only',KARUU_SITE_ORIGIN:'https://karuu.test',KARUU_MAIL_ENDPOINT:'https://mail.karuu.test/send',KARUU_MAIL_TOKEN:'isolated-fixture',KARUU_PRIVATE_MEDIA_ORIGIN:'https://private.karuu.test',KARUU_PRIVATE_MEDIA_TOKEN:'isolated-fixture',KARUU_DELIVERY_SIGNING_SECRET:'isolated-fixture-only-signing-secret-123456',STRIPE_SECRET_KEY:'sk_test_isolated_fixture_key',STRIPE_WEBHOOK_SECRET:'whsec_isolated_fixture_only',KARUU_PAYMENTS_ENABLED:'true',KARUU_PAYMENT_MODE:'test',KARUU_TERMS_VERSION:'isolated-test-version'});
globalThis.fetch=async(url,options={})=>{
  const parsed=new URL(url);
  if(parsed.hostname==='mail.karuu.test'){mail.push(JSON.parse(options.body));return new Response('{}',{status:202});}
  if(parsed.hostname==='private.karuu.test'){
    assert.equal(options.headers.Authorization,'Bearer isolated-fixture');lastRange=options.headers.Range;
    if(!storageAvailable)return new Response('unavailable',{status:503});
    return new Response('isolated authorized content',{status:options.headers.Range?206:200,headers:{'Content-Type':'audio/mpeg','Accept-Ranges':'bytes',...(options.headers.Range?{'Content-Range':'bytes 0-25/26'}:{})}});
  }
  throw new Error(`Unexpected external request to ${parsed.hostname}`);
};
const request=(route,input,headers={})=>new Request(`https://karuu.test${route}`,{method:'POST',headers:{Origin:'https://karuu.test','Content-Type':'application/json',...headers},body:JSON.stringify(input)});
const fixtureCosts=Object.fromEntries(core.costFields.map(key=>[key,key==='vatRate'?0.06:key==='targetSurplus'?100:0]));
const reason='Isolated test configuration, not a commercial price or rights claim.';
let user,other,operator;
await test('schema is repeatable and data survives closing/reopening the disk database',async()=>{
  assert.equal((await database.query('SELECT version FROM commerce_schema')).rows.length,1);
  await auth.register({email:'buyer@example.test',password:'test-password-one',displayName:'Test buyer'});
  const token=mail[0].text.match(/token=([a-f0-9]+)/)[1];
  await auth.verify(token);
  await assert.rejects(auth.verify(token),{code:'invalid_token'});
  await database.close();database=new PGlite(directory);await database.waitReady;
  const rows=(await database.query('SELECT id,email,role,brands FROM commerce_users')).rows;assert.equal(rows.length,1);user=rows[0];
  await auth.register({email:'other@example.test',password:'test-password-two'});await auth.verify(mail.at(-1).text.match(/token=([a-f0-9]+)/)[1]);
  other=(await database.query('SELECT id,email,role,brands FROM commerce_users WHERE email=$1',['other@example.test'])).rows[0];
  await database.query("UPDATE commerce_users SET role='admin' WHERE id=$1",[user.id]);operator={...user,role:'admin'};
});
await test('password login, verification, reset expiry/replay and session revocation are enforced',async()=>{
  await assert.rejects(auth.login({email:user.email,password:'incorrect'}),{code:'invalid_credentials'});
  const response=await auth.login({email:user.email,password:'test-password-one'});
  const token=response.headers.get('set-cookie').match(/karuu_session=([a-f0-9]+)/)[1];cookieJar.set('karuu_session',token);
  assert.equal((await auth.currentUser()).id,user.id);
  await auth.requestPasswordReset({email:user.email});const resetToken=mail.at(-1).text.match(/reset=([a-f0-9]+)/)[1];
  await auth.confirmPasswordReset({token:resetToken,password:'new-test-password'});
  assert.equal(await auth.currentUser(),null);
  await assert.rejects(auth.confirmPasswordReset({token:resetToken,password:'another-test-password'}),{code:'reset_expired'});
  await auth.requestPasswordReset({email:user.email});const expired=mail.at(-1).text.match(/reset=([a-f0-9]+)/)[1];
  await database.query("UPDATE commerce_password_resets SET expires_at=now()-interval '1 minute' WHERE user_id=$1",[user.id]);
  await assert.rejects(auth.confirmPasswordReset({token:expired,password:'expired-test-password'}),{code:'reset_expired'});
  await assert.rejects(auth.login({email:user.email,password:'test-password-one'}),{code:'invalid_credentials'});
  const signedIn=await auth.login({email:user.email,password:'new-test-password'});cookieJar.set('karuu_session',signedIn.headers.get('set-cookie').match(/karuu_session=([a-f0-9]+)/)[1]);
});
await test('inquiries persist exactly once, conflict on altered replay and isolate brands',async()=>{
  const data={brand:'karuu',contactName:'Test buyer',businessEmail:'inquiry@example.test',message:'This is an isolated acceptance inquiry.',privacyConsent:true};
  const key=crypto.randomUUID(),results=await Promise.all([inquiries.receiveInquiry(data,key),inquiries.receiveInquiry(data,key)]);
  assert.equal(results[0].id,results[1].id);assert.equal((await database.query('SELECT id FROM commerce_inquiries')).rows.length,1);
  assert.equal((await database.query('SELECT id FROM commerce_outbox')).rows.length,1);
  await assert.rejects(inquiries.receiveInquiry({...data,message:'A different isolated inquiry message'},key),{code:'idempotency_conflict'});
  await assert.rejects(inquiries.receiveInquiry({...data,brand:'jkj-plus'},crypto.randomUUID()),{code:'brand_routing_not_configured'});
  process.env.JKJ_INQUIRY_EMAIL='jkj-test-owner@example.test';
  const jkj=await inquiries.receiveInquiry({...data,businessEmail:'brand-test@example.test',brand:'jkj-plus'},crypto.randomUUID());
  const jkjOperator={...operator,brands:['jkj-plus']};assert.equal((await admin.adminView(jkjOperator,'inquiries')).items.length,1);
  await assert.rejects(admin.adminView(jkjOperator,'orders'),{code:'brand_denied'});
  await assert.rejects(admin.adminAction(jkjOperator,{action:'update_inquiry',id:results[0].id,status:'closed',reason}),{code:'inquiry_not_found'});
  await admin.adminAction(jkjOperator,{action:'update_inquiry',id:jkj.id,status:'in_progress',reason});
});
await test('unknown cost inputs do not become full profit, minimum price or reward budget',async()=>{
  const incomplete=core.normalizeCosts({vatRate:0.06,fixedPayment:0});const result=core.costResult(1000,incomplete);
  assert.equal(result.complete,false);assert.equal(result.minimumPriceMinor,null);assert.equal(result.rewardHeadroomMinor,null);assert.ok(result.missing.includes('royalty'));
  const full=core.costResult(1000,core.normalizeCosts(fixtureCosts));assert.equal(full.complete,true);assert.ok(full.minimumPriceMinor>0);
  assert.equal(core.allocate(1001,[5000,5000]).reduce((a,b)=>a+b,0),1001);
});
await test('administrator creates exact assets/bundle and every mutation has an audit reason',async()=>{
  for(const [id,format]of [['test-epub','epub'],['test-audio','mp3']])await admin.adminAction(operator,{action:'save_asset',reason,asset:{id,workSlug:'isolated-test-story',title:'Isolated test story',format,language:'en',objectKey:`isolated/${id}.${format}`,contentSha256:crypto.createHash('sha256').update(`isolated-${id}`).digest('hex'),rightsVerified:true,deliveryVerified:true}});
  taxRates.set('txr_testse',{active:true,inclusive:true,percentage:6,country:'SE'});
  for(const [id,price,components]of [['test-ebook',500,[{assetId:'test-epub',allocationBps:10000}]],['test-bundle',1000,[{assetId:'test-epub',allocationBps:5000},{assetId:'test-audio',allocationBps:5000}]]]){
    await admin.adminAction(operator,{action:'save_sku',reason,sku:{id,slug:'isolated-test-story',title:'Isolated test story',kind:components.length===1?'ebook':'bundle',status:'active',currency:'SEK',priceMinor:price,rightsVerified:true,markets:['SE'],components,taxByMarket:{SE:Object.fromEntries(components.map(c=>[c.assetId,{rate:0.06,stripeTaxRateId:'txr_testse'}]))},upgradePrices:components.length===2?{'test-epub':500}:{}}});
    await admin.adminAction(operator,{action:'save_cost',reason,skuId:id,inputs:fixtureCosts});
  }
  await assert.rejects(admin.adminAction(operator,{action:'save_cost',skuId:'test-bundle',inputs:fixtureCosts,reason:'short'}),{code:'reason_required'});
  assert.ok((await admin.adminView(operator,'audit')).items.length>=7);
  const publicCatalog=JSON.stringify(await commerce.catalog());assert.ok(!publicCatalog.includes('object_key'));assert.ok(!publicCatalog.includes('royalty'));
});
let bundleOrder,bundleSession;
await test('checkout snapshots prices/components, blocks duplicate content and resumes an idempotent payment',async()=>{
  await assert.rejects(commerce.checkout(user,{skuIds:['unknown-sku'],market:'SE',immediateDeliveryConsent:true},crypto.randomUUID()),{code:'sku_unavailable'});
  await assert.rejects(commerce.checkout(user,{skuIds:['test-ebook','test-bundle'],market:'SE',immediateDeliveryConsent:true},crypto.randomUUID()),{code:'duplicate_content'});
  const key=crypto.randomUUID();bundleOrder=await commerce.checkout(user,{skuIds:['test-bundle'],market:'SE',immediateDeliveryConsent:true},key);
  const duplicate=await commerce.checkout(user,{skuIds:['test-bundle'],market:'SE',immediateDeliveryConsent:true},key);
  assert.equal(bundleOrder.orderId,duplicate.orderId);assert.equal(createCalls,1);
  await assert.rejects(commerce.checkout(user,{skuIds:['test-bundle'],market:'SE',immediateDeliveryConsent:true},crypto.randomUUID()),{code:'checkout_pending'});
  bundleSession=[...sessions.values()][0];
  await admin.adminAction(operator,{action:'save_cost',reason,skuId:'test-bundle',inputs:{...fixtureCosts,royalty:null}});
  await assert.rejects(commerce.checkout(other,{skuIds:['test-bundle'],market:'SE',immediateDeliveryConsent:true},crypto.randomUUID()),{code:'pricing_not_approved'});
  await admin.adminAction(operator,{action:'save_cost',reason,skuId:'test-bundle',inputs:fixtureCosts});
});
function event(type,id,object){return {id,object:'event',type,livemode:false,data:{object},created:Math.floor(Date.now()/1000)};}
async function signedWebhook(value){const payload=JSON.stringify(value),signature=realStripe.webhooks.generateTestHeaderString({payload,secret:process.env.STRIPE_WEBHOOK_SECRET});return payments.webhook(new Request('https://karuu.test/api/payments/stripe',{method:'POST',headers:{'stripe-signature':signature},body:payload}));}
await test('signed payment notification, delayed methods, replays and precise bundle entitlements',async()=>{
  await signedWebhook(event('checkout.session.completed','evt_unpaid',bundleSession));assert.equal((await commerce.library(user)).items.length,0);
  bundleSession.payment_status='paid';
  const paid=event('checkout.session.async_payment_succeeded','evt_paid',bundleSession);await signedWebhook(paid);
  const repeated=await signedWebhook(paid);assert.equal(repeated.duplicate,true);
  await signedWebhook(event('checkout.session.completed','evt_paid_again',bundleSession));
  const library=await commerce.library(user);assert.deepEqual(library.items.map(i=>i.assetId).sort(),['test-audio','test-epub']);
  assert.equal((await commerce.orders(user)).orders[0].status,'paid');assert.equal((await commerce.library(other)).items.length,0);
  await assert.rejects(payments.webhook(new Request('https://karuu.test/api/payments/stripe',{method:'POST',headers:{'stripe-signature':'t=1,v1=invalid'},body:JSON.stringify(paid)})),{code:'invalid_signature'});
});
await test('private access is short lived, account scoped and recovers after the file service fails',async()=>{
  await assert.rejects(delivery.grantAccess(other,'test-audio'),{code:'content_not_found'});
  const grant=await delivery.grantAccess(user,'test-audio');assert.ok(Date.parse(grant.expiresAt)-Date.now()<=300000);
  storageAvailable=false;await assert.rejects(delivery.deliver(new Request(`https://karuu.test${grant.url}`),'test-audio'),{code:'file_temporarily_unavailable'});
  assert.equal((await commerce.orders(user)).orders[0].status,'paid');assert.equal(createCalls,1);
  storageAvailable=true;const stream=await delivery.deliver(new Request(`https://karuu.test${grant.url}`,{headers:{Range:'bytes=0-25'}}),'test-audio');assert.equal(stream.status,206);assert.equal(lastRange,'bytes=0-25');
  const otherLogin=await auth.login({email:other.email,password:'test-password-two'});const previous=cookieJar.get('karuu_session');cookieJar.set('karuu_session',otherLogin.headers.get('set-cookie').match(/karuu_session=([a-f0-9]+)/)[1]);
  await assert.rejects(delivery.deliver(new Request(`https://karuu.test${grant.url}`),'test-audio'),{code:'expired_grant'});cookieJar.set('karuu_session',previous);
});
await test('refunds revoke only the matching order and a late payment replay cannot restore it',async()=>{
  const result=await admin.adminAction(operator,{action:'request_refund',orderId:bundleOrder.orderId,reason});assert.equal(result.status,'refund_pending');assert.equal((await commerce.library(user)).items.filter(i=>i.status==='active').length,2);
  const charge={id:'ch_test_one',payment_intent:bundleSession.payment_intent,currency:'sek',amount:1000,amount_refunded:1000,refunded:true,metadata:{orderId:bundleOrder.orderId}};charges.set(charge.id,charge);
  await signedWebhook(event('charge.refunded','evt_refund',charge));assert.equal((await commerce.orders(user)).orders[0].status,'refunded');assert.equal((await commerce.library(user)).items.filter(i=>i.status==='active').length,0);
  await signedWebhook(event('checkout.session.completed','evt_late_paid',bundleSession));assert.equal((await commerce.library(user)).items.filter(i=>i.status==='active').length,0);
  await assert.rejects(delivery.grantAccess(user,'test-audio'),{code:'content_not_found'});
});
await test('existing ebook owners upgrade to the exact remaining component without repurchasing it',async()=>{
  const single=await commerce.checkout(other,{skuIds:['test-ebook'],market:'SE',immediateDeliveryConsent:true},crypto.randomUUID()),session=[...sessions.values()].find(s=>s.metadata.orderId===single.orderId);session.payment_status='paid';
  await signedWebhook(event('checkout.session.completed','evt_single',session));
  const upgrade=await commerce.checkout(other,{skuIds:['test-bundle'],market:'SE',immediateDeliveryConsent:true},crypto.randomUUID()),upgradeSession=[...sessions.values()].find(s=>s.metadata.orderId===upgrade.orderId);assert.equal(upgradeSession.amount_total,500);upgradeSession.payment_status='paid';
  await signedWebhook(event('checkout.session.completed','evt_upgrade',upgradeSession));
  assert.deepEqual((await commerce.library(other)).items.map(i=>i.assetId).sort(),['test-audio','test-epub']);
});
await test('China, unknown eligibility, caller assertions and unconfigured services fail closed',async()=>{
  assert.equal(core.kruEligibility({market:'CN',verified:true,approved:true}).allowed,false);assert.equal(core.kruEligibility({}).allowed,false);assert.equal(core.kruEligibility({market:'SE',verified:true,approved:true}).allowed,false);
  assert.throws(()=>http.sameOrigin(new Request('https://karuu.test/api/admin',{headers:{Origin:'https://attacker.test'}})),{code:'origin_denied'});
  const adminRoute=require('../src/app/api/admin/route.ts');cookieJar.clear();assert.equal((await adminRoute.GET(new Request('https://karuu.test/api/admin?view=orders'))).status,401);
  const original=process.env.KARUU_DATABASE_URL;delete process.env.KARUU_DATABASE_URL;
  await assert.rejects(inquiries.receiveInquiry({brand:'karuu',contactName:'Test',businessEmail:'missing-db@example.test',message:'Missing database test message',privacyConsent:true},crypto.randomUUID()),{code:'database_not_configured'});
  process.env.KARUU_DATABASE_URL=original;assert.equal((await commerce.status()).kru.enabled,false);
});
await test('published creation CMS changes real catalogue; drafts/archives and generic links stay private',async()=>{
  const works=require('../src/lib/server/works.ts');
  const creation={id:'isolated-cms-work',slug:'isolated-cms-work',title:'Isolated CMS title',author:'Test author',publisher:null,language:'en',summary:'Isolated test content',cover:null,coverAlt:'Test',categories:['ebooks'],featured:false,formats:[{label:'EPUB',status:'pending',note:'Isolated test only'}],links:[],evidence:['Isolated bibliographic test evidence']};
  await admin.adminAction(operator,{action:'save_creation',reason,publicationStatus:'draft',creation});assert.equal(await works.getPublicCreation(creation.slug),undefined);
  await admin.adminAction(operator,{action:'save_creation',reason,publicationStatus:'published',creation});assert.equal((await works.getPublicCreation(creation.slug)).title,creation.title);
  await assert.rejects(admin.adminAction(operator,{action:'save_creation',reason,publicationStatus:'published',creation:{...creation,links:[{label:'Store',format:'EPUB',url:'https://www.amazon.com/',sourceUrl:'https://www.amazon.com/',verifiedAt:'2026-01-01'}]}}),{code:'invalid_platform_url'});
  await admin.adminAction(operator,{action:'save_creation',reason,publicationStatus:'archived',creation});assert.equal(await works.getPublicCreation(creation.slug),undefined);
});
await test('an ordered edition cannot silently change its language, format or content bytes',async()=>{
  const original=(await database.query("SELECT * FROM commerce_assets WHERE id='test-epub'")).rows[0];
  const asset={id:original.id,workSlug:original.work_slug,title:original.title,format:original.format,language:'zh',objectKey:original.object_key,contentSha256:original.content_sha256,rightsVerified:true,deliveryVerified:true};
  await assert.rejects(admin.adminAction(operator,{action:'save_asset',reason,asset}),{code:'edition_immutable'});
  await assert.rejects(admin.adminAction(operator,{action:'save_asset',reason,asset:{...asset,language:'en',contentSha256:'a'.repeat(64)}}),{code:'edition_immutable'});
});
await test('aging pending and paid market-review orders prevent another debit until merchant-confirmed closure',async()=>{
  const pending=await commerce.checkout(user,{skuIds:['test-bundle'],market:'SE',immediateDeliveryConsent:true},crypto.randomUUID()),session=[...sessions.values()].find(s=>s.metadata.orderId===pending.orderId);
  await database.query("UPDATE commerce_orders SET created_at=now()-interval '3 days' WHERE id=$1",[pending.orderId]);
  await assert.rejects(commerce.checkout(user,{skuIds:['test-bundle'],market:'SE',immediateDeliveryConsent:true},crypto.randomUUID()),{code:'checkout_pending'});
  await assert.rejects(admin.adminAction(operator,{action:'close_expired_checkout',orderId:pending.orderId,reason}),{code:'checkout_not_expired'});
  session.status='expired';await signedWebhook(event('checkout.session.expired','evt_cancelled',session));assert.equal((await commerce.orders(user)).orders.find(o=>o.id===pending.orderId).status,'cancelled');
  const review=await commerce.checkout(user,{skuIds:['test-bundle'],market:'SE',immediateDeliveryConsent:true},crypto.randomUUID()),reviewSession=[...sessions.values()].find(s=>s.metadata.orderId===review.orderId);reviewSession.customer_details.address.country='NO';reviewSession.payment_status='paid';
  await signedWebhook(event('checkout.session.completed','evt_market_review',reviewSession));
  assert.equal((await commerce.orders(user)).orders.find(o=>o.id===review.orderId).status,'review');
  await assert.rejects(commerce.checkout(user,{skuIds:['test-bundle'],market:'SE',immediateDeliveryConsent:true},crypto.randomUUID()),{code:'checkout_pending'});
});
await test('cost allocation and signed reward deficit survive rounding without concealing losses',async()=>{
  assert.throws(()=>core.normalizeCosts({...fixtureCosts,contentTotal:1000,contentOrders:0}),{code:'invalid_allocation_orders'});
  assert.equal(core.normalizeCosts({...fixtureCosts,contentTotal:1000,contentOrders:3}).contentPerOrder,334);
  assert.equal(core.normalizeCosts({...fixtureCosts,contentTotal:null,contentOrders:3}).contentPerOrder,null);
  const inputs={...fixtureCosts,vatRate:0.06,percentFees:0.03,targetSurplus:100};
  const calculation=core.costResult(110,inputs);assert.equal(calculation.targetMet,false);assert.equal(calculation.rewardHeadroomRawMinor,-1);assert.equal(calculation.rewardHeadroomMinor,0);assert.equal(calculation.minimumPriceMinor,111);
});
await test('configured CMS outage fails closed and cannot republish static archived works or private evidence',async()=>{
  const works=require('../src/lib/server/works.ts'),data=require('../src/data/creations.ts').creations.find(c=>c.id==='key');
  await admin.adminAction(operator,{action:'save_creation',reason,publicationStatus:'archived',creation:{...data,links:[],evidence:['PRIVATE-INTERNAL-PATH-TEST']}});
  assert.equal(await works.getPublicCreation(data.slug),undefined);
  assert.ok(!JSON.stringify(await works.listPublicCreations()).includes('PRIVATE-INTERNAL-PATH-TEST'));
  databaseUnavailable=true;assert.deepEqual(await works.listPublicCreations(),[]);assert.equal((await commerce.status()).publicCatalogAvailable,false);databaseUnavailable=false;
});
await test('internal game ledger separates paid/gift lots, preserves original funds and never combines games',async()=>{
  const ledger=require('../src/lib/server/game-ledger.ts'),rules={gameId:'isolated-game',version:'test-rules-1',approved:true,spendOrder:'paid-first'};
  await database.query(`INSERT INTO commerce_game_funding(id,user_id,game_id,original_funding_id,units,rules_version,status) VALUES('fixture-funding-one',$1,'isolated-game','fixture-original-one',100,'test-rules-1','confirmed')`,[user.id]);
  await database.query(`INSERT INTO commerce_game_campaigns(id,game_id,active,rules_version,reward_units,budget_units) VALUES('fixture-campaign','isolated-game',true,'test-rules-1',10,10)`);
  const key=crypto.randomUUID(),credited=await ledger.creditConfirmedGameFunding(user.id,'fixture-funding-one',key,rules);assert.deepEqual(await ledger.creditConfirmedGameFunding(user.id,'fixture-funding-one',key,rules),credited);
  await assert.rejects(ledger.creditConfirmedGameFunding(user.id,'fixture-funding-one',crypto.randomUUID(),rules),{code:'funding_already_credited'});
  await ledger.grantGameFundingReward(user.id,'fixture-funding-one','fixture-campaign',crypto.randomUUID(),rules);assert.deepEqual(await ledger.gamePointBalance(user.id,'isolated-game'),{gameId:'isolated-game',paid:'100',gift:'10'});
  const spendKey=crypto.randomUUID(),spent=await ledger.spendGamePoints(user.id,'105',spendKey,rules);assert.equal(spent.spentPaid,'100');assert.equal(spent.spentGift,'5');assert.deepEqual(await ledger.spendGamePoints(user.id,'105',spendKey,rules),spent);
  assert.deepEqual(await ledger.gamePointBalance(user.id,'another-game'),{gameId:'another-game',paid:'0',gift:'0'});
  await assert.rejects(ledger.grantGameFundingReward(user.id,'fixture-funding-one','fixture-campaign',crypto.randomUUID(),rules),{code:'reward_already_claimed'});
  await assert.rejects(ledger.spendGamePoints(user.id,'1',crypto.randomUUID(),{...rules,gameId:'another-game'}),{code:'insufficient_game_points'});
  const simultaneous=await Promise.allSettled([ledger.spendGamePoints(user.id,'4',crypto.randomUUID(),rules),ledger.spendGamePoints(user.id,'4',crypto.randomUUID(),rules)]);assert.equal(simultaneous.filter(r=>r.status==='fulfilled').length,1);assert.equal((await ledger.gamePointBalance(user.id,'isolated-game')).gift,'1');
  await database.query(`INSERT INTO commerce_game_funding(id,user_id,game_id,original_funding_id,units,rules_version,status) VALUES('fixture-funding-two',$1,'isolated-game','fixture-original-two',100,'test-rules-1','confirmed')`,[other.id]);
  await assert.rejects(ledger.grantGameFundingReward(other.id,'fixture-funding-two','fixture-campaign',crypto.randomUUID(),rules),{code:'point_budget_exhausted'});
  await assert.rejects(ledger.creditConfirmedGameFunding(user.id,'fixture-funding-one',crypto.randomUUID(),{...rules,approved:false}),{code:'game_rules_unconfirmed'});
});
await test('Workers clients are operation scoped, transactions stay on one connection and unconfirmed caching/runtime cannot fall back to Node',async()=>{
  assert.equal(adapterLoads,0,'The ordinary Node test path must not import/init the Cloudflare adapter');
  const db=require('../src/lib/server/db.ts'),originalNavigator=Object.getOwnPropertyDescriptor(globalThis,'navigator');
  const originalRuntime=process.env.KARUU_RUNTIME;process.env.KARUU_RUNTIME='cloudflare';
  await assert.rejects(db.query('SELECT 1'),{code:'workers_runtime_unconfirmed'});
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{userAgent:'Cloudflare-Workers'}});
  try{
    assert.equal(await db.databaseConfigured(),true);
    fixtureWorkerEnv.KARUU_HYPERDRIVE_CACHING_DISABLED='false';await assert.rejects(db.query('SELECT 1'),{code:'database_freshness_unconfirmed'});assert.equal(workerClients,0);
    fixtureWorkerEnv.KARUU_HYPERDRIVE_CACHING_DISABLED='true';
    await db.query('SELECT 1 AS isolated');await db.query('SELECT 2 AS isolated');assert.equal(workerClients,2);assert.equal(workerEnds,2);
    await db.transaction(async client=>{await client.query('SELECT 3');await client.query('SELECT 4');});
    const tx=workerTrace.filter(entry=>entry.id===3);assert.deepEqual(tx.map(entry=>entry.sql),['BEGIN','SELECT 3','SELECT 4','COMMIT']);
    await assert.rejects(db.transaction(async client=>{await client.query('SELECT 5');throw new Error('Isolated rollback failure');}),/Isolated rollback failure/);
    assert.deepEqual(workerTrace.filter(entry=>entry.id===4).map(entry=>entry.sql),['BEGIN','SELECT 5','ROLLBACK']);assert.equal(workerClients,workerEnds);
  }finally{process.env.KARUU_RUNTIME=originalRuntime;if(originalNavigator)Object.defineProperty(globalThis,'navigator',originalNavigator);else Reflect.deleteProperty(globalThis,'navigator');}
});
await database.close();
if(!path.resolve(directory).startsWith(testRoot+path.sep)||!path.basename(directory).startsWith('isolated-'))throw new Error('Unsafe test cleanup target');
fs.rmSync(directory,{recursive:true,force:true});
console.log('Verification boundary: PostgreSQL WASM + mocked Stripe/email/private storage. No live or Stripe-sandbox transaction occurred. The isolated test database was removed.');
