import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import ts from 'typescript';
import { PGlite } from '@electric-sql/pglite';

// Actual checkout SQL and modules; isolated PostgreSQL-WASM and provider fixtures.
// No process credentials, external account, mail, payment or network is accessed.
const root=path.resolve(import.meta.dirname,'..'),db=new PGlite();
await db.waitReady;
await db.exec(fs.readFileSync(path.join(root,'db/001-commerce.sql'),'utf8'));
let queue=Promise.resolve(),failBinding=false,taxFailure=false,createFailure='',onCreate=null,transform=null;
const providerSessions=new Map(),createRequests=[];
const env={KARUU_PAYMENT_MODE:'test',STRIPE_SECRET_KEY:'sk_test_isolated_fixture_only',STRIPE_WEBHOOK_SECRET:'whsec_fixture_only',KARUU_PAYMENTS_ENABLED:'true',KARUU_SITE_ORIGIN:'https://karuu.example.test',KARUU_TERMS_VERSION:'fixture-terms-v1'};
async function locked(work){const previous=queue;let release;queue=new Promise(resolve=>{release=resolve;});await previous;try{return await work();}finally{release();}}
async function execute(sql,values=[]){if(failBinding&&sql.startsWith('UPDATE commerce_orders SET stripe_session_id')){failBinding=false;throw new Error('Isolated database save failure');}return db.query(sql,values);}
const database={databaseConfigured:async()=>true,query:async(sql,values=[])=>locked(async()=>(await execute(sql,values)).rows),
  transaction:work=>locked(async()=>{await db.exec('BEGIN');try{const result=await work({query:execute});await db.exec('COMMIT');return result;}catch(error){await db.exec('ROLLBACK');throw error;}}),
  audit:async(client,actor,action,target,reason,detail)=>client.query('INSERT INTO commerce_audit(id,actor_id,action,target,reason,detail) VALUES($1,$2,$3,$4,$5,$6)',[crypto.randomUUID(),actor,action,target,reason,JSON.stringify(detail)]),
};
class FixtureStripe{
  static createFetchHttpClient(){return {};}
  taxRates={retrieve:async()=>{if(taxFailure)throw new Error('Isolated tax failure');return {active:true,inclusive:true,percentage:6,country:'SE'};}};
  checkout={sessions:{create:async(params,options)=>{
    createRequests.push(options.idempotencyKey);
    if(createFailure==='before'){createFailure='';throw new Error('Isolated provider timeout before creation');}
    let session=providerSessions.get(options.idempotencyKey);
    if(!session){session={id:`cs_test_fixture_${providerSessions.size+1}`,livemode:false,client_reference_id:params.client_reference_id,metadata:params.metadata,
      amount_total:params.line_items.reduce((sum,item)=>sum+item.price_data.unit_amount,0),currency:params.line_items[0].price_data.currency,url:'https://checkout.stripe.example.test/fixture'};
      providerSessions.set(options.idempotencyKey,session);
    }
    if(createFailure==='after'){createFailure='';throw new Error('Isolated provider timeout after creation');}
    if(onCreate){const hook=onCreate;onCreate=null;await hook(session);}
    return transform?transform({...session}):session;
  },retrieve:async id=>{const session=[...providerSessions.values()].find(value=>value.id===id);if(!session)throw new Error('Missing isolated session');return session;}}};
}
const cache=new Map();
function load(file){
  const filename=path.join(root,'src/lib/server',file);if(cache.has(filename))return cache.get(filename);
  const module={exports:{}};cache.set(filename,module.exports);
  const require=name=>{
    if(name==='node:crypto')return crypto;
    if(name==='stripe')return FixtureStripe;
    if(name==='./db')return database;
    if(name==='./auth')return {mailConfigured:async()=>false};
    if(name==='./private-media')return {privateMediaConfigured:async()=>true};
    if(name.startsWith('./'))return load(name.slice(2)+'.ts');
    throw new Error(`Unapproved fixture dependency ${name}`);
  };
  const context=vm.createContext({module,exports:module.exports,require,process:{env},Date,Buffer,URL,fetch:()=>{throw new Error('External network forbidden');}});
  vm.runInContext(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,context,{filename});
  cache.set(filename,module.exports);return module.exports;
}
const commerce=load('commerce.ts'),core=load('core.ts'),code=expected=>error=>error.code===expected;
async function fixture(){
  failBinding=false;taxFailure=false;createFailure='';onCreate=null;transform=null;
  env.KARUU_PAYMENT_MODE='test';env.STRIPE_SECRET_KEY='sk_test_isolated_fixture_only';env.KARUU_PAYMENTS_ENABLED='true';env.KARUU_TERMS_VERSION='fixture-terms-v1';
  const user={id:crypto.randomUUID(),email:`fixture-${crypto.randomUUID()}@example.test`,role:'customer',brands:['karuu']},assetId=`asset-${crypto.randomUUID()}`,skuId=`sku-${crypto.randomUUID()}`;
  await db.query('INSERT INTO commerce_users(id,email,display_name,password_hash,verified_at) VALUES($1,$2,$3,$4,now())',[user.id,user.email,'Isolated fixture','not-a-password']);
  await db.query("INSERT INTO commerce_assets(id,work_slug,title,format,language,object_key,rights_verified,delivery_verified,edition_version,content_sha256) VALUES($1,'fixture-story','Fixture story','epub','en',$2,true,true,'1',$3)",[assetId,`fixture/${assetId}.epub`,'a'.repeat(64)]);
  await db.query("INSERT INTO commerce_skus(id,slug,title,kind,status,currency,price_minor,rights_verified,markets,components,tax_by_market) VALUES($1,$1,'Fixture product','ebook','active','SEK',1000,true,ARRAY['SE'], $2,$3)",[skuId,JSON.stringify([{assetId,allocationBps:10000}]),JSON.stringify({SE:{[assetId]:{rate:0.06,stripeTaxRateId:'txr_fixture'}}})]);
  const costs=Object.fromEntries(core.costFields.map(key=>[key,key==='vatRate'?0.06:key==='targetSurplus'?100:0]));
  await db.query('INSERT INTO commerce_costs(sku_id,inputs) VALUES($1,$2)',[skuId,JSON.stringify(costs)]);
  return {user,assetId,skuId,input:{skuIds:[skuId],market:'SE',immediateDeliveryConsent:true},orders:async()=>(await db.query('SELECT * FROM commerce_orders WHERE user_id=$1',[user.id])).rows};
}

