import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import Module from 'node:module';
import {randomUUID} from 'node:crypto';
import ts from 'typescript';
import Stripe from 'stripe';
import {PGlite} from '@electric-sql/pglite';
import {prepareCommerceSchemaMigration} from './lib/commerce-schema-migration.mjs';
import {prepareCommerceRuntimeRole} from './lib/commerce-runtime-role.mjs';

const root=path.resolve(process.env.KARUU_TEST_DIR??'work/payment-reconciliation-tests');fs.mkdirSync(root,{recursive:true});const directory=fs.mkdtempSync(path.join(root,'payment-')),db=new PGlite(directory);await db.waitReady;
const base=fs.readFileSync(new URL('../db/001-commerce.sql',import.meta.url),'utf8');await db.exec('CREATE ROLE anon; CREATE ROLE authenticated');await db.exec(prepareCommerceSchemaMigration(base).sql);await db.exec(prepareCommerceRuntimeRole(base).sql);
let failOutbox=false;
async function runtimeQuery(sql,values=[]){if(failOutbox&&sql.startsWith('INSERT INTO commerce_outbox')){failOutbox=false;throw Error('Isolated delivery outbox failure');}return db.query(sql,values);}
let queue=Promise.resolve();async function acquire(){const previous=queue;let release;queue=new Promise(resolve=>{release=resolve;});await previous;return release;}
async function enter(){await db.exec('SET SESSION AUTHORIZATION karuu_web; SET search_path TO karuu_commerce,pg_catalog,pg_temp');}
async function leave(){await db.exec('SET SESSION AUTHORIZATION postgres; RESET ROLE; SET search_path TO pg_catalog,pg_temp');}
class Pool{
 async query(sql,values=[]){const release=await acquire();try{await enter();return await db.query(sql,values);}finally{await leave();release();}}
 async connect(){const release=await acquire();await enter();return {query:runtimeQuery,release:()=>{void leave().then(release);}};}
}
const sessions=new Map(),intents=new Map(),charges=new Map(),refunds=new Map(),requestCache=new Map();let calls=0,createError=false,createStatus='pending',currentUser,listHook,createHook;
const real=new Stripe('sk_test_signature_fixture_only');
class Merchant{
 static createFetchHttpClient(){return Stripe.createFetchHttpClient();}static createSubtleCryptoProvider(){return Stripe.createSubtleCryptoProvider();}webhooks=real.webhooks;
 checkout={sessions:{retrieve:async id=>sessions.get(id),list:async({payment_intent})=>({data:[...sessions.values()].filter(s=>s.payment_intent===payment_intent),has_more:false})}};
 paymentIntents={retrieve:async id=>intents.get(id)};charges={retrieve:async id=>charges.get(id)};
 refunds={retrieve:async id=>refunds.get(id),list:async(params)=>{if(listHook){const hook=listHook;listHook=undefined;return hook(params);}const {payment_intent,starting_after,limit}=params,all=[...refunds.values()].filter(r=>r.payment_intent===payment_intent),start=starting_after?all.findIndex(r=>r.id===starting_after)+1:0;return {data:all.slice(start,start+limit),has_more:start+limit<all.length};},create:async(params,options)=>{
  const cached=requestCache.get(options.idempotencyKey);if(cached){assert.equal(JSON.stringify(params),cached.params,'A reused Stripe key must preserve every parameter');return cached.refund;}
  calls++;if(createError)throw new Error('Isolated provider response unavailable');const intent=intents.get(params.payment_intent),refund={id:'re_'+randomUUID(),payment_intent:intent.id,charge:intent.latest_charge.id,currency:intent.currency,status:createStatus,...params};refunds.set(refund.id,refund);requestCache.set(options.idempotencyKey,{params:JSON.stringify(params),refund});if(createHook){const hook=createHook;createHook=undefined;await hook(refund);}return refund;
 }};
}
const load=Module._load,resolve=Module._resolveFilename;Module._load=function(name,parent,isMain){if(name==='pg')return {Pool};if(name==='stripe')return Merchant;if(name==='./auth'&&parent?.filename.includes('lib'+path.sep+'server'))return {mailConfigured:async()=>false,requireUser:async()=>currentUser};if(name==='./private-media'&&parent?.filename.includes('lib'+path.sep+'server'))return {privateMediaConfigured:async()=>false};return load.call(this,name,parent,isMain);};
Module._resolveFilename=function(name,parent,...rest){if(name.startsWith('@/'))name=path.join(process.cwd(),'src',name.slice(2));return resolve.call(this,name,parent,...rest);};Module._extensions['.ts']=(module,filename)=>module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,filename);
Object.assign(process.env,{KARUU_RUNTIME:'node',KARUU_DATABASE_URL:'postgres://fixture-only',KARUU_DATABASE_SCHEMA:'karuu_commerce',KARUU_PAYMENT_MODE:'test',STRIPE_SECRET_KEY:'rk_test_fixture_only',STRIPE_WEBHOOK_SECRET:'whsec_signature_fixture_only',KARUU_PAYMENTS_ENABLED:'false'});globalThis.fetch=async()=>{throw new Error('No external network is allowed by this payment fixture');};
const require=Module.createRequire(import.meta.url),payments=require('../src/lib/server/payments.ts'),commerce=require('../src/lib/server/commerce.ts'),admin=require('../src/lib/server/admin.ts');
async function fixture({bound=true}={}){
 await queue;await leave();
 assert.equal((await db.query('SELECT current_user')).rows[0].current_user,'postgres');
 const userId=randomUUID(),id=randomUUID(),assetId='fixture-'+randomUUID(),sessionId='cs_'+randomUUID(),intentId='pi_'+randomUUID(),chargeId='ch_'+randomUUID();
 await db.query("INSERT INTO karuu_commerce.commerce_users(id,email,display_name,password_hash,verified_at) VALUES($1,$2,'Fixture','fixture-hash',now())",[userId,userId+'@example.test']);await db.query("INSERT INTO karuu_commerce.commerce_assets(id,work_slug,title,format,language,object_key) VALUES($1,$1,'Fixture','EPUB','en','fixture/private.epub')",[assetId]);
 const snapshot=[{skuId:'fixture-only',title:'Fixture',priceMinor:1000,components:[{assetId,title:'Fixture',format:'EPUB',language:'en',editionVersion:'1',contentSha256:'a'.repeat(64),amountMinor:1000,taxRate:0,stripeTaxRateId:'txr_fixture'}]}];
 await db.query("INSERT INTO karuu_commerce.commerce_orders(id,user_id,idempotency_key,request_hash,status,currency,total_minor,market,snapshot,consent_version,consent_at,stripe_session_id) VALUES($1,$2,$3,'fixture-hash','pending','SEK',1000,'SE',$4,'fixture-only',now(),$5)",[id,userId,randomUUID(),JSON.stringify(snapshot),bound?sessionId:null]);
 const session={id:sessionId,mode:'payment',livemode:false,payment_status:'paid',status:'complete',payment_intent:intentId,metadata:{orderId:id,userId},client_reference_id:id,amount_total:1000,currency:'sek',customer_details:{address:{country:'SE'}}},charge={id:chargeId,livemode:false,paid:true,captured:true,amount:1000,amount_captured:1000,amount_refunded:0,refunded:false,currency:'sek',payment_intent:intentId},intent={id:intentId,livemode:false,status:'succeeded',amount:1000,amount_received:1000,currency:'sek',metadata:{orderId:id},latest_charge:charge};sessions.set(sessionId,session);charges.set(chargeId,charge);intents.set(intentId,intent);
 return {id,userId,assetId,session,intent,charge,user:{id:userId,email:userId+'@example.test',role:'admin',brands:['karuu']},addRefund:(status,amount=1000)=>{const refund={id:'re_'+randomUUID(),payment_intent:intentId,charge:chargeId,currency:'sek',amount,status,metadata:{orderId:id}};refunds.set(refund.id,refund);return refund;}};
}
const event=(type,object,id='evt_'+randomUUID())=>({id,type,object:'event',livemode:false,data:{object}});
async function signed(type,object,id){const body=JSON.stringify(event(type,object,id)),signature=real.webhooks.generateTestHeaderString({payload:body,secret:process.env.STRIPE_WEBHOOK_SECRET});return payments.webhook(new Request('https://fixture.test/api/payments/stripe',{method:'POST',headers:{'stripe-signature':signature},body}));}
async function order(f){await queue;return (await db.query('SELECT status,refunded_minor,stripe_session_id,stripe_payment_intent FROM karuu_commerce.commerce_orders WHERE id=$1',[f.id])).rows[0];}
async function active(f){await queue;return (await db.query("SELECT asset_id FROM karuu_commerce.commerce_entitlements WHERE order_id=$1 AND status='active'",[f.id])).rows.length;}
try{
await test('sales suspension preserves signed captured-payment reconciliation, exact entitlement and duplicate-event idempotency under karuu_web',async()=>{
 const f=await fixture();assert.equal(commerce.paymentsConfigured(),false);assert.throws(()=>commerce.stripeClient(),{code:'payments_not_configured'});const id='evt_'+randomUUID();await signed('checkout.session.completed',f.session,id);assert.equal((await order(f)).status,'paid');assert.equal(await active(f),1);assert.equal((await signed('checkout.session.completed',f.session,id)).duplicate,true);await signed('checkout.session.async_payment_succeeded',f.session);assert.equal(await active(f),1);
});
await test('successful payment queues one delivery notice from the verified account even across distinct event replays',async()=>{
 const f=await fixture(),eventId='evt_'+randomUUID();await signed('checkout.session.completed',f.session,eventId);await signed('checkout.session.completed',f.session,eventId);await signed('checkout.session.async_payment_succeeded',f.session);
 await queue;const rows=(await db.query("SELECT kind,brand,recipient FROM karuu_commerce.commerce_outbox WHERE reference_id=$1",[f.id])).rows;
 assert.equal(rows.length,1);assert.equal(rows[0].kind,'order_delivery');assert.equal(rows[0].brand,'karuu');
 assert.equal(rows[0].recipient,(await db.query('SELECT email FROM karuu_commerce.commerce_users WHERE id=(SELECT user_id FROM karuu_commerce.commerce_orders WHERE id=$1)',[f.id])).rows[0].email);
});
await test('outbox failure rolls back the payment receipt, paid state and rights before a safe event retry',async()=>{
 const f=await fixture(),eventId='evt_'+randomUUID();failOutbox=true;
 await assert.rejects(signed('checkout.session.completed',f.session,eventId),/Isolated delivery outbox failure/);
 assert.equal((await order(f)).status,'pending');assert.equal(await active(f),0);
 assert.equal((await db.query('SELECT id FROM karuu_commerce.commerce_payment_events WHERE id=$1',[eventId])).rows.length,0);
 await signed('checkout.session.completed',f.session,eventId);assert.equal((await order(f)).status,'paid');assert.equal(await active(f),1);
 assert.equal((await db.query('SELECT id FROM karuu_commerce.commerce_outbox WHERE reference_id=$1',[f.id])).rows.length,1);
});
await test('refund-first and delayed paid events never grant refunded content, even when the original session binding was lost',async()=>{
 const f=await fixture({bound:false});f.addRefund('succeeded');await signed('charge.refunded',f.charge);assert.equal((await order(f)).status,'refunded');assert.equal((await order(f)).stripe_session_id,f.session.id);await signed('checkout.session.completed',f.session);assert.equal(await active(f),0);
 const delayed=await fixture();delayed.addRefund('succeeded');await signed('checkout.session.completed',delayed.session);assert.equal((await order(delayed)).status,'refunded');assert.equal(await active(delayed),0);
});
await test('pending/requires-action refunds withhold new grants; failed/canceled refunds enter auditable review without claiming success',async()=>{
 for(const status of ['pending','requires_action','failed','canceled']){const f=await fixture();const refund=f.addRefund(status);await signed(status==='failed'?'refund.failed':'refund.updated',refund);assert.equal((await order(f)).status,['pending','requires_action'].includes(status)?'refund_pending':'review');assert.equal((await order(f)).refunded_minor,0);assert.equal(await active(f),0);}
});
await test('partial then full cumulative succeeded refunds revoke only at full confirmation and cannot regrant on late payment',async()=>{
 const f=await fixture();await signed('checkout.session.completed',f.session);const partial=f.addRefund('succeeded',300);await signed('refund.updated',partial);assert.equal((await order(f)).status,'review');assert.equal((await order(f)).refunded_minor,300);assert.equal(await active(f),1);f.addRefund('succeeded',700);await signed('charge.refunded',f.charge);assert.equal((await order(f)).status,'refunded');assert.equal(await active(f),0);await signed('checkout.session.completed',f.session);assert.equal(await active(f),0);
});
await test('a stale merchant response cannot downgrade a newer full refund or consume the retryable event',async()=>{
 const f=await fixture();await signed('checkout.session.completed',f.session);let entered,release;const seen=new Promise(resolve=>{entered=resolve;}),resume=new Promise(resolve=>{release=resolve;});
 listHook=async()=>{entered();await resume;return {data:[],has_more:false};};const eventId='evt_'+randomUUID(),older=signed('checkout.session.completed',f.session,eventId);await seen;f.addRefund('succeeded');await signed('charge.refunded',f.charge);release();await assert.rejects(older,{code:'refund_receipt_stale'});assert.equal((await order(f)).status,'refunded');assert.equal((await order(f)).refunded_minor,1000);assert.equal(await active(f),0);assert.equal((await db.query('SELECT id FROM karuu_commerce.commerce_payment_events WHERE id=$1',[eventId])).rows.length,0);await signed('checkout.session.completed',f.session,eventId);assert.equal((await order(f)).status,'refunded');
});
await test('equal refund totals do not let an old failed snapshot overwrite a newer pending request',async()=>{
 const f=await fixture();await signed('checkout.session.completed',f.session);const failed=f.addRefund('failed');await signed('refund.failed',failed);let entered,release;const seen=new Promise(resolve=>{entered=resolve;}),resume=new Promise(resolve=>{release=resolve;}),snapshot=structuredClone([failed]);listHook=async()=>{entered();await resume;return {data:snapshot,has_more:false};};const older=signed('checkout.session.completed',f.session);await seen;const pending=f.addRefund('pending');await signed('refund.created',pending);release();await assert.rejects(older,{code:'refund_receipt_stale'});assert.equal((await order(f)).status,'refund_pending');assert.equal((await order(f)).refunded_minor,0);
});
await test('an old successful-full-refund snapshot cannot restore a refund reversed by a later bank failure',async()=>{
 const f=await fixture();await signed('checkout.session.completed',f.session);const refund=f.addRefund('succeeded');await signed('refund.updated',refund);let entered,release;const seen=new Promise(resolve=>{entered=resolve;}),resume=new Promise(resolve=>{release=resolve;}),snapshot=structuredClone([refund]);listHook=async()=>{entered();await resume;return {data:snapshot,has_more:false};};const older=signed('checkout.session.completed',f.session);await seen;refund.status='failed';await signed('refund.failed',refund);release();await assert.rejects(older,{code:'refund_receipt_stale'});assert.equal((await order(f)).status,'review');assert.equal((await order(f)).refunded_minor,0);assert.equal(await active(f),0);
});
await test('a later bank failure of a previously confirmed refund reduces its counter into review without restoring access',async()=>{
 const f=await fixture();await signed('checkout.session.completed',f.session);const refund=f.addRefund('succeeded');await signed('refund.updated',refund);refund.status='failed';await signed('refund.failed',refund);assert.equal((await order(f)).status,'review');assert.equal((await order(f)).refunded_minor,0);assert.equal(await active(f),0);await signed('checkout.session.completed',f.session);assert.equal(await active(f),0);
});
await test('complete paginated refund history is used and unknown refund status remains fail closed',async()=>{
 const f=await fixture();await signed('checkout.session.completed',f.session);for(let i=0;i<101;i++)f.addRefund('succeeded',1);await signed('charge.refunded',f.charge);assert.equal((await order(f)).refunded_minor,101);assert.equal(await active(f),1);const unknown=f.addRefund('unknown',1);await assert.rejects(signed('refund.updated',unknown),{code:'refund_state_unconfirmed'});assert.equal((await order(f)).refunded_minor,101);
});
await test('refund API ambiguity keeps an audited stable key; authoritative failure permits a new attempt and active rights remain intact',async()=>{
 const f=await fixture();await signed('checkout.session.completed',f.session);createError=true;await assert.rejects(payments.requestFullRefund(f.user,f.id,'Isolated authorized refund request'),{code:'refund_request_unconfirmed'});assert.equal((await order(f)).status,'review');assert.equal(await active(f),1);const first=(await db.query("SELECT detail FROM karuu_commerce.commerce_audit WHERE target=$1 AND action='request_refund'",[f.id])).rows[0].detail.requestKey;
 createError=false;createStatus='failed';await payments.requestFullRefund(f.user,f.id,'Isolated retry of original refund');assert.ok(requestCache.has(first));assert.equal((await order(f)).status,'review');createStatus='pending';await payments.requestFullRefund(f.user,f.id,'Isolated retry after confirmed failure');const attempts=(await db.query("SELECT detail FROM karuu_commerce.commerce_audit WHERE target=$1 AND action='request_refund' ORDER BY created_at",[f.id])).rows;assert.equal(attempts.length,2);assert.notEqual(attempts[0].detail.requestKey,attempts[1].detail.requestKey);const before=calls;await payments.requestFullRefund(f.user,f.id,'Isolated duplicate pending refund');assert.equal(calls,before);assert.equal(await active(f),1);
});
await test('administrator reconciliation updates an existing full/pending merchant refund before returning without creating another refund',async()=>{
 for(const status of ['succeeded','pending']){const f=await fixture();await signed('checkout.session.completed',f.session);f.addRefund(status);const before=calls,result=await payments.requestFullRefund(f.user,f.id,'Isolated existing merchant refund reconciliation');assert.equal(calls,before);assert.equal(result.status,status==='succeeded'?'refunded':'refund_pending');assert.equal((await order(f)).status,result.status);assert.equal((await order(f)).refunded_minor,status==='succeeded'?1000:0);assert.equal(await active(f),status==='succeeded'?0:1);}
});
await test('an administrator using a stale partial-refund snapshot stops before creating an excessive refund',async()=>{
 const f=await fixture();await signed('checkout.session.completed',f.session);const partial=f.addRefund('succeeded',300);await signed('refund.updated',partial);let entered,release;const seen=new Promise(resolve=>{entered=resolve;}),resume=new Promise(resolve=>{release=resolve;}),snapshot=structuredClone([partial]);listHook=async()=>{entered();await resume;return {data:snapshot,has_more:false};};const before=calls,older=payments.requestFullRefund(f.user,f.id,'Isolated stale administrative request');await seen;f.addRefund('succeeded',700);await signed('charge.refunded',f.charge);release();await assert.rejects(older,{code:'refund_receipt_stale'});assert.equal(calls,before);assert.equal((await order(f)).status,'refunded');
});
await test('a delayed failed API response cannot downgrade a newer pending refund attempt',async()=>{
 const f=await fixture();await signed('checkout.session.completed',f.session);let entered,release;const seen=new Promise(resolve=>{entered=resolve;}),resume=new Promise(resolve=>{release=resolve;});createStatus='failed';createHook=async()=>{entered();await resume;};const older=payments.requestFullRefund(f.user,f.id,'Isolated first delayed refund');await seen;createStatus='pending';await payments.requestFullRefund(f.user,f.id,'Isolated new request after authoritative merchant failure');release();await older;assert.equal((await order(f)).status,'refund_pending');assert.equal(await active(f),1);
});
await test('a lost API response cannot override a newer signed pending confirmation for the same request key',async()=>{
 const f=await fixture();await signed('checkout.session.completed',f.session);let entered,release,created;const seen=new Promise(resolve=>{entered=resolve;}),resume=new Promise(resolve=>{release=resolve;});createStatus='pending';createHook=async refund=>{created=refund;entered();await resume;throw new Error('Isolated response loss after merchant creation');};const older=payments.requestFullRefund(f.user,f.id,'Isolated lost response for one refund key');await seen;await signed('refund.created',created);release();await assert.rejects(older,{code:'refund_request_unconfirmed'});assert.equal((await order(f)).status,'refund_pending');assert.equal((await order(f)).refunded_minor,0);assert.equal(await active(f),1);
});
await test('old unknown refund requests stop before a new Stripe creation beyond the retained-idempotency window',async()=>{
 const f=await fixture();await signed('checkout.session.completed',f.session);await db.query("INSERT INTO karuu_commerce.commerce_audit(id,actor_id,action,target,reason,detail,created_at) VALUES($1,$2,'request_refund',$3,'Isolated old unknown request',$4,now()-interval '2 days')",[randomUUID(),f.userId,f.id,JSON.stringify({requestKey:'old-fixture-key',amountMinor:1000})]);const before=calls;await assert.rejects(payments.requestFullRefund(f.user,f.id,'Isolated retry of old response loss'),{code:'refund_recovery_required'});assert.equal(calls,before);
});
await test('sales-paused expired checkout closure checks immutable merchant identity and cannot falsely close another state',async()=>{
 const f=await fixture();f.session.status='expired';f.session.payment_status='unpaid';f.session.metadata.userId=randomUUID();await assert.rejects(admin.adminAction(f.user,{action:'close_expired_checkout',orderId:f.id,reason:'Isolated expired checkout inspection'}),{code:'checkout_session_mismatch'});assert.equal((await order(f)).status,'pending');f.session.metadata.userId=f.userId;const result=await admin.adminAction(f.user,{action:'close_expired_checkout',orderId:f.id,reason:'Isolated confirmed expired unpaid session'});assert.equal(result.status,'cancelled');assert.equal((await order(f)).status,'cancelled');await assert.rejects(admin.adminAction(f.user,{action:'close_expired_checkout',orderId:f.id,reason:'Isolated duplicate expiry inspection'}),{code:'checkout_not_pending'});assert.equal(await active(f),0);
});
await test('capture/amount/identity and signature mismatches fail without an entitlement or a consumed event receipt',async()=>{
 const f=await fixture({bound:false});f.charge.captured=false;await assert.rejects(signed('checkout.session.completed',f.session),{code:'payment_capture_unconfirmed'});f.charge.captured=true;f.session.amount_total=900;await assert.rejects(signed('checkout.session.completed',f.session),{code:'payment_amount_mismatch'});f.session.amount_total=1000;f.session.metadata.userId=randomUUID();await assert.rejects(signed('checkout.session.completed',f.session),{code:'order_identity_mismatch'});assert.equal(await active(f),0);await assert.rejects(payments.webhook(new Request('https://fixture.test/api/payments/stripe',{method:'POST',headers:{'stripe-signature':'t=1,v1=invalid'},body:'{}'})),{code:'invalid_signature'});
});
}finally{await queue;await db.close();const resolved=path.resolve(directory);assert.ok(resolved.startsWith(root+path.sep)&&path.basename(resolved).startsWith('payment-'));fs.rmSync(resolved,{recursive:true,force:true});}
console.log('Boundary: private schema + SESSION AUTHORIZATION karuu_web, PostgreSQL-WASM real SQL and real SDK signature verification; all merchant resources/network are isolated fixtures. No Stripe sandbox/live charge, refund, account message or private provider operation occurred.');
