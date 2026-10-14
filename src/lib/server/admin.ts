import { User } from './auth';
import { amount, costResult, fail, identifier, normalizeCosts, text } from './core';
import { audit, query, transaction } from './db';
import { status, stripeClient } from './commerce';
import { entitledAsset } from './delivery';
import { saveCreation } from './works';
import { requestFullRefund } from './payments';
import { confirmPrivateR2Object, privateBucket } from './private-media';

function karuuAdmin(user:User){if(!user.brands.includes('karuu'))fail(403,'brand_denied','This administrator cannot manage KARUU digital commerce.');}
export async function adminView(user:User,view:string){
  if(view==='status')return {items:[await status()]};
  if(view==='inquiries')return {items:await query('SELECT id,reference,brand,data,status,notification_status,created_at FROM commerce_inquiries WHERE brand=ANY($1::text[]) ORDER BY created_at DESC LIMIT 200',[user.brands])};
  karuuAdmin(user);
  if(view==='orders')return {items:await query('SELECT id,user_id,status,currency,total_minor,market,snapshot,refunded_minor,created_at FROM commerce_orders ORDER BY created_at DESC LIMIT 200')};
  if(view==='catalog')return {items:await query('SELECT * FROM commerce_skus ORDER BY updated_at DESC')};
  if(view==='works')return {items:await query('SELECT slug,publication_status,data,updated_at FROM commerce_creations ORDER BY updated_at DESC')};
  if(view==='assets')return {items:await query('SELECT * FROM commerce_assets ORDER BY updated_at DESC')};
  if(view==='audit')return {items:await query('SELECT id,actor_id,action,target,reason,detail,created_at FROM commerce_audit ORDER BY created_at DESC LIMIT 200')};
  if(view==='costs'){
    const rows=await query('SELECT c.*,s.price_minor,s.currency FROM commerce_costs c JOIN commerce_skus s ON s.id=c.sku_id');
    return {items:rows.map(row=>({...row,calculation:costResult(row.price_minor,normalizeCosts(row.inputs))}))};
  }
  if(view==='kru')return {items:await query('SELECT id,user_id,order_id,state,network,mint,units,transaction_signature,created_at FROM commerce_kru_records ORDER BY created_at DESC LIMIT 200')};
  if(view==='points')return {items:await query('SELECT * FROM commerce_point_ledger ORDER BY created_at DESC LIMIT 200')};
  fail(400,'invalid_view','Choose an available administration view.');
}
function object(input:unknown):Record<string,unknown>{if(!input||typeof input!=='object'||Array.isArray(input))fail(400,'invalid_object','Provide a structured object.');return input as Record<string,unknown>;}
function validatedSku(input:unknown){
  const value=object(input),id=identifier(value.id),slug=identifier(value.slug),title=text(value.title,300);
  if(!title||!['ebook','audiobook','bundle','music','game'].includes(text(value.kind))||!['draft','active','archived'].includes(text(value.status)))fail(400,'invalid_sku','Provide a title, supported format and publication status.');
  const currency=text(value.currency,3).toUpperCase();if(!['SEK','EUR','USD','GBP'].includes(currency))fail(400,'unsupported_currency','Configure a supported two-decimal currency.');
  const price=amount(value.normalPriceMinor??value.priceMinor,true);if(price===0)fail(400,'invalid_price','A sale price must be greater than zero.');
  const markets=value.markets;if(!Array.isArray(markets)||markets.some(m=>typeof m!=='string'||!/^[A-Z]{2}$/.test(m)))fail(400,'invalid_markets','Use an explicit list of ISO billing-country codes.');
  const components=value.components;if(!Array.isArray(components)||!components.length||components.length>100)fail(400,'invalid_components','List the exact assets included in this product.');
  const normalized=components.map(c=>{const v=object(c);return {assetId:identifier(v.assetId),allocationBps:amount(v.allocationBps)!};});
  if(new Set(normalized.map(c=>c.assetId)).size!==normalized.length||normalized.some(c=>!c.allocationBps)||normalized.reduce((sum,c)=>sum+c.allocationBps,0)!==10000)fail(400,'invalid_components','Each asset must appear once and allocations must total 10000 basis points.');
  const tax=object(value.taxByMarket??{}),upgrades=object(value.upgradePrices??{});
  for(const [country,rateSet] of Object.entries(tax)){
    if(!markets.includes(country))fail(400,'invalid_tax_market','Tax settings must belong to an allowed billing market.');
    for(const [assetId,rateData] of Object.entries(object(rateSet))){const rate=object(rateData);if(!normalized.some(c=>c.assetId===assetId)||typeof rate.rate!=='number'||!Number.isFinite(rate.rate)||rate.rate<0||rate.rate>=1||!/^txr_[a-zA-Z0-9]+$/.test(text(rate.stripeTaxRateId)))fail(400,'invalid_tax','Provide the applicable rate and real inclusive Stripe tax-rate identifier per component.');}
  }
  for(const [owned,upgrade] of Object.entries(upgrades)){const ids=owned.split(',');if(ids.join(',')!==[...ids].sort().join(',')||ids.length>=normalized.length||ids.some(assetId=>!normalized.some(c=>c.assetId===assetId))||new Set(ids).size!==ids.length)fail(400,'invalid_upgrade','Upgrade keys must list an exact, sorted subset of owned component asset identifiers.');amount(upgrade);if((upgrade as number)<=0)fail(400,'invalid_upgrade','An upgrade price must be positive.');}
  const date=(v:unknown)=>{if(v==null||v==='')return null;const s=text(v,50);if(!Number.isFinite(Date.parse(s)))fail(400,'invalid_date','Use an ISO date for the sale window.');return s;};
  const start=date(value.saleStart),end=date(value.saleEnd);if(start&&end&&Date.parse(end)<=Date.parse(start))fail(400,'invalid_date','The sale end must follow its start.');
  const promotionPrice=amount(value.promotionPriceMinor,true),promotionStart=date(value.promotionStart),promotionEnd=date(value.promotionEnd);
  if(promotionPrice!=null&&(!promotionStart||!promotionEnd||Date.parse(promotionEnd)<=Date.parse(promotionStart)||promotionPrice<=0||price==null||promotionPrice>=price))fail(400,'invalid_promotion','An activity price needs a lower confirmed normal price and a valid, explicit start and end.');
  return {id,slug,title,kind:value.kind,status:value.status,currency,price,rights:value.rightsVerified===true,markets,components:normalized,tax,upgrades,start,end,promotionPrice,promotionStart,promotionEnd};
}
export async function adminAction(user:User,input:Record<string,unknown>){
  const action=text(input.action,60),reason=text(input.reason,1000);if(reason.length<10)fail(400,'reason_required','Record a reason of at least 10 characters for this operation.');
  if(action==='update_inquiry'){
    const id=text(input.id,40),state=text(input.status,30);if(!['received','in_progress','closed'].includes(state))fail(400,'invalid_status','Choose a valid inquiry status.');
    return transaction(async client=>{
      const row=(await client.query('SELECT brand FROM commerce_inquiries WHERE id=$1 FOR UPDATE',[id])).rows[0];
      if(!row||!user.brands.includes(row.brand))fail(404,'inquiry_not_found','No inquiry exists in this administrator’s permitted brands.');
      await client.query('UPDATE commerce_inquiries SET status=$1 WHERE id=$2',[state,id]);await audit(client,user.id,action,id,reason,{brand:row.brand,status:state});return {updated:true,id};
    });
  }
  karuuAdmin(user);
  if(action==='save_creation')return saveCreation(user,input,reason);
  if(action==='save_asset'){
    const asset=object(input.asset),id=identifier(asset.id),slug=identifier(asset.workSlug),format=text(asset.format,30).toLowerCase(),key=text(asset.objectKey,1000);
    const version=text(asset.editionVersion,100)||'1',digest=text(asset.contentSha256,64)||null;
    if((digest&&!/^[a-f0-9]{64}$/.test(digest))||(asset.deliveryVerified===true&&!digest))fail(400,'file_digest_required','Verified delivery requires the real file SHA-256 digest.');
    if(!text(asset.title)||!text(asset.language)||!['epub','pdf','mp3','m4a','flac','zip'].includes(format)||!key||key.startsWith('/')||key.split('/').some(p=>!p||p==='.'||p==='..')||/[?#\\]/.test(key))fail(400,'invalid_asset','Provide a verified asset format, language and private object key.');
    if(asset.deliveryVerified===true&&process.env.KARUU_PRIVATE_MEDIA_PROVIDER==='r2'){
      const store=await privateBucket();if(!store)fail(503,'delivery_not_configured','The actual private R2 binding is required to confirm delivery.');
      await confirmPrivateR2Object(store,key,digest!);
    }
    return transaction(async client=>{
      await client.query('LOCK TABLE commerce_assets IN SHARE ROW EXCLUSIVE MODE');
      const old=(await client.query('SELECT * FROM commerce_assets WHERE id=$1 FOR UPDATE',[id])).rows[0];
      if((await client.query('SELECT id FROM commerce_assets WHERE object_key=$1 AND id<>$2 LIMIT 1',[key,id])).rows.length)fail(409,'object_key_in_use','Another edition already uses this private object key.');
      const committed=old&&(await client.query('SELECT id FROM commerce_orders WHERE snapshot @> $1::jsonb LIMIT 1',[JSON.stringify([{components:[{assetId:id}]}])])).rows.length>0;
      if(committed&&(old.work_slug!==slug||old.format!==format||old.language!==text(asset.language,50)||old.edition_version!==version||(old.content_sha256&&old.content_sha256!==digest)||(old.object_key!==key&&(!old.content_sha256||old.content_sha256!==digest))))fail(409,'edition_immutable','A quoted or purchased edition cannot be replaced by another work, language, format, version or file. Create a new asset ID. A storage repair must retain the verified content digest.');
      await client.query(`INSERT INTO commerce_assets(id,work_slug,title,format,language,object_key,rights_verified,delivery_verified,edition_version,content_sha256) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      ON CONFLICT(id) DO UPDATE SET work_slug=EXCLUDED.work_slug,title=EXCLUDED.title,format=EXCLUDED.format,language=EXCLUDED.language,object_key=EXCLUDED.object_key,rights_verified=EXCLUDED.rights_verified,delivery_verified=EXCLUDED.delivery_verified,edition_version=EXCLUDED.edition_version,content_sha256=EXCLUDED.content_sha256,updated_at=now()`,[id,slug,text(asset.title,300),format,text(asset.language,50),key,asset.rightsVerified===true,asset.deliveryVerified===true,version,digest]);await audit(client,user.id,action,id,reason,{workSlug:slug,format,version});return {saved:true,id};});
  }
  if(action==='save_sku'){
    const sku=validatedSku(input.sku);
    return transaction(async client=>{
      const assets=await client.query('SELECT id FROM commerce_assets WHERE id=ANY($1::text[])',[sku.components.map(c=>c.assetId)]);
      if(assets.rows.length!==sku.components.length)fail(400,'assets_required','Create every included asset before saving its product.');
      await client.query(`INSERT INTO commerce_skus(id,slug,title,kind,status,currency,price_minor,rights_verified,markets,components,tax_by_market,upgrade_prices,sale_start,sale_end) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
        ON CONFLICT(id) DO UPDATE SET slug=EXCLUDED.slug,title=EXCLUDED.title,kind=EXCLUDED.kind,status=EXCLUDED.status,currency=EXCLUDED.currency,price_minor=EXCLUDED.price_minor,rights_verified=EXCLUDED.rights_verified,markets=EXCLUDED.markets,components=EXCLUDED.components,tax_by_market=EXCLUDED.tax_by_market,upgrade_prices=EXCLUDED.upgrade_prices,sale_start=EXCLUDED.sale_start,sale_end=EXCLUDED.sale_end,updated_at=now()`,[sku.id,sku.slug,sku.title,sku.kind,sku.status,sku.currency,sku.price,sku.rights,sku.markets,JSON.stringify(sku.components),JSON.stringify(sku.tax),JSON.stringify(sku.upgrades),sku.start,sku.end]);
      await client.query('UPDATE commerce_skus SET promotion_price_minor=$2,promotion_start=$3,promotion_end=$4 WHERE id=$1',[sku.id,sku.promotionPrice,sku.promotionStart,sku.promotionEnd]);
      await audit(client,user.id,action,sku.id,reason,{status:sku.status,priceMinor:sku.price,currency:sku.currency,components:sku.components});return {saved:true,id:sku.id};
    });
  }
  if(action==='save_cost'){
    const id=identifier(input.skuId),cost=normalizeCosts(object(input.inputs));
    return transaction(async client=>{await client.query('INSERT INTO commerce_costs(sku_id,inputs) VALUES($1,$2) ON CONFLICT(sku_id) DO UPDATE SET inputs=EXCLUDED.inputs,updated_at=now()',[id,JSON.stringify(cost)]);await audit(client,user.id,action,id,reason,{missing:Object.entries(cost).filter(([,v])=>v==null).map(([k])=>k)});return {saved:true,id};});
  }
  if(action==='reissue_access'){
    const userId=text(input.userId,40),assetId=identifier(input.assetId);await entitledAsset({id:userId,email:'',role:'customer',brands:['karuu']},assetId);
    await transaction(client=>audit(client,user.id,action,assetId,reason,{userId}));return {reissued:true,message:'Existing access is active. The customer can generate a fresh short-term link from My creations.'};
  }
  if(action==='request_refund'){
    return requestFullRefund(user,text(input.orderId,40),reason);
  }
  if(action==='close_expired_checkout'){
    const stripe=stripeClient({existingPayments:true}),id=text(input.orderId,40);
    const existing=(await query('SELECT id,user_id,total_minor,currency,stripe_session_id,status FROM commerce_orders WHERE id=$1',[id]))[0];
    if(!existing?.stripe_session_id||existing.status!=='pending')fail(409,'checkout_not_pending','This order has no linked pending checkout.');
    const session=await stripe.checkout.sessions.retrieve(existing.stripe_session_id);
    if(session.id!==existing.stripe_session_id||session.mode!=='payment'||session.livemode!==(process.env.KARUU_PAYMENT_MODE==='live')||session.client_reference_id!==id||session.metadata?.orderId!==id||session.metadata?.userId!==existing.user_id||session.amount_total!==existing.total_minor||session.currency?.toUpperCase()!==existing.currency)fail(409,'checkout_session_mismatch','The merchant session does not match this order. Reconciliation is required.');
    if(session.status!=='expired'||session.payment_status!=='unpaid')fail(409,'checkout_not_expired','The merchant has not confirmed that this checkout is expired and unpaid.');
    return transaction(async client=>{await client.query('SELECT id FROM commerce_users WHERE id=$1 FOR UPDATE',[existing.user_id]);const current=(await client.query('SELECT stripe_session_id,status FROM commerce_orders WHERE id=$1 FOR UPDATE',[id])).rows[0];if(current?.status!=='pending'||current.stripe_session_id!==session.id)fail(409,'checkout_not_pending','This order changed during the merchant query. Check its current receipt.');await client.query("UPDATE commerce_orders SET status='cancelled',updated_at=now() WHERE id=$1",[id]);await audit(client,user.id,action,id,reason,{source:'merchant_query',sessionId:session.id});return {orderId:id,status:'cancelled'};});
  }
  fail(400,'unsupported_action','This operation is not available. KRU issuance and game credits remain disabled until their external prerequisites are verified.');
}
