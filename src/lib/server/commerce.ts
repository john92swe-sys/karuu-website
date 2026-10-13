import Stripe from 'stripe';
import { allocate, costResult, CostInputs, fail, hash, idempotency, text, uuid } from './core';
import { audit, databaseConfigured, DbClient, query, transaction } from './db';
import { User } from './auth';

export type Asset={id:string,work_slug:string,title:string,format:string,language:string,object_key:string,edition_version:string,content_sha256:string|null,rights_verified:boolean,delivery_verified:boolean};
export type Sku={id:string,slug:string,title:string,kind:string,status:string,currency:string,price_minor:number|null,promotion_price_minor:number|null,promotion_start:string|null,promotion_end:string|null,rights_verified:boolean,markets:string[],components:{assetId:string,allocationBps:number}[],tax_by_market:Record<string,Record<string,{rate:number,stripeTaxRateId:string}>>,upgrade_prices:Record<string,number>,sale_start:string|null,sale_end:string|null};
function sellingSku(sku:Sku):Sku{return sku.promotion_price_minor&&sku.promotion_start&&sku.promotion_end&&Date.parse(sku.promotion_start)<=Date.now()&&Date.parse(sku.promotion_end)>Date.now()?{...sku,price_minor:sku.promotion_price_minor}:sku;}
export type OrderSnapshot={skuId:string,title:string,priceMinor:number,components:{assetId:string,title:string,format:string,language:string,editionVersion:string,contentSha256:string,amountMinor:number,taxRate:number,stripeTaxRateId:string}[]}[];
export function mediaConfigured(){return Boolean(process.env.KARUU_PRIVATE_MEDIA_ORIGIN?.startsWith('https://') && process.env.KARUU_PRIVATE_MEDIA_TOKEN && (process.env.KARUU_DELIVERY_SIGNING_SECRET?.length??0)>=32);}
export function paymentsConfigured(){
  const live=process.env.KARUU_PAYMENT_MODE==='live';
  const launchApproved=!live||['KARUU_LIVE_COMMERCE_APPROVED','KARUU_TAX_CONFIG_APPROVED','KARUU_DISTRIBUTION_APPROVED','KARUU_LEGAL_APPROVED'].every(key=>process.env[key]==='true');
  const keyModeMatches=(live?/^(sk|rk)_live_/:/^(sk|rk)_test_/).test(process.env.STRIPE_SECRET_KEY??'');
  return Boolean(launchApproved&&keyModeMatches&&process.env.KARUU_PAYMENTS_ENABLED==='true' && process.env.STRIPE_WEBHOOK_SECRET && process.env.KARUU_SITE_ORIGIN && process.env.KARUU_TERMS_VERSION && ['test','live'].includes(process.env.KARUU_PAYMENT_MODE??''));
}
export function stripeClient(){
  if(!paymentsConfigured()) fail(503,'payments_not_configured','Direct checkout is not enabled. Verified prices, rights, files, merchant and tax settings are required.');
  const key=process.env.STRIPE_SECRET_KEY!;
  const live=process.env.KARUU_PAYMENT_MODE==='live';
  if(!(live?/^(sk|rk)_live_/:/^(sk|rk)_test_/).test(key)) fail(503,'payment_mode_mismatch','The merchant key does not match the configured payment environment.');
  return new Stripe(key,{maxNetworkRetries:2,timeout:15000,httpClient:Stripe.createFetchHttpClient()});
}
export async function status(){
  let configured=false,ready=false;
  try{configured=await databaseConfigured();}catch{configured=true;}
  if(configured) {try{ready=Boolean((await query('SELECT version FROM commerce_schema WHERE version=1'))[0]);}catch{ready=false;}}
  let publicCatalogAvailable=!configured;
  if(ready){try{await query('SELECT slug FROM commerce_creations LIMIT 1');publicCatalogAvailable=true;}catch{publicCatalogAvailable=false;}}
  return {database:ready,publicCatalogAvailable,accounts:ready&&Boolean(process.env.KARUU_MAIL_ENDPOINT&&process.env.KARUU_MAIL_TOKEN&&process.env.KARUU_SITE_ORIGIN),payments:ready&&paymentsConfigured(),privateMedia:mediaConfigured(),inquiries:ready,kru:{enabled:false,reason:'KRU requires verified market eligibility, legal approval, network, mint, budgets and controlled signing. Ordinary content purchases do not require KRU.'}};
}
export async function catalog(){
  if(!(await databaseConfigured())) return {items:[]};
  const skus=await query<Sku>('SELECT * FROM commerce_skus WHERE status=$1 ORDER BY updated_at DESC',['active']);
  const assets=await query<Asset>('SELECT * FROM commerce_assets');
  const costs=await query<{sku_id:string,inputs:CostInputs}>('SELECT sku_id,inputs FROM commerce_costs');
  return {items:skus.map(rawSku=>{const sku=sellingSku(rawSku);
    const components=sku.components.map(c=>assets.find(a=>a.id===c.assetId));
    const inputs=costs.find(c=>c.sku_id===sku.id)?.inputs;
    const marketReady=sku.markets.some(market=>{
      const taxes=sku.tax_by_market[market];if(!taxes||!sku.price_minor||!inputs||!sku.components.every(c=>typeof taxes[c.assetId]?.rate==='number'&&/^txr_/.test(taxes[c.assetId]?.stripeTaxRateId??'')))return false;
      const allocations=allocate(sku.price_minor,sku.components.map(c=>c.allocationBps));
      const effectiveTax=sku.price_minor/sku.components.reduce((sum,c,i)=>sum+allocations[i]/(1+taxes[c.assetId].rate),0)-1;
      const result=costResult(sku.price_minor,{...inputs,vatRate:effectiveTax});return result.complete&&result.targetMet;
    });
    const available=sku.rights_verified&&sku.price_minor!==null&&sku.kind!=='game'&&components.length>0&&components.every(a=>a?.rights_verified&&a?.delivery_verified)&&marketReady&&(!sku.sale_start||Date.parse(sku.sale_start)<=Date.now())&&(!sku.sale_end||Date.parse(sku.sale_end)>Date.now())&&paymentsConfigured()&&mediaConfigured();
    return {id:sku.id,slug:sku.slug,title:sku.title,kind:sku.kind,currency:sku.currency,priceMinor:available?sku.price_minor:null,normalPriceMinor:available?rawSku.price_minor:null,promotion:available&&sku.price_minor!==rawSku.price_minor,components:components.filter((a):a is Asset=>Boolean(a)).map(a=>({id:a.id,title:a.title,format:a.format,language:a.language})),available,unavailableReason:available?null:'Direct purchase is awaiting verified price, distribution rights, delivery files and merchant configuration.'};
  })};
}
async function snapshotFor(client:DbClient,skuIds:string[],user:User,market:string):Promise<OrderSnapshot> {
  const ownedRows=await client.query('SELECT DISTINCT asset_id FROM commerce_entitlements WHERE user_id=$1 AND status=$2',[user.id,'active']);
  const owned=new Set<string>(ownedRows.rows.map(row=>row.asset_id));
  const seen=new Set<string>(),snapshot:OrderSnapshot=[];
  const rows=await client.query<Sku>('SELECT * FROM commerce_skus WHERE id=ANY($1::text[]) FOR SHARE',[skuIds]);
  if(rows.rows.length!==skuIds.length) fail(503,'sku_unavailable','One or more requested products are not configured for direct sale.');
  const currencies=new Set(rows.rows.map(s=>s.currency));
  if(currencies.size!==1) fail(400,'mixed_currency','Check out products in the same currency together.');
  for(const skuId of skuIds){
    const sku=sellingSku(rows.rows.find(s=>s.id===skuId)!);
    if(sku.status!=='active'||!sku.rights_verified||!sku.price_minor||!sku.markets.includes(market)||!sku.components.length||sku.kind==='game'||(sku.sale_start&&Date.parse(sku.sale_start)>Date.now())||(sku.sale_end&&Date.parse(sku.sale_end)<Date.now())) fail(503,'sku_unavailable',`${sku.title} is not available for direct purchase in this market.`);
    const already=sku.components.filter(c=>owned.has(c.assetId)).map(c=>c.assetId).sort();
    const offered=sku.components.filter(c=>!owned.has(c.assetId));
    if(!offered.length) fail(409,'already_owned',`Your account already owns every component of ${sku.title}.`);
    let price=sku.price_minor;
    if(already.length){price=sku.upgrade_prices[already.join(',')];if(!Number.isSafeInteger(price)||price<=0) fail(409,'upgrade_not_configured','An upgrade price for the content you already own has not been configured.');}
    let weights=offered.map(c=>c.allocationBps);
    if(already.length){const sum=weights.reduce((a,b)=>a+b,0);weights=weights.map(w=>Math.floor(w*10000/sum));weights[0]+=10000-weights.reduce((a,b)=>a+b,0);}
    const allocations=allocate(price,weights),components:OrderSnapshot[number]['components']=[];
    for(let i=0;i<offered.length;i++){
      const component=offered[i];
      if(seen.has(component.assetId)) fail(409,'duplicate_content','Your bag contains the same content more than once. Choose the single item or its bundle.');
      seen.add(component.assetId);
      const assets=await client.query<Asset>('SELECT * FROM commerce_assets WHERE id=$1 FOR SHARE',[component.assetId]),asset=assets.rows[0];
      if(!asset?.rights_verified||!asset?.delivery_verified||!asset.object_key||!asset.content_sha256) fail(503,'delivery_not_ready','The distribution rights or delivery file have not been verified.');
      const tax=sku.tax_by_market[market]?.[asset.id];
      if(!tax || typeof tax.rate!=='number'||tax.rate<0||tax.rate>=1||!/^txr_/.test(tax.stripeTaxRateId)) fail(503,'tax_not_configured','The applicable component tax treatment has not been configured.');
      components.push({assetId:asset.id,title:asset.title,format:asset.format,language:asset.language,editionVersion:asset.edition_version,contentSha256:asset.content_sha256,amountMinor:allocations[i],taxRate:tax.rate,stripeTaxRateId:tax.stripeTaxRateId});
    }
    const costRows=await client.query<{inputs:CostInputs}>('SELECT inputs FROM commerce_costs WHERE sku_id=$1',[sku.id]);
    if(!costRows.rows[0]) fail(503,'costs_incomplete','The cost and pricing inputs require verification before checkout.');
    const effectiveTax=price/components.reduce((sum,c)=>sum+c.amountMinor/(1+c.taxRate),0)-1;
    const result=costResult(price,{...costRows.rows[0].inputs,vatRate:effectiveTax});
    if(!result.complete||result.minimumPriceMinor!>price||!result.targetMet) fail(503,'pricing_not_approved','Complete costs and the configured minimum surplus must be satisfied before checkout.');
    snapshot.push({skuId:sku.id,title:sku.title,priceMinor:price,components});
  }
  return snapshot;
}
export async function checkout(user:User,input:Record<string,unknown>,keyValue:unknown){
  const stripe=stripeClient();
  if(!mediaConfigured()) fail(503,'delivery_not_configured','Private content delivery is not configured.');
  if(input.immediateDeliveryConsent!==true) fail(400,'delivery_consent_required','Confirm the disclosed immediate digital-content delivery terms before paying.');
  const key=idempotency(keyValue),market=text(input.market,2).toUpperCase();
  if(!/^[A-Z]{2}$/.test(market)) fail(400,'market_required','Select the actual billing country.');
  const skuIds=input.skuIds;
  if(!Array.isArray(skuIds)||!skuIds.length||skuIds.length>10||skuIds.some(x=>typeof x!=='string')||new Set(skuIds).size!==skuIds.length) fail(400,'invalid_bag','Choose between one and ten distinct configured products.');
  const digest=hash(JSON.stringify({skuIds:[...skuIds].sort(),market,consentVersion:process.env.KARUU_TERMS_VERSION}));
  const order=await transaction(async client=>{
    // A per-account lock serializes quote creation and overlapping pending purchases.
    await client.query('SELECT id FROM commerce_users WHERE id=$1 FOR UPDATE',[user.id]);
    const old=await client.query('SELECT * FROM commerce_orders WHERE user_id=$1 AND idempotency_key=$2 FOR UPDATE',[user.id,key]);
    if(old.rows[0]){if(old.rows[0].request_hash!==digest)fail(409,'idempotency_conflict','This checkout key was already used for another bag.');return old.rows[0];}
    const snapshot=await snapshotFor(client,skuIds,user,market),assetIds=snapshot.flatMap(s=>s.components.map(c=>c.assetId));
    const pending=await client.query(`SELECT id,snapshot FROM commerce_orders WHERE user_id=$1 AND status IN ('pending','review','refund_pending')`,[user.id]);
    if(pending.rows.some(row=>(row.snapshot as OrderSnapshot).some(item=>item.components.some(c=>assetIds.includes(c.assetId))))) fail(409,'checkout_pending','A checkout or payment review for this content is already open. View your orders or contact support before starting another payment.');
    const id=uuid(),total=snapshot.reduce((sum,item)=>sum+item.priceMinor,0);
    const currency=(await client.query('SELECT currency FROM commerce_skus WHERE id=$1',[skuIds[0]])).rows[0].currency;
    const result=await client.query(`INSERT INTO commerce_orders(id,user_id,idempotency_key,request_hash,status,currency,total_minor,market,snapshot,consent_version,consent_at)
      VALUES($1,$2,$3,$4,'pending',$5,$6,$7,$8,$9,now()) RETURNING *`,[id,user.id,key,digest,currency,total,market,JSON.stringify(snapshot),process.env.KARUU_TERMS_VERSION]);
    await audit(client,user.id,'checkout_created',id,'Customer requested direct purchase',{skuIds,market,totalMinor:total,currency});return result.rows[0];
  });
  if(order.status!=='pending') return {orderId:order.id,url:null,status:order.status};
  if(order.checkout_url) return {orderId:order.id,url:order.checkout_url,status:'pending'};
  const snapshot=order.snapshot as OrderSnapshot;
  // Confirm merchant tax-rate objects rather than trusting a staff-entered identifier.
  for(const item of snapshot)for(const component of item.components){
    const rate=await stripe.taxRates.retrieve(component.stripeTaxRateId);
    if(!rate.active||!rate.inclusive||Math.abs((rate.percentage??-1)/100-component.taxRate)>0.000001||rate.country!==market) fail(503,'tax_configuration_mismatch','The configured tax rate does not match the merchant tax setting and billing market.');
  }
  const params:Stripe.Checkout.SessionCreateParams={mode:'payment',customer_email:user.email,billing_address_collection:'required',client_reference_id:order.id,
    metadata:{orderId:order.id,userId:user.id},payment_intent_data:{metadata:{orderId:order.id}},
    success_url:`${process.env.KARUU_SITE_ORIGIN}/account?checkout=return&order=${order.id}`,cancel_url:`${process.env.KARUU_SITE_ORIGIN}/bag?checkout=cancel`,
    line_items:snapshot.flatMap(item=>item.components.map(component=>({quantity:1,tax_rates:[component.stripeTaxRateId],price_data:{currency:order.currency.toLowerCase(),unit_amount:component.amountMinor,tax_behavior:'inclusive',product_data:{name:`${item.title} — ${component.format} (${component.language})`,metadata:{assetId:component.assetId}}}})))};
  // SDK defaults to its current API version; random-letter suffix is stable per order.
  const letters=order.id.replace(/-/g,'').slice(0,8).split('').map((x:string)=>String.fromCharCode(97+parseInt(x,16))).join('');
  params.integration_identifier=`karuu_creative_store_${letters}`;
  const session=await stripe.checkout.sessions.create(params,{idempotencyKey:`checkout-${order.id}`});
  if(session.livemode!==(process.env.KARUU_PAYMENT_MODE==='live')) fail(503,'payment_mode_mismatch','The payment session has an unexpected mode.');
  await query('UPDATE commerce_orders SET stripe_session_id=$1,checkout_url=$2,updated_at=now() WHERE id=$3',[session.id,session.url,order.id]);
  return {orderId:order.id,url:session.url,status:'pending'};
}
export async function orders(user:User){
  const rows=await query('SELECT id,status,currency,total_minor,created_at,snapshot FROM commerce_orders WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100',[user.id]);
  return {orders:rows.map(row=>({id:row.id,status:row.status,currency:row.currency,totalMinor:row.total_minor,createdAt:row.created_at,items:(row.snapshot as OrderSnapshot).map(item=>({title:item.title,components:item.components.map(c=>c.assetId)}))}))};
}
export async function library(user:User){
  const rows=await query(`SELECT e.asset_id,e.order_id,e.status,a.title,a.format,a.language FROM commerce_entitlements e JOIN commerce_assets a ON a.id=e.asset_id WHERE e.user_id=$1 ORDER BY e.granted_at DESC`,[user.id]);
  return {items:rows.map(row=>({assetId:row.asset_id,title:row.title,format:row.format,language:row.language,orderId:row.order_id,status:row.status}))};
}
