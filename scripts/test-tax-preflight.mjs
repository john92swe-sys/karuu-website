import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import ts from 'typescript';

// Actual server adapter and tax validators. Read ports return isolated memory
// resources; there are no database or payment-write ports and no external I/O.
const root=path.resolve(import.meta.dirname,'..'),modules=new Map();
function load(name){
  if(modules.has(name))return modules.get(name);
  const file=path.join(root,'src/lib/server',name+'.ts'),module={exports:{}};modules.set(name,module.exports);
  const require=dependency=>{if(dependency==='node:crypto')return crypto;if(dependency.startsWith('./'))return load(dependency.slice(2));throw Error('Forbidden dependency '+dependency);};
  vm.runInContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,vm.createContext({module,exports:module.exports,require,Date,URL,Buffer,process:{env:{}},fetch(){throw Error('External network forbidden');}}),{filename:file});
  modules.set(name,module.exports);return module.exports;
}
const tax=load('global-tax'),core=load('core'),preflight=load('tax-preflight'),copy=value=>JSON.parse(JSON.stringify(value));
const code=expected=>error=>error.code===expected;
function fixture(){
  const now=1791960000,review={reviewedAt:'2020-01-01T00:00:00Z',evidenceReference:'isolated-fixture-not-a-commercial-approval'};
  const preparation=tax.normalizeAutomaticTaxPreparation({components:['a-one','a-two'].map(assetId=>({assetId,taxCode:'txcd_10302000',review})),jurisdictions:[{country:'SE',state:null,registrationId:'taxreg_isolated',registrationCountry:'SE',registrationType:'standard',placeOfSupplyScheme:'standard',review}],pricing:{mode:'checkout_automatic',percentFee:0.005,fixedFeeMinor:0,inclusiveTaxRateCeiling:0.3,review},sandboxReview:review},['a-one','a-two']);
  const address=tax.normalizeBillingTaxAddress({country:'SE',line1:'Isolated Street 1',city:'Isolated City',postalCode:'12345'});
  const quote={orderId:'order-isolated',userId:'user-isolated',email:'isolated@example.test',currency:'USD',totalMinor:199,address,addressHash:core.hash(JSON.stringify(address)),preparationHash:core.hash(JSON.stringify(preparation)),components:['a-one','a-two'].map((assetId,i)=>({skuId:'sku-isolated',assetId,title:'Isolated book',format:'epub',language:'en',editionVersion:'fixture-v1',contentSha256:'a'.repeat(64),amountMinor:i?99:100,taxCode:'txcd_10302000'}))};
  const subject={schemaVersion:3,orderId:quote.orderId,userId:quote.userId,orderRevision:'isolated-order-v1',status:'pending',taxMode:'stripe_automatic',sessionId:'cs_isolated',merchantAccountId:'acct_isolated',live:false,costRevision:'isolated-cost-v1',policyRevision:'isolated-policy-v1',quote,preparation,costs:Object.fromEntries(core.costFields.map(key=>[key,key==='vatRate'?null:0]))};
  const session={id:subject.sessionId,mode:'payment',livemode:false,status:'complete',payment_status:'unpaid',payment_intent:'pi_isolated',client_reference_id:quote.orderId,metadata:{orderId:quote.orderId,userId:quote.userId,taxQuoteHash:tax.automaticTaxQuoteIdentity(quote)},currency:'usd',amount_total:199,automatic_tax:{enabled:true,status:'complete',liability:{type:'self'},provider:'stripe'},customer_details:{address:{...address,postal_code:address.postalCode}},total_details:{amount_tax:12,amount_discount:0,amount_shipping:0}};
  const lines=quote.components.map((c,i)=>({id:'li_isolated'+i,quantity:1,currency:'usd',amount_total:c.amountMinor,amount_discount:0,amount_tax:6,price:{unit_amount:c.amountMinor,currency:'usd',tax_behavior:'inclusive',product:{id:'prod_isolated'+i,tax_code:c.taxCode,metadata:{skuId:c.skuId,assetId:c.assetId,editionVersion:c.editionVersion,contentSha256:c.contentSha256}}},taxes:[{amount:6,rate:{id:'txr_isolated',country:'SE',state:null,percentage:6,inclusive:true},taxability_reason:'standard_rated',taxable_amount:c.amountMinor-6}]}));
  const intent={id:'pi_isolated',livemode:false,status:'requires_capture',capture_method:'manual',amount:199,amount_capturable:199,amount_received:0,currency:'usd',metadata:{orderId:quote.orderId},latest_charge:'ch_isolated'};
  const charge={id:'ch_isolated',livemode:false,payment_intent:intent.id,amount:199,amount_captured:0,currency:'usd',paid:true,captured:false,refunded:false,amount_refunded:0,payment_method_details:{type:'card',card:{capture_before:now+600}}};
  const registrations=[{id:'taxreg_other',country:'US',livemode:false,status:'expired',active_from:1,expires_at:2,country_options:{us:{type:'state_sales_tax',state:'CA'}}},{id:'taxreg_isolated',country:'SE',livemode:false,status:'active',active_from:1,expires_at:null,country_options:{se:{type:'standard',standard:{place_of_supply_scheme:'standard'}}}}];
  const calls=[],writes=[];let subjectReads=0,marketReads=0,onLines=()=>{};
  const ports={merchantAccountId:subject.merchantAccountId,nowSeconds:()=>now,
    readSubject:async(orderId,userId)=>{calls.push('subject');assert.equal(orderId,subject.orderId);assert.equal(userId,subject.userId);subjectReads++;return copy(subject);},
    resolveMarket:async(address,revision)=>{calls.push('market');marketReads++;return {addressHash:core.hash(JSON.stringify(address)),policyRevision:revision,territory:'isolated-reviewed-SE',allowed:true};},
    readSession:async id=>{calls.push('session');assert.equal(id,session.id);return copy(session);},
    readIntent:async id=>{calls.push('intent');assert.equal(id,intent.id);return copy(intent);},
    readCharge:async id=>{calls.push('charge');assert.equal(id,charge.id);return copy(charge);},
    readTaxSettings:async()=>{calls.push('settings');return {status:'active',livemode:false,head_office:{address:{country:'SE'}}};},
    listRegistrations:async params=>{calls.push('registrations');assert.equal(params.limit,100);return {data:[copy(registrations[params.starting_after?1:0])],has_more:!params.starting_after};},
    listLineItems:async(id,params)=>{calls.push('lines');assert.equal(id,session.id);assert.deepEqual(Array.from(params.expand),['data.price.product','data.taxes.rate']);onLines();return {data:[copy(lines[params.starting_after?1:0])],has_more:!params.starting_after};},
    capture(){writes.push('capture');throw Error('Write prohibited');},create(){writes.push('create');throw Error('Write prohibited');},save(){writes.push('save');throw Error('Write prohibited');},
  };
  const snapshot=preflight.sealTaxPreflightSnapshot(copy(subject));
  return {subject,session,lines,intent,charge,ports,snapshot,calls,writes,setOnLines(fn){onLines=fn;},counts:()=>({subjectReads,marketReads})};
}

