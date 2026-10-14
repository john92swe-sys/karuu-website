import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import util from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import Stripe from 'stripe';
import {PGlite} from '@electric-sql/pglite';
import {prepareCommerceSchemaMigration} from './lib/commerce-schema-migration.mjs';
import {prepareCommerceRuntimeRole} from './lib/commerce-runtime-role.mjs';

// One small, sequential, in-memory PostgreSQL-WASM database. Actual checkout,
// reconciliation, auth, delivery, private-media and notification modules execute.
// Only SQL transport, framework cookies, Stripe resources, R2 objects and mail
// acceptance are fixtures. No real account/environment/secret or network is read.
const root=path.resolve(import.meta.dirname,'..'),db=new PGlite();await db.waitReady;
const base=fs.readFileSync(path.join(root,'db/001-commerce.sql'),'utf8');
await db.exec('CREATE ROLE anon; CREATE ROLE authenticated');
await db.exec(prepareCommerceSchemaMigration(base).sql);await db.exec(prepareCommerceRuntimeRole(base).sql);
const searchPath='SET search_path TO karuu_commerce,pg_catalog,pg_temp';await db.exec(searchPath);
let queue=Promise.resolve();
async function acquire(){const previous=queue;let release;queue=new Promise(resolve=>{release=resolve;});await previous;return release;}
async function enter(){await db.exec('SET SESSION AUTHORIZATION karuu_web; '+searchPath);}
async function leave(){await db.exec('SET SESSION AUTHORIZATION postgres; RESET ROLE; '+searchPath);}
const runtimeRoles=new Set();
async function runtimeQuery(sql,values=[]){runtimeRoles.add((await db.query('SELECT current_user')).rows[0].current_user);return db.query(sql,values);}
class Pool{
  constructor(config){assert.equal(config.connectionString,'postgres://isolated-fulfillment-fixture');}
  async query(sql,values=[]){const release=await acquire();try{await enter();return await runtimeQuery(sql,values);}finally{await leave();release();}}
  async connect(){const release=await acquire();await enter();return {query:runtimeQuery,release(){void leave().then(release);}};}
}
async function owner(sql,values=[]){await queue;await leave();return db.query(sql,values);}

const environment={
  KARUU_RUNTIME:'node',KARUU_DATABASE_SCHEMA:'karuu_commerce',KARUU_DATABASE_URL:'postgres://isolated-fulfillment-fixture',
  KARUU_PAYMENT_MODE:'test',STRIPE_SECRET_KEY:'rk_test_isolated_fulfillment_only',STRIPE_WEBHOOK_SECRET:'whsec_isolated_fulfillment_only',
  KARUU_PAYMENTS_ENABLED:'false',KARUU_LIVE_COMMERCE_APPROVED:'false',KARUU_TAX_CONFIG_APPROVED:'false',KARUU_DISTRIBUTION_APPROVED:'false',KARUU_LEGAL_APPROVED:'false',
  KARUU_SITE_ORIGIN:'https://karuu.example.test',KARUU_TERMS_VERSION:'isolated-terms-not-a-commercial-approval',
  KARUU_PRIVATE_MEDIA_PROVIDER:'r2',KARUU_DELIVERY_SIGNING_SECRET:'isolated-delivery-signing-value-not-real-123456',
  KARUU_NOTIFICATION_JOB_SECRET:'isolated-notification-value-not-real-123456',
};
const sessions=new Map(),intents=new Map(),charges=new Map(),refunds=new Map(),checkouts=new Map();
let checkoutCreates=0,networkAttempts=0,currentToken=null;
const originalFetch=globalThis.fetch;
globalThis.fetch=async()=>{networkAttempts++;throw Error('All external network is forbidden in this isolated process');};
const signatureSdk=new Stripe('sk_test_isolated_signature_only');
class Merchant{
  static createFetchHttpClient(){return Stripe.createFetchHttpClient();}
  static createSubtleCryptoProvider(){return Stripe.createSubtleCryptoProvider();}
  webhooks=signatureSdk.webhooks;
  taxRates={retrieve:async id=>{assert.equal(id,'txr_isolatedSwedishRate');return {id,active:true,inclusive:true,country:'SE',percentage:6};}};
  checkout={sessions:{
    create:async(params,options)=>{
      assert.equal(params.mode,'payment');assert.equal(params.automatic_tax,undefined);
      assert.equal(params.adaptive_pricing,undefined);
      if(checkouts.has(options.idempotencyKey))return checkouts.get(options.idempotencyKey);
      checkoutCreates++;const id='cs_'+crypto.randomUUID(),intentId='pi_'+crypto.randomUUID();
      const currency=params.line_items[0].price_data.currency,amount=params.line_items.reduce((sum,line)=>sum+line.price_data.unit_amount,0);
      const session={id,mode:'payment',livemode:false,status:'open',payment_status:'unpaid',payment_intent:intentId,client_reference_id:params.client_reference_id,metadata:{...params.metadata},amount_total:amount,currency,url:'https://checkout.stripe.example.test/'+id,customer_details:{address:{country:'SE'}}};
      const charge={id:'ch_'+crypto.randomUUID(),livemode:false,paid:false,captured:false,amount,amount_captured:0,amount_refunded:0,currency,payment_intent:intentId};
      intents.set(intentId,{id:intentId,livemode:false,status:'requires_payment_method',amount,amount_received:0,currency,metadata:{...params.payment_intent_data.metadata},latest_charge:charge.id});charges.set(charge.id,charge);sessions.set(id,session);checkouts.set(options.idempotencyKey,session);return session;
    },
    retrieve:async id=>{assert.ok(sessions.has(id));return sessions.get(id);},
    list:async({payment_intent})=>({data:[...sessions.values()].filter(session=>session.payment_intent===payment_intent),has_more:false}),
  }};
  paymentIntents={retrieve:async id=>{assert.ok(intents.has(id));return intents.get(id);}};
  charges={retrieve:async id=>{assert.ok(charges.has(id));return charges.get(id);}};
  refunds={
    retrieve:async id=>{assert.ok(refunds.has(id));return refunds.get(id);},
    list:async({payment_intent,starting_after,limit})=>{const all=[...refunds.values()].filter(refund=>refund.payment_intent===payment_intent),start=starting_after?all.findIndex(refund=>refund.id===starting_after)+1:0;return {data:all.slice(start,start+limit),has_more:start+limit<all.length};},
    create:async()=>{throw Error('No refund creation/API debit is allowed; only authenticated fixture refund events are tested');},
  };
}