await test('tax failure survives reload and resumes identical pending quote with a new request key',async()=>{
  const f=await fixture();taxFailure=true;await assert.rejects(commerce.checkout(f.user,f.input,crypto.randomUUID()));
  const pending=(await f.orders())[0];assert.equal(pending.stripe_session_id,null);
  taxFailure=false;const resumed=await commerce.checkout(f.user,f.input,crypto.randomUUID());
  assert.equal(resumed.orderId,pending.id);assert.equal((await f.orders()).length,1);assert.ok(resumed.url);
});
await test('provider failure before creating session reuses original order and provider key',async()=>{
  const f=await fixture();createFailure='before';const start=createRequests.length;
  await assert.rejects(commerce.checkout(f.user,f.input,crypto.randomUUID()));
  const original=(await f.orders())[0];const resumed=await commerce.checkout(f.user,f.input,crypto.randomUUID());
  assert.equal(resumed.orderId,original.id);assert.deepEqual(createRequests.slice(start),[`checkout-${original.id}`,`checkout-${original.id}`]);
});
await test('provider success followed by timeout never creates a second merchant session',async()=>{
  const f=await fixture(),start=providerSessions.size;createFailure='after';
  await assert.rejects(commerce.checkout(f.user,f.input,crypto.randomUUID()));
  const original=(await f.orders())[0];const result=await commerce.checkout(f.user,f.input,crypto.randomUUID());
  assert.equal(result.orderId,original.id);assert.equal(providerSessions.size,start+1);assert.equal((await f.orders()).length,1);
});
await test('failed session binding rolls back and retry binds the same merchant session',async()=>{
  const f=await fixture(),start=providerSessions.size;failBinding=true;
  await assert.rejects(commerce.checkout(f.user,f.input,crypto.randomUUID()));assert.equal((await f.orders())[0].stripe_session_id,null);
  const result=await commerce.checkout(f.user,f.input,crypto.randomUUID());assert.ok(result.url);
  assert.equal(providerSessions.size,start+1);assert.equal((await f.orders()).length,1);
});
await test('concurrent different request keys for identical quotes share one order/session',async()=>{
  const f=await fixture(),start=providerSessions.size;
  const results=await Promise.all([commerce.checkout(f.user,f.input,crypto.randomUUID()),commerce.checkout(f.user,f.input,crypto.randomUUID())]);
  assert.equal(results[0].orderId,results[1].orderId);assert.equal((await f.orders()).length,1);assert.equal(providerSessions.size,start+1);
});
await test('pending recovery stays scoped to its account',async()=>{
  const a=await fixture(),b=await fixture(),key=crypto.randomUUID();
  const first=await commerce.checkout(a.user,a.input,key);const second=await commerce.checkout(b.user,a.input,key);
  assert.notEqual(first.orderId,second.orderId);assert.equal((await a.orders()).length,1);assert.equal((await b.orders()).length,1);
});
await test('altered bag/market/terms does not reuse or bypass an overlapping pending order',async()=>{
  const f=await fixture(),key=crypto.randomUUID();await commerce.checkout(f.user,f.input,key);
  await assert.rejects(commerce.checkout(f.user,{...f.input,market:'GB'},key),code('idempotency_conflict'));
  env.KARUU_TERMS_VERSION='fixture-terms-v2';await assert.rejects(commerce.checkout(f.user,f.input,crypto.randomUUID()),code('checkout_pending'));
  assert.equal((await f.orders()).length,1);
});
await test('unbound quote after 23h fails closed without another provider attempt or cancellation',async()=>{
  const f=await fixture();taxFailure=true;await assert.rejects(commerce.checkout(f.user,f.input,crypto.randomUUID()));taxFailure=false;
  await db.query("UPDATE commerce_orders SET created_at=now()-interval '23 hours' WHERE user_id=$1",[f.user.id]);
  const start=createRequests.length;await assert.rejects(commerce.checkout(f.user,f.input,crypto.randomUUID()),code('checkout_recovery_required'));
  assert.equal(createRequests.length,start);assert.equal((await f.orders())[0].status,'pending');
});
await test('future quote timestamp fails closed',async()=>{
  const f=await fixture();taxFailure=true;await assert.rejects(commerce.checkout(f.user,f.input,crypto.randomUUID()));taxFailure=false;
  await db.query("UPDATE commerce_orders SET created_at=now()+interval '1 hour' WHERE user_id=$1",[f.user.id]);
  await assert.rejects(commerce.checkout(f.user,f.input,crypto.randomUUID()),code('checkout_recovery_required'));
});
await test('already bound session with a missing URL is retrieved even after the safe create window',async()=>{
  const f=await fixture(),original=await commerce.checkout(f.user,f.input,crypto.randomUUID());
  await db.query("UPDATE commerce_orders SET checkout_url=NULL,created_at=now()-interval '25 hours' WHERE id=$1",[original.orderId]);
  const start=createRequests.length;const recovered=await commerce.checkout(f.user,f.input,crypto.randomUUID());
  assert.equal(recovered.orderId,original.orderId);assert.ok(recovered.url);assert.equal(createRequests.length,start);
});
await test('unbound recovery rechecks withdrawn asset rights before contacting the payment provider',async()=>{
  const f=await fixture();taxFailure=true;await assert.rejects(commerce.checkout(f.user,f.input,crypto.randomUUID()));taxFailure=false;
  await db.query('UPDATE commerce_assets SET rights_verified=false WHERE id=$1',[f.assetId]);
  const start=createRequests.length;await assert.rejects(commerce.checkout(f.user,f.input,crypto.randomUUID()),code('delivery_not_ready'));
  assert.equal(createRequests.length,start);assert.equal((await f.orders())[0].status,'pending');
});
await test('changed quote does not replace its immutable price or create another payment',async()=>{
  const f=await fixture();taxFailure=true;await assert.rejects(commerce.checkout(f.user,f.input,crypto.randomUUID()));taxFailure=false;
  await db.query('UPDATE commerce_skus SET price_minor=1100 WHERE id=$1',[f.skuId]);
  const start=createRequests.length;await assert.rejects(commerce.checkout(f.user,f.input,crypto.randomUUID()),code('checkout_quote_changed'));
  assert.equal(createRequests.length,start);assert.equal((await f.orders())[0].total_minor,1000);
});
await test('merchant metadata, amount and mode mismatches cannot be bound',async()=>{
  for(const change of [s=>({...s,metadata:{...s.metadata,userId:crypto.randomUUID()}}),s=>({...s,amount_total:s.amount_total+1}),s=>({...s,currency:'eur'})]){
    const f=await fixture();transform=change;await assert.rejects(commerce.checkout(f.user,f.input,crypto.randomUUID()),code('checkout_session_mismatch'));assert.equal((await f.orders())[0].stripe_session_id,null);
  }
  const f=await fixture();transform=s=>({...s,livemode:true});await assert.rejects(commerce.checkout(f.user,f.input,crypto.randomUUID()),code('payment_mode_mismatch'));
});
await test('checkout cannot overwrite a different session concurrently bound by settlement',async()=>{
  const f=await fixture();onCreate=async session=>db.query('UPDATE commerce_orders SET stripe_session_id=$1 WHERE id=$2',['cs_test_other_bound_session',session.metadata.orderId]);
  await assert.rejects(commerce.checkout(f.user,f.input,crypto.randomUUID()),code('checkout_session_conflict'));
  assert.equal((await f.orders())[0].stripe_session_id,'cs_test_other_bound_session');
});
await test('settlement completing during session creation is not reset to pending or returned for another payment',async()=>{
  const f=await fixture();onCreate=async session=>db.query("UPDATE commerce_orders SET status='paid',stripe_session_id=$1 WHERE id=$2",[session.id,session.metadata.orderId]);
  const result=await commerce.checkout(f.user,f.input,crypto.randomUUID());assert.equal(result.status,'paid');assert.equal(result.url,null);assert.equal((await f.orders())[0].status,'paid');
});
await test('existing-payment client works with new sales paused but rejects wrong or missing mode/key',async()=>{
  await fixture();env.KARUU_PAYMENTS_ENABLED='false';assert.throws(()=>commerce.stripeClient(),code('payments_not_configured'));assert.ok(commerce.stripeClient({existingPayments:true}));
  env.KARUU_PAYMENT_MODE='live';assert.throws(()=>commerce.stripeClient({existingPayments:true}),code('payment_mode_mismatch'));
  env.STRIPE_SECRET_KEY='rk_live_fixture_only';assert.ok(commerce.stripeClient({existingPayments:true}));assert.throws(()=>commerce.stripeClient(),code('payments_not_configured'));
  env.KARUU_PAYMENT_MODE='invalid';assert.throws(()=>commerce.stripeClient({existingPayments:true}),code('payment_mode_mismatch'));
});

