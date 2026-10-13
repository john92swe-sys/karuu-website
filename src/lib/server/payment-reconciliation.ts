import Stripe from 'stripe';
import { fail, uuid } from './core';
import { audit, DbClient, query, transaction } from './db';
import { OrderSnapshot, stripeClient } from './commerce';
import { User } from './auth';

type PaymentOrder={id:string,user_id:string,status:string,currency:string,total_minor:number,market:string,snapshot:OrderSnapshot,stripe_session_id:string|null,stripe_payment_intent:string|null,refunded_minor:number,receipt_version:string};
type PaymentState={session:Stripe.Checkout.Session,intent:Stripe.PaymentIntent,charge:Stripe.Charge,refunds:Stripe.Refund[],confirmedMinor:number,pending:boolean,failed:boolean};
const objectId=(value:string|{id:string}|null|undefined)=>typeof value==='string'?value:value?.id;
const live=()=>process.env.KARUU_PAYMENT_MODE==='live';
function validateSession(order:PaymentOrder,session:Stripe.Checkout.Session){
 if(session.livemode!==live()||session.mode!=='payment')fail(400,'payment_mode_mismatch','The merchant session has an unexpected payment mode.');
 if(order.stripe_session_id&&order.stripe_session_id!==session.id)fail(409,'session_not_bound','This order is already linked to another merchant session.');
 if(session.client_reference_id!==order.id||session.metadata?.orderId!==order.id||session.metadata?.userId!==order.user_id)fail(400,'order_identity_mismatch','The merchant session does not match the immutable order account.');
 if(session.amount_total!==order.total_minor||session.currency?.toUpperCase()!==order.currency)fail(400,'payment_amount_mismatch','The payment amount or currency does not match the immutable order.');
}
async function allRefunds(stripe:Stripe,intentId:string){
 const refunds:Stripe.Refund[]=[];let after:string|undefined;
 for(let page=0;page<20;page++){
  const result=await stripe.refunds.list({payment_intent:intentId,limit:100,...(after?{starting_after:after}:{})});refunds.push(...result.data);
  if(!result.has_more)return refunds;const next=result.data.at(-1)?.id;if(!next||next===after)break;after=next;
 }
 return fail(503,'refund_history_unconfirmed','The complete merchant refund history requires reconciliation before access can change.');
}
async function inspectPayment(order:PaymentOrder,stripe:Stripe,sessionHint?:Stripe.Checkout.Session,intentHint?:Stripe.PaymentIntent):Promise<PaymentState>{
 let session=sessionHint;
 if(!session&&order.stripe_session_id)session=await stripe.checkout.sessions.retrieve(order.stripe_session_id);
 if(!session){
  const intentId=intentHint?.id??order.stripe_payment_intent;if(!intentId)fail(409,'payment_binding_unconfirmed','Reconcile the original merchant session before changing this payment.');
  const matches=await stripe.checkout.sessions.list({payment_intent:intentId,limit:2});if(matches.has_more||matches.data.length!==1)fail(409,'payment_binding_unconfirmed','The original merchant session must be identified unambiguously.');session=matches.data[0];
 }
 validateSession(order,session);
 const intentId=objectId(session.payment_intent);if(!intentId)fail(409,'payment_intent_unconfirmed','The merchant payment intent is not yet confirmed.');
 if(order.stripe_payment_intent&&order.stripe_payment_intent!==intentId)fail(400,'payment_intent_mismatch','The payment intent differs from the recorded receipt.');
 const intent=intentHint??await stripe.paymentIntents.retrieve(intentId,{expand:['latest_charge']});
 if(intent.id!==intentId||intent.livemode!==live()||intent.metadata.orderId!==order.id||intent.currency.toUpperCase()!==order.currency||intent.amount!==order.total_minor)fail(400,'payment_intent_mismatch','The merchant payment intent does not match the order.');
 const charge=typeof intent.latest_charge==='string'?await stripe.charges.retrieve(intent.latest_charge):intent.latest_charge;
 if(session.payment_status!=='paid'||intent.status!=='succeeded'||intent.amount_received!==order.total_minor||!charge?.paid||!charge.captured||charge.amount_captured!==order.total_minor)fail(409,'payment_capture_unconfirmed','The full merchant payment has not been captured.');
 if(charge.livemode!==live()||objectId(charge.payment_intent)!==intentId||charge.currency.toUpperCase()!==order.currency||charge.amount!==order.total_minor)fail(400,'charge_order_mismatch','The captured charge does not match the immutable order.');
 const refunds=await allRefunds(stripe,intentId);
 if(refunds.some(refund=>objectId(refund.payment_intent)!==intentId||objectId(refund.charge)!==charge.id||refund.currency.toUpperCase()!==order.currency||!Number.isSafeInteger(refund.amount)||refund.amount<=0||!['succeeded','pending','requires_action','failed','canceled'].includes(refund.status??'')))fail(409,'refund_state_unconfirmed','The merchant refund history is inconsistent or incomplete.');
 const confirmedMinor=refunds.filter(refund=>refund.status==='succeeded').reduce((sum,refund)=>sum+refund.amount,0);if(confirmedMinor>order.total_minor)fail(409,'refund_state_unconfirmed','The confirmed refunds exceed the captured order amount.');
 return {session,intent,charge,refunds,confirmedMinor,pending:refunds.some(refund=>['pending','requires_action'].includes(refund.status??'')),failed:refunds.some(refund=>['failed','canceled'].includes(refund.status??''))};
}
async function lockOrder(client:DbClient,order:PaymentOrder){
 await client.query('SELECT id FROM commerce_users WHERE id=$1 FOR UPDATE',[order.user_id]);const locked=(await client.query<PaymentOrder>('SELECT *,updated_at::text AS receipt_version FROM commerce_orders WHERE id=$1 FOR UPDATE',[order.id])).rows[0];if(!locked)fail(409,'order_not_found','The linked order is not present. Reconciliation is required.');return locked;
}
function assertReceiptUnchanged(before:PaymentOrder,after:PaymentOrder){
 // Compare PostgreSQL text, preserving sub-millisecond timestamp precision.
 // Both increasing refunds and a legitimate later failed refund invalidate an
 // earlier merchant snapshot. Equal totals with a newer state also need retry.
 if(before.receipt_version!==after.receipt_version)fail(409,'refund_receipt_stale','The order changed while merchant resources were retrieved. Retry reconciliation against its current receipt.');
}
async function assertRefundFreshness(client:DbClient,order:PaymentOrder,state:PaymentState){
 if(state.confirmedMinor>=order.refunded_minor)return;
 // Merchant calls precede this row lock. An older response must not overwrite a
 // newer confirmed refund. A later bank failure may legitimately reduce the
 // successful total, but only a previously confirmed refund can explain it.
 const previous=(await client.query<{detail:{refundIds?:string[],refunds?:{id:string,status:string}[]}}>("SELECT detail FROM commerce_audit WHERE target=$1 AND action IN ('refund_confirmed','refund_pending','refund_failed','partial_refund_review') AND (detail ? 'refundIds' OR detail ? 'refunds') ORDER BY created_at DESC,id DESC LIMIT 1",[order.id])).rows[0];
 const confirmedIds=new Set(previous?.detail.refundIds??previous?.detail.refunds?.filter(r=>r.status==='succeeded').map(r=>r.id)??[]);
 const returnedMinor=state.refunds.filter(r=>confirmedIds.has(r.id)&&['failed','canceled'].includes(r.status??'')).reduce((sum,r)=>sum+r.amount,0);
 if(returnedMinor<order.refunded_minor-state.confirmedMinor)fail(409,'refund_receipt_stale','A newer confirmed refund exists. Retry merchant reconciliation before changing this order.');
}
async function reconcileRefundState(client:DbClient,order:PaymentOrder,state:PaymentState,actor:string|null,source:object){
 if(state.confirmedMinor===order.total_minor){
  await client.query("UPDATE commerce_orders SET refunded_minor=$2,status='refunded',updated_at=now() WHERE id=$1",[order.id,state.confirmedMinor]);await client.query("UPDATE commerce_entitlements SET status='revoked' WHERE order_id=$1",[order.id]);await client.query("UPDATE commerce_kru_records SET state='cancelled' WHERE order_id=$1 AND state IN ('eligibility_pending','pending','retry')",[order.id]);
  await audit(client,actor,'refund_confirmed',order.id,'Authenticated merchant refund resources confirm the full cumulative refund',{...source,refundedMinor:state.confirmedMinor,refundIds:state.refunds.filter(r=>r.status==='succeeded').map(r=>r.id)});return {received:true,refunded:true};
 }
 if(state.pending||state.confirmedMinor>0||state.failed){
  const status=state.pending?'refund_pending':'review';await client.query('UPDATE commerce_orders SET refunded_minor=$2,status=$3,updated_at=now() WHERE id=$1',[order.id,state.confirmedMinor,status]);await client.query("UPDATE commerce_kru_records SET state='cancelled' WHERE order_id=$1 AND state IN ('eligibility_pending','pending','retry')",[order.id]);await audit(client,actor,state.pending?'refund_pending':state.failed?'refund_failed':'partial_refund_review',order.id,'Authenticated merchant refund state needs operator review; no new access was granted',{...source,confirmedMinor:state.confirmedMinor,refunds:state.refunds.map(r=>({id:r.id,status:r.status,amountMinor:r.amount,requestKey:r.metadata?.requestKey}))});return {received:true,reviewRequired:status==='review',refundPending:state.pending};
 }
 return null;
}
export async function processPaymentEvent(event:Stripe.Event){
 if(event.livemode!==live())fail(400,'event_mode_mismatch','The event belongs to a different payment environment.');
 if(!['checkout.session.completed','checkout.session.async_payment_succeeded','checkout.session.async_payment_failed','checkout.session.expired','charge.refunded','refund.created','refund.updated','refund.failed'].includes(event.type))return {received:true,ignored:true};
 const stripe=stripeClient({existingPayments:true});let session:Stripe.Checkout.Session|undefined,intent:Stripe.PaymentIntent|undefined,charge:Stripe.Charge|undefined,refund:Stripe.Refund|undefined;
 if(event.type.startsWith('checkout.session.'))session=await stripe.checkout.sessions.retrieve((event.data.object as Stripe.Checkout.Session).id);
 else{
  if(event.type==='charge.refunded')charge=await stripe.charges.retrieve((event.data.object as Stripe.Charge).id);else refund=await stripe.refunds.retrieve((event.data.object as Stripe.Refund).id);
  let intentId=objectId(charge?.payment_intent??refund?.payment_intent);if(!intentId&&refund?.charge){charge=await stripe.charges.retrieve(objectId(refund.charge)!);intentId=objectId(charge.payment_intent);}if(!intentId)return {received:true,ignored:true};intent=await stripe.paymentIntents.retrieve(intentId,{expand:['latest_charge']});
 }
 const orderId=session?.metadata?.orderId??intent?.metadata.orderId;if(!orderId)return {received:true,ignored:true};
 const hint=(await query<PaymentOrder>('SELECT *,updated_at::text AS receipt_version FROM commerce_orders WHERE id=$1',[orderId]))[0];if(!hint)fail(409,'order_not_found','The linked order is not present. Retry after reconciliation.');if(session)validateSession(hint,session);
 const state=session?.payment_status==='unpaid'&&event.type.startsWith('checkout.session.')?undefined:await inspectPayment(hint,stripe,session,intent);
 if(state){session=state.session;if((charge&&charge.id!==state.charge.id)||(refund&&objectId(refund.charge)!==state.charge.id))fail(400,'refund_order_mismatch','This refund belongs to a different captured charge.');}const currentSession=session!;
 return transaction(async client=>{
  const inserted=await client.query('INSERT INTO commerce_payment_events(id,type,object_id) VALUES($1,$2,$3) ON CONFLICT DO NOTHING RETURNING id',[event.id,event.type,refund?.id??charge?.id??currentSession.id]);if(!inserted.rows.length)return {received:true,duplicate:true};
  const order=await lockOrder(client,hint);assertReceiptUnchanged(hint,order);validateSession(order,currentSession);const intentId=objectId(currentSession.payment_intent);if(order.stripe_payment_intent&&intentId&&order.stripe_payment_intent!==intentId)fail(400,'payment_intent_mismatch','The merchant payment intent differs from the recorded receipt.');
  // Recover a successful merchant create whose response/DB binding was lost.
  // Verified metadata, mode, amount and currency prevent another order binding.
  await client.query('UPDATE commerce_orders SET stripe_session_id=$2,stripe_payment_intent=COALESCE(stripe_payment_intent,$3),updated_at=now() WHERE id=$1',[order.id,currentSession.id,intentId??null]);
  if(!state){
   if(event.type==='checkout.session.async_payment_failed'&&order.status==='pending')await client.query("UPDATE commerce_orders SET status='failed',updated_at=now() WHERE id=$1",[order.id]);else if(event.type==='checkout.session.expired'&&currentSession.status==='expired'&&order.status==='pending')await client.query("UPDATE commerce_orders SET status='cancelled',updated_at=now() WHERE id=$1",[order.id]);return {received:true,unpaid:true};
  }
  await assertRefundFreshness(client,order,state);
  const reconciled=await reconcileRefundState(client,order,state,null,{eventId:event.id});if(reconciled)return reconciled;
  if(['refunded','refund_pending','review'].includes(order.status))return {received:true,fulfillmentSkipped:true};
  if(currentSession.customer_details?.address?.country!==order.market){await client.query("UPDATE commerce_orders SET status='review',updated_at=now() WHERE id=$1",[order.id]);await audit(client,null,'payment_market_review',order.id,'Verified billing country differs from quoted tax market',{quotedMarket:order.market});return {received:true,reviewRequired:true};}
  if(order.status==='paid')return {received:true,alreadyFulfilled:true};
  const assetIds=order.snapshot.flatMap(item=>item.components.map(component=>component.assetId)),other=await client.query("SELECT asset_id FROM commerce_entitlements WHERE user_id=$1 AND asset_id=ANY($2::text[]) AND order_id<>$3 AND status='active' LIMIT 1",[order.user_id,assetIds,order.id]);
  if(other.rows.length){await client.query("UPDATE commerce_orders SET status='review',updated_at=now() WHERE id=$1",[order.id]);await audit(client,null,'duplicate_paid_content_review',order.id,'Another receipt already grants this exact content',{eventId:event.id});return {received:true,reviewRequired:true};}
  for(const assetId of assetIds)await client.query("INSERT INTO commerce_entitlements(user_id,asset_id,order_id,status) VALUES($1,$2,$3,'active') ON CONFLICT DO NOTHING",[order.user_id,assetId,order.id]);await client.query("UPDATE commerce_orders SET status='paid',updated_at=now() WHERE id=$1",[order.id]);await audit(client,null,'payment_fulfilled',order.id,'Signed event and current captured merchant receipt confirm unrefunded payment',{eventId:event.id,assetIds});return {received:true};
 });
}