await test('complete paginated provider evidence binds original quote/cost/policy, but returns no execution or write permission',async()=>{
  const f=fixture(),result=await preflight.inspectTaxPreflight(f.snapshot,f.ports);
  assert.equal(result.decision,'evidence_checked_execution_locked');assert.equal(result.executionPermitted,false);assert.equal(result.paymentAction,'none');assert.equal(result.phase,'authorization');assert.equal(result.taxEvidence.phase,'authorization');assert.equal(result.taxEvidence.tax.taxMinor,12);assert.match(result.evidenceHash,/^[a-f0-9]{64}$/);assert.equal(result.subjectHash,f.snapshot.subjectHash);assert.equal(f.calls.filter(c=>c==='registrations').length,2);assert.equal(f.calls.filter(c=>c==='lines').length,2);assert.deepEqual(f.counts(),{subjectReads:2,marketReads:2});assert.equal(f.writes.length,0);assert.equal(tax.automaticTaxCheckoutImplemented,false);
});
await test('an authorized address changed to another market stops before tax/intent reads and cannot capture',async()=>{
  const f=fixture();f.session.customer_details.address.country='DE';await assert.rejects(preflight.inspectTaxPreflight(f.snapshot,f.ports),code('tax_billing_address_changed'));assert.equal(f.calls.includes('settings'),false);assert.equal(f.calls.includes('intent'),false);assert.equal(f.writes.length,0);
});
await test('an allowed country code with unresolved VAT territory does not approve a sale',async()=>{
  const f=fixture();f.ports.resolveMarket=async()=>({addressHash:f.subject.quote.addressHash,policyRevision:f.subject.policyRevision,territory:null,allowed:false});await assert.rejects(preflight.inspectTaxPreflight(f.snapshot,f.ports),code('tax_preflight_market_unconfirmed'));assert.equal(f.calls.includes('settings'),false);assert.equal(f.writes.length,0);
});
await test('cost or order revisions changed during merchant reads invalidate the sealed original without writes',async()=>{
  for(const key of ['costRevision','orderRevision']){const f=fixture(),original=JSON.stringify(f.snapshot);f.setOnLines(()=>{f.subject[key]='isolated-new-version';});await assert.rejects(preflight.inspectTaxPreflight(f.snapshot,f.ports),code('tax_preflight_snapshot_changed'));assert.equal(JSON.stringify(f.snapshot),original);assert.equal(f.writes.length,0);}
});
await test('mutating the caller snapshot during awaits cannot rebind old provider evidence to newer costs',async()=>{
  const f=fixture();f.setOnLines(()=>{f.subject.costRevision='isolated-new-cost';f.snapshot.subjectHash=preflight.sealTaxPreflightSnapshot(f.subject).subjectHash;});await assert.rejects(preflight.inspectTaxPreflight(f.snapshot,f.ports),code('tax_preflight_snapshot_changed'));assert.equal(f.writes.length,0);
});
await test('a policy resolver changed during the same review invalidates prior territory evidence',async()=>{
  const f=fixture();let calls=0;f.ports.resolveMarket=async()=>({addressHash:f.subject.quote.addressHash,policyRevision:++calls===1?f.subject.policyRevision:'different-policy',territory:'isolated-reviewed-SE',allowed:true});await assert.rejects(preflight.inspectTaxPreflight(f.snapshot,f.ports),code('tax_preflight_snapshot_changed'));assert.equal(f.writes.length,0);
});
await test('a resolver mutating the same cached object cannot rewrite the earlier market evidence',async()=>{
  const f=fixture(),cached={addressHash:f.subject.quote.addressHash,policyRevision:f.subject.policyRevision,territory:'isolated-reviewed-SE',allowed:true};let calls=0;f.ports.resolveMarket=async()=>{if(++calls>1)Object.assign(cached,{policyRevision:'changed-cache',territory:null,allowed:false});return cached;};await assert.rejects(preflight.inspectTaxPreflight(f.snapshot,f.ports),code('tax_preflight_snapshot_changed'));assert.equal(f.writes.length,0);
});
await test('insufficient, automatic, expired, wrong-mode or already captured authorizations never become a capture decision',async()=>{
  for(const mutate of [f=>f.intent.amount_capturable=198,f=>f.intent.capture_method='automatic',f=>f.charge.payment_method_details.card.capture_before=f.ports.nowSeconds()+30,f=>f.intent.livemode=true,f=>f.charge.captured=true]){const f=fixture();mutate(f);await assert.rejects(preflight.inspectTaxPreflight(f.snapshot,f.ports),code('tax_preflight_authorization_unconfirmed'));assert.equal(f.writes.length,0);}
});
await test('duplicate, stalled or unbounded merchant pages fail closed instead of silently truncating',async()=>{
  for(const mode of ['duplicate','stalled','unbounded','invalid_id']){const f=fixture();let page=0;f.ports.listRegistrations=async()=>({data:mode==='stalled'?[]:[{id:mode==='invalid_id'?123:mode==='duplicate'?'taxreg_same':'taxreg_page'+page++}],has_more:true});await assert.rejects(preflight.inspectTaxPreflight(f.snapshot,f.ports),code(mode==='unbounded'?'tax_preflight_evidence_incomplete':'tax_preflight_pagination_invalid'));assert.equal(f.writes.length,0);}
});
await test('old schema or different merchant scope blocks before provider reads; unpaid evidence cannot be a paid receipt',async()=>{
  const f=fixture();f.subject.schemaVersion=2;await assert.rejects(preflight.inspectTaxPreflight(f.snapshot,f.ports),code('tax_preflight_schema_pending'));assert.deepEqual(f.calls,['subject']);assert.equal(f.writes.length,0);
  const scoped=fixture();scoped.ports.merchantAccountId='acct_other';await assert.rejects(preflight.inspectTaxPreflight(scoped.snapshot,scoped.ports),code('tax_preflight_snapshot_changed'));assert.deepEqual(scoped.calls,['subject']);assert.throws(()=>tax.verifyAutomaticTaxReceipt(scoped.subject.quote,scoped.subject.preparation,scoped.session,{data:scoped.lines,has_more:false},false),code('tax_receipt_unconfirmed'));
});
console.log('Read-only preflight fixture boundary: no remote account, database, Tax Calculation call, payment authorization/capture/refund, entitlement, notification, build or deployment. All decisions retain executionPermitted=false; an authorization is not a paid immutable tax receipt.');