const objects=new Map(),r2Reads=[],r2Heads=[],mailAcceptances=[];
function putFixture(key,bytes,type){const exact=Buffer.from(bytes);objects.set(key,{bytes:exact,etag:crypto.createHash('md5').update(exact).digest('hex'),sha256:crypto.createHash('sha256').update(exact).digest('hex'),type});}
function metadata(object){return {size:object.bytes.length,etag:object.etag,httpEtag:`"${object.etag}"`,checksums:{sha256:Uint8Array.from(Buffer.from(object.sha256,'hex')).buffer},httpMetadata:{contentType:object.type}};}
const bucket={
  head:async key=>{r2Heads.push(key);const object=objects.get(key);return object?metadata(object):null;},
  get:async(key,options)=>{
    r2Reads.push(key);const object=objects.get(key);if(!object)return null;
    assert.ok(options?.onlyIf?.etagMatches,'The actual private-media adapter must condition its read on the verified object ETag');
    if(options.onlyIf.etagMatches!==object.etag)return metadata(object);
    const range=options.range;let bytes=object.bytes;
    if(range){assert.ok(Number.isSafeInteger(range.offset)&&Number.isSafeInteger(range.length)&&range.offset>=0&&range.length>0&&range.offset+range.length<=bytes.length);bytes=bytes.subarray(range.offset,range.offset+range.length);}
    return {...metadata(object),body:new ReadableStream({start(controller){controller.enqueue(Uint8Array.from(bytes));controller.close();}})};
  },
};
const mail={
  brandMailConfigured:async()=>true,
  brandMailRetryConfigured:async()=>false,
  sendBrandMail:async(to,subject,text,brand,key)=>{
    assert.equal(brand,'karuu');assert.match(to,/@example\.test$/);assert.ok(key);
    const receipt={accepted:true,provider:'cloudflare',messageId:'isolated-acceptance-'+(mailAcceptances.length+1),providerIdempotency:false};
    mailAcceptances.push({to,subject,text,brand,key,receipt});return receipt;
  },
};
const modules=new Map();
function load(name){
  if(modules.has(name))return modules.get(name);
  const filename=path.join(root,'src/lib/server',name+'.ts'),module={exports:{}};modules.set(name,module.exports);
  const require=dependency=>{
    if(dependency==='node:crypto')return crypto;if(dependency==='node:util')return util;
    if(dependency==='pg')return {Pool};if(dependency==='stripe')return Merchant;
    if(dependency==='next/server')return {NextResponse:Response};
    if(dependency==='next/headers')return {cookies:async()=>({get:key=>key==='karuu_session'&&currentToken?{value:currentToken}:undefined})};
    if(dependency==='./cloudflare')return {commerceHyperdrive:async()=>null,cloudflareEnvironment:async()=>({KARUU_PRIVATE_MEDIA:bucket})};
    if(dependency==='./mail')return mail;
    if(dependency.startsWith('./'))return load(dependency.slice(2));
    throw Error('Unexpected module dependency '+dependency);
  };
  const code=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  vm.runInContext(code,vm.createContext({module,exports:module.exports,require,process:{env:environment},Date,Buffer,URL,Request,Response,Headers,ReadableStream,console,fetch:async()=>{networkAttempts++;throw Error('All external network is forbidden');}}),{filename});
  modules.set(name,module.exports);return module.exports;
}
const core=load('core'),commerce=load('commerce'),payments=load('payment-reconciliation'),delivery=load('delivery'),notifications=load('notifications');
const zeroCosts=Object.fromEntries(core.costFields.map(key=>[key,key==='vatRate'?0.06:0]));
async function catalog(label,formats=['epub','mp3']){
  const skuId='sku-'+crypto.randomUUID(),assets=[];
  for(const format of formats){
    const id='asset-'+crypto.randomUUID(),key='private/isolated/'+id+'.'+format,bytes=Buffer.from(`Exact isolated ${label} ${format} edition bytes; not a published mother file.`);
    putFixture(key,bytes,format==='epub'?'application/epub+zip':'audio/mpeg');
    await owner('INSERT INTO commerce_assets(id,work_slug,title,format,language,object_key,edition_version,content_sha256,rights_verified,delivery_verified) VALUES($1,$2,$3,$4,$5,$6,$7,$8,true,true)',[id,'isolated-work','Isolated edition',format,'en',key,'fixture-v1',objects.get(key).sha256]);assets.push({id,key,bytes,format});
  }
  const components=assets.map((asset,index)=>({assetId:asset.id,allocationBps:assets.length===1?10000:index===0?7000:3000})),taxes=Object.fromEntries(assets.map(asset=>[asset.id,{rate:0.06,stripeTaxRateId:'txr_isolatedSwedishRate'}]));
  await owner("INSERT INTO commerce_skus(id,slug,title,kind,status,currency,price_minor,rights_verified,markets,components,tax_by_market) VALUES($1,$1,$2,$3,'active','USD',199,true,ARRAY['SE'],$4,$5)",[skuId,'Isolated '+label,assets.length>1?'bundle':'ebook',JSON.stringify(components),JSON.stringify({SE:taxes})]);
  await owner('INSERT INTO commerce_costs(sku_id,inputs) VALUES($1,$2)',[skuId,JSON.stringify(zeroCosts)]);return {skuId,assets};
}
async function buyer(){const user={id:crypto.randomUUID(),email:crypto.randomUUID()+'@example.test',role:'customer',brands:['karuu']},token=crypto.randomBytes(32).toString('hex');await owner('INSERT INTO commerce_users(id,email,display_name,password_hash,verified_at) VALUES($1,$2,$3,$4,now())',[user.id,user.email,'Isolated buyer','not-a-real-password']);await owner("INSERT INTO commerce_sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')",[core.hash(token),user.id]);return {user,token};}
async function checkout(user,product){
  assert.equal(environment.KARUU_PAYMENTS_ENABLED,'false');
  // Only this isolated VM's test-mode gate opens while creating a fixture
  // checkout. It closes immediately; real process/deployment settings stay untouched.
  environment.KARUU_PAYMENTS_ENABLED='true';
  try{const result=await commerce.checkout(user,{skuIds:[product.skuId],market:'SE',immediateDeliveryConsent:true},crypto.randomUUID());const session=[...sessions.values()].find(value=>value.metadata.orderId===result.orderId);return {id:result.orderId,session};}
  finally{environment.KARUU_PAYMENTS_ENABLED='false';}
}
async function signed(type,object,id='evt_'+crypto.randomUUID()){
  const payload=JSON.stringify({id,object:'event',livemode:false,type,data:{object}}),signature=signatureSdk.webhooks.generateTestHeaderString({payload,secret:environment.STRIPE_WEBHOOK_SECRET});
  return payments.webhook(new Request('https://karuu.example.test/api/payments/stripe',{method:'POST',headers:{'stripe-signature':signature},body:payload}));
}
async function paid(receipt,eventId){const session=receipt.session,intent=intents.get(session.payment_intent),charge=charges.get(intent.latest_charge);session.payment_status='paid';session.status='complete';intent.status='succeeded';intent.amount_received=intent.amount;charge.paid=true;charge.captured=true;charge.amount_captured=charge.amount;return signed('checkout.session.async_payment_succeeded',session,eventId);}
async function refund(receipt){const intent=intents.get(receipt.session.payment_intent),charge=charges.get(intent.latest_charge),value={id:'re_'+crypto.randomUUID(),status:'succeeded',currency:intent.currency,amount:intent.amount,payment_intent:intent.id,charge:charge.id};refunds.set(value.id,value);charge.amount_refunded=charge.amount;charge.refunded=true;return signed('charge.refunded',charge);}
async function rights(receipt){return (await owner('SELECT asset_id,status FROM commerce_entitlements WHERE order_id=$1 ORDER BY asset_id',[receipt.id])).rows;}
async function jobs(receipt){return (await owner('SELECT id,state,attempts FROM commerce_outbox WHERE reference_id=$1',[receipt.id])).rows;}
const notify=async()=>JSON.parse(JSON.stringify(await notifications.deliverNotifications(new Request('https://karuu.example.test/api/internal/notifications',{method:'POST',headers:{Authorization:'Bearer '+environment.KARUU_NOTIFICATION_JOB_SECRET}}))));
const request=(grant,range)=>new Request('https://karuu.example.test'+grant.url,{headers:range?{Range:range}:{}});
let product,alice,first,firstEvent,firstGrant,bob,target,targetGrant,otherProduct,otherReceipt,otherGrant;
try{
  await test('one signed paid receipt grants exact bundle editions, queues one notice, serves authenticated exact bytes and accepts one account-only email',async()=>{
    product=await catalog('bundle');alice=await buyer();first=await checkout(alice.user,product);firstEvent='evt_'+crypto.randomUUID();await paid(first,firstEvent);
    assert.equal(commerce.paymentsConfigured(),false);assert.deepEqual((await rights(first)).map(row=>row.asset_id).sort(),product.assets.map(asset=>asset.id).sort());assert.ok((await rights(first)).every(row=>row.status==='active'));assert.equal((await jobs(first)).length,1);
    currentToken=alice.token;firstGrant=await delivery.grantAccess(alice.user,product.assets[0].id);const response=await delivery.deliver(request(firstGrant),product.assets[0].id);
    assert.equal(response.status,200);assert.equal(response.headers.get('Cache-Control'),'private, no-store');assert.deepEqual(Buffer.from(await response.arrayBuffer()),product.assets[0].bytes);
    const audioGrant=await delivery.grantAccess(alice.user,product.assets[1].id),audio=await delivery.deliver(request(audioGrant,'bytes=1-6'),product.assets[1].id);assert.equal(audio.status,206);assert.equal(audio.headers.get('Content-Range'),`bytes 1-6/${product.assets[1].bytes.length}`);assert.deepEqual(Buffer.from(await audio.arrayBuffer()),product.assets[1].bytes.subarray(1,7));
    assert.deepEqual(await notify(),{processed:1,providerAccepted:1,failed:0,needsReview:0});assert.equal(mailAcceptances.length,1);const message=mailAcceptances[0];assert.equal(message.to,alice.user.email);assert.equal(message.key,(await jobs(first))[0].id);assert.ok(message.text.includes('https://karuu.example.test/account'));assert.ok(message.text.includes(first.id));for(const asset of product.assets)assert.equal(message.text.includes(asset.key),false);assert.equal(message.text.includes('grant='),false);assert.equal((await jobs(first))[0].state,'sent');
  });
  await test('same event and distinct paid replays create no duplicate entitlement, queue, provider acceptance or checkout',async()=>{
    const before=checkoutCreates;assert.equal((await signed('checkout.session.async_payment_succeeded',first.session,firstEvent)).duplicate,true);await signed('checkout.session.completed',first.session);await signed('checkout.session.async_payment_succeeded',first.session);
    assert.equal((await rights(first)).length,2);assert.equal((await jobs(first)).length,1);assert.equal((await notify()).processed,0);assert.equal(mailAcceptances.length,1);assert.equal(checkoutCreates,before);
  });
  await test('signed full refund rejects the original still-valid grant before any R2 read, withholds its pending notice and defeats late paid replay',async()=>{
    bob=await buyer();target=await checkout(bob.user,product);await paid(target);currentToken=bob.token;targetGrant=await delivery.grantAccess(bob.user,product.assets[0].id);
    assert.deepEqual(Buffer.from(await (await delivery.deliver(request(targetGrant),product.assets[0].id)).arrayBuffer()),product.assets[0].bytes);
    otherProduct=await catalog('separate edition',['epub']);otherReceipt=await checkout(bob.user,otherProduct);await paid(otherReceipt);otherGrant=await delivery.grantAccess(bob.user,otherProduct.assets[0].id);
    await refund(target);const getBefore=r2Reads.length,headBefore=r2Heads.length;
    await assert.rejects(delivery.deliver(request(targetGrant),product.assets[0].id),{code:'content_not_found'});assert.equal(r2Reads.length,getBefore);assert.equal(r2Heads.length,headBefore);assert.ok((await rights(target)).every(row=>row.status==='revoked'));
    const result=await notify();assert.deepEqual(result,{processed:2,providerAccepted:1,failed:1,needsReview:1});assert.equal(mailAcceptances.filter(message=>message.text.includes(target.id)).length,0);assert.equal((await jobs(target))[0].state,'failed');assert.equal((await jobs(target))[0].attempts,5);
    await signed('checkout.session.completed',target.session);assert.ok((await rights(target)).every(row=>row.status==='revoked'));assert.equal((await jobs(target)).length,1);assert.equal((await notify()).processed,0);assert.equal(mailAcceptances.filter(message=>message.text.includes(target.id)).length,0);
  });
  await test('refund leaves another confirmed order for that account and another account untouched, with account isolation still enforced',async()=>{
    currentToken=bob.token;const separate=await delivery.deliver(request(otherGrant),otherProduct.assets[0].id);assert.deepEqual(Buffer.from(await separate.arrayBuffer()),otherProduct.assets[0].bytes);assert.ok((await rights(otherReceipt)).every(row=>row.status==='active'));assert.equal(mailAcceptances.filter(message=>message.text.includes(otherReceipt.id)).length,1);
    const before=r2Reads.length;await assert.rejects(delivery.deliver(request(firstGrant),product.assets[0].id),{code:'expired_grant'});assert.equal(r2Reads.length,before);
    currentToken=alice.token;assert.deepEqual(Buffer.from(await (await delivery.deliver(request(firstGrant),product.assets[0].id)).arrayBuffer()),product.assets[0].bytes);assert.ok((await rights(first)).every(row=>row.status==='active'));
  });
  await test('a substituted private object fails complete SHA verification before GET without destroying the valid purchase',async()=>{
    currentToken=bob.token;const asset=otherProduct.assets[0],original=objects.get(asset.key);putFixture(asset.key,Buffer.from('Different edition that is not in the paid snapshot'),'application/epub+zip');const before=r2Reads.length;
    await assert.rejects(delivery.deliver(request(otherGrant),asset.id),{code:'file_integrity_unconfirmed'});assert.equal(r2Reads.length,before);assert.ok((await rights(otherReceipt)).every(row=>row.status==='active'));objects.set(asset.key,original);assert.deepEqual(Buffer.from(await (await delivery.deliver(request(otherGrant),asset.id)).arrayBuffer()),asset.bytes);
  });
  await test('refund after prior provider acceptance revokes downloads and never resends, while an already accepted message remains an external historical fact',async()=>{
    const accepted=mailAcceptances.filter(message=>message.text.includes(first.id)).length;assert.equal(accepted,1);await refund(first);currentToken=alice.token;const before=r2Reads.length;
    await assert.rejects(delivery.deliver(request(firstGrant),product.assets[0].id),{code:'content_not_found'});assert.equal(r2Reads.length,before);assert.equal((await notify()).processed,0);assert.equal(mailAcceptances.filter(message=>message.text.includes(first.id)).length,accepted);
    assert.equal(networkAttempts,0);assert.deepEqual([...runtimeRoles],['karuu_web']);for(const flag of ['KARUU_PAYMENTS_ENABLED','KARUU_LIVE_COMMERCE_APPROVED','KARUU_TAX_CONFIG_APPROVED','KARUU_DISTRIBUTION_APPROVED','KARUU_LEGAL_APPROVED'])assert.equal(environment[flag],'false');
  });
}finally{globalThis.fetch=originalFetch;await queue;await db.close();}
console.log('Seam boundary: one in-memory PGlite private schema/runtime RLS; real Stripe SDK signatures and actual checkout/reconciliation/auth/delivery/private-media/notifications. Strict memory R2 and mail-acceptance fixtures only. No external requests, real secrets, registration, customer mail, charge, refund API, remote database, host service, build or deployment. Provider acceptance is not arrival; previously handed-off messages cannot be recalled.');