function renderBag(storage,calls,response={orderId:'fixture-order',url:'https://checkout.stripe.example.test/fixture'}){
  const module={exports:{}},state=[[{id:'fixture-sku',title:'Fixture product',components:[{format:'epub',language:'en'}],priceMinor:1000,currency:'SEK',available:true}],{payments:true},false,'','SE',true,false];let index=0;
  const jsx=(type,props)=>({type,props});const styles=new Proxy({},{get:(_,name)=>String(name)});
  const require=name=>{
    if(name==='react')return {useState:()=>[state[index++],()=>{}],useRef:()=>({current:''}),useEffect:()=>{}};
    if(name==='react/jsx-runtime')return {jsx,jsxs:jsx,Fragment:'fragment'};
    if(name==='next/link')return 'a';if(name==='lucide-react')return {};
    if(name==='@/lib/cart')return {useBag:()=>({ids:['fixture-sku'],ready:true})};
    if(name==='./commerce-client')return {commerceRequest:async(_,options)=>{calls.push(options.headers['Idempotency-Key']);return response;}};
    if(name==='./store-shell')return {styles,formatMoney:()=> 'fixture price'};
    throw new Error(`Unapproved component dependency ${name}`);
  };
  const context=vm.createContext({module,exports:module.exports,require,crypto,URL,window:{localStorage:storage,location:{assign(){}}}});
  const filename=path.join(root,'src/components/store/bag-content.tsx');
  vm.runInContext(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true,jsx:ts.JsxEmit.ReactJSX}}).outputText,context,{filename});
  const tree=module.exports.BagContent({});
  function find(node){if(!node||typeof node!=='object')return null;if(node.props?.onClick&&node.props.children?.[0]==='Continue to payment')return node.props.onClick;for(const child of [node.props?.children].flat(Infinity)){const result=find(child);if(result)return result;}return null;}
  const handler=find(tree);assert.equal(typeof handler,'function');return handler;
}
await test('real bag handler keeps checkout key through a fresh render/browser reload',async()=>{
  const saved=new Map(),calls=[],storage={getItem:key=>saved.get(key)??null,setItem:(key,value)=>saved.set(key,value)};
  await renderBag(storage,calls)();await renderBag(storage,calls)();assert.equal(calls.length,2);assert.equal(calls[0],calls[1]);assert.match(calls[0],/^[a-zA-Z0-9_-]{16,80}$/);
});
await test('real bag handler tolerates unavailable localStorage without changing its in-memory retry key',async()=>{
  const calls=[],handler=renderBag({getItem(){throw new Error('Storage unavailable');},setItem(){throw new Error('Storage unavailable');}},calls);
  await handler();await handler();assert.equal(calls[0],calls[1]);
});
await test('real bag handler clears settled checkout key so a cancelled or refunded order is not reused forever',async()=>{
  for(const status of ['cancelled','refunded','paid']){
    const saved=new Map(),calls=[],storage={getItem:key=>saved.get(key)??null,setItem:(key,value)=>saved.set(key,value),removeItem:key=>saved.delete(key)};
    await renderBag(storage,calls,{orderId:'fixture-order',url:null,status})();assert.equal(saved.size,0);
    await renderBag(storage,calls)();assert.notEqual(calls[0],calls[1]);
  }
});
await db.close();