export async function requestFullRefund(user:User,id:string,reason:string){
 const stripe=stripeClient({existingPayments:true}),hint=(await query<PaymentOrder>('SELECT *,updated_at::text AS receipt_version FROM commerce_orders WHERE id=$1',[id]))[0];if(!hint)fail(409,'refund_unavailable','This order has no confirmed refundable payment.');const state=await inspectPayment(hint,stripe);
 if(state.confirmedMinor===hint.total_minor||state.pending){
  await transaction(async client=>{const row=await lockOrder(client,hint);assertReceiptUnchanged(hint,row);validateSession(row,state.session);await assertRefundFreshness(client,row,state);await client.query('UPDATE commerce_orders SET stripe_session_id=$2,stripe_payment_intent=COALESCE(stripe_payment_intent,$3),updated_at=now() WHERE id=$1',[id,state.session.id,state.intent.id]);await reconcileRefundState(client,row,state,user.id,{operatorReconciliation:true,reason});});
  return {orderId:id,status:state.confirmedMinor===hint.total_minor?'refunded':'refund_pending',providerStatus:state.confirmedMinor===hint.total_minor?'succeeded':'pending',message:'The existing merchant refund was reconciled. No second refund was created.'};
 }
 const attempt=await transaction(async client=>{
  const row=await lockOrder(client,hint);assertReceiptUnchanged(hint,row);validateSession(row,state.session);await assertRefundFreshness(client,row,state);if(!['paid','refund_pending','review'].includes(row.status))fail(409,'refund_unavailable','This order has no confirmed refundable payment.');
  const previous=(await client.query<{detail:{requestKey?:string,amountMinor?:number},created_at:string}>('SELECT detail,created_at FROM commerce_audit WHERE target=$1 AND action=$2 ORDER BY created_at DESC,id DESC LIMIT 1',[id,'request_refund'])).rows[0];
  const amountMinor=row.total_minor-state.confirmedMinor,oldRefund=state.refunds.find(r=>r.metadata?.requestKey===previous?.detail.requestKey);let requestKey=previous?.detail.requestKey;
  if(requestKey&&!oldRefund&&(previous.detail.amountMinor!==amountMinor||Date.now()-new Date(previous.created_at).getTime()>23*3600000))fail(409,'refund_recovery_required','Reconcile the original refund request before submitting another debit.');
  if(!requestKey||oldRefund&&['failed','canceled'].includes(oldRefund.status??'')){requestKey=`full-refund-${id}-${uuid()}`;await audit(client,user.id,'request_refund',id,reason,{amountMinor,requestKey});}else if(oldRefund)fail(409,'refund_recovery_required','Reconcile the existing merchant refund before changing its amount.');
  const saved=(await client.query<{receipt_version:string}>("UPDATE commerce_orders SET status='refund_pending',refunded_minor=$2,stripe_payment_intent=$3,stripe_session_id=$4,updated_at=now() WHERE id=$1 RETURNING updated_at::text AS receipt_version",[id,state.confirmedMinor,state.intent.id,state.session.id])).rows[0];await client.query("UPDATE commerce_kru_records SET state='cancelled' WHERE order_id=$1 AND state IN ('eligibility_pending','pending','retry')",[id]);return {requestKey:requestKey!,amountMinor,receiptVersion:saved.receipt_version};
 });
 let refund:Stripe.Refund;
 try{refund=await stripe.refunds.create({payment_intent:state.intent.id,amount:attempt.amountMinor,metadata:{orderId:id,requestKey:attempt.requestKey}},{idempotencyKey:attempt.requestKey});}
 catch{await recordRefundProblem('refund_request_unconfirmed','Provider response is unknown; retry preserves the original request key');return fail(503,'refund_request_unconfirmed','The refund request response is unconfirmed. Check the current order receipt or safely retry its original request.');}
 if(objectId(refund.payment_intent)!==state.intent.id||objectId(refund.charge)!==state.charge.id||refund.currency.toUpperCase()!==hint.currency||refund.amount!==attempt.amountMinor||refund.metadata?.orderId!==id||refund.metadata?.requestKey!==attempt.requestKey||!['succeeded','pending','requires_action','failed','canceled'].includes(refund.status??''))fail(503,'refund_state_unconfirmed','The merchant refund state needs reconciliation.');
 const responseStatus=['failed','canceled'].includes(refund.status??'')?await recordRefundProblem('refund_failed','The merchant rejected/canceled this refund; access was not falsely revoked',{refundId:refund.id,status:refund.status}):'refund_pending';
 return {orderId:id,status:responseStatus,providerStatus:refund.status,message:'Final access changes follow current merchant refund confirmation. Previously downloaded files cannot be erased remotely.'};
 async function recordRefundProblem(action:string,message:string,detail:unknown={}){
  return transaction(async client=>{const row=await lockOrder(client,hint),latest=(await client.query<{detail:{requestKey:string}}>("SELECT detail FROM commerce_audit WHERE target=$1 AND action='request_refund' ORDER BY created_at DESC,id DESC LIMIT 1",[id])).rows[0];const unchanged=latest?.detail.requestKey===attempt.requestKey&&row.receipt_version===attempt.receiptVersion&&row.status==='refund_pending';if(unchanged)await client.query("UPDATE commerce_orders SET status='review',updated_at=now() WHERE id=$1 AND status='refund_pending'",[id]);await audit(client,user.id,action,id,message,{requestKey:attempt.requestKey,...detail as object});return unchanged?'review':row.status;});
 }
}
export async function webhook(request:Request){
 const signature=request.headers.get('stripe-signature');if(!signature)fail(400,'signature_required','A payment-provider signature is required.');if(!process.env.STRIPE_WEBHOOK_SECRET)fail(503,'webhook_not_configured','The merchant webhook signing configuration is unavailable.');
 if(Number(request.headers.get('content-length')??0)>2_000_000)fail(413,'event_too_large','The payment event is too large.');const payload=await request.text();if(payload.length>2_000_000)fail(413,'event_too_large','The payment event is too large.');const stripe=stripeClient({existingPayments:true});let event:Stripe.Event;
 try{event=await stripe.webhooks.constructEventAsync(payload,signature,process.env.STRIPE_WEBHOOK_SECRET,300,Stripe.createSubtleCryptoProvider());}catch{return fail(400,'invalid_signature','The payment event signature could not be verified.');}return processPaymentEvent(event);
}
