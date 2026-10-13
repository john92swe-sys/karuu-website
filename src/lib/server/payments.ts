import Stripe from 'stripe';
import { fail } from './core';
import { audit, transaction } from './db';
import { OrderSnapshot, stripeClient } from './commerce';

export async function processPaymentEvent(event:Stripe.Event){
  if(event.livemode!==(process.env.KARUU_PAYMENT_MODE==='live')) fail(400,'event_mode_mismatch','The event belongs to a different payment environment.');
  const supported=['checkout.session.completed','checkout.session.async_payment_succeeded','checkout.session.async_payment_failed','checkout.session.expired','charge.refunded'];
  if(!supported.includes(event.type)) return {received:true,ignored:true};
  const stripe=stripeClient();
  let session:Stripe.Checkout.Session|undefined,charge:Stripe.Charge|undefined;
  if(event.type==='charge.refunded') charge=await stripe.charges.retrieve((event.data.object as Stripe.Charge).id);
  else session=await stripe.checkout.sessions.retrieve((event.data.object as Stripe.Checkout.Session).id);
  let orderId=session?.metadata?.orderId??charge?.metadata?.orderId;
  if(charge&&!orderId){const intentId=typeof charge.payment_intent==='string'?charge.payment_intent:charge.payment_intent?.id;if(intentId)orderId=(await stripe.paymentIntents.retrieve(intentId)).metadata.orderId;}
  if(!orderId) return {received:true,ignored:true};
  return transaction(async client=>{
    const inserted=await client.query('INSERT INTO commerce_payment_events(id,type,object_id) VALUES($1,$2,$3) ON CONFLICT DO NOTHING RETURNING id',[event.id,event.type,session?.id??charge!.id]);
    if(!inserted.rows.length) return {received:true,duplicate:true};
    const owner=(await client.query('SELECT user_id FROM commerce_orders WHERE id=$1',[orderId])).rows[0];
    if(!owner) fail(409,'order_not_found','The linked order is not present. Retry this event after reconciliation.');
    // Quote creation and fulfillment use the same user → order lock order.
    await client.query('SELECT id FROM commerce_users WHERE id=$1 FOR UPDATE',[owner.user_id]);
    const result=await client.query('SELECT * FROM commerce_orders WHERE id=$1 FOR UPDATE',[orderId]),order=result.rows[0];
    if(!order) fail(409,'order_not_found','The linked order is not present. Retry this event after reconciliation.');
    if(session){
      if(order.stripe_session_id!==session.id) fail(409,'session_not_bound','The checkout session has not been linked to this order. Retry the event.');
      if(session.client_reference_id!==order.id||session.metadata?.userId!==order.user_id) fail(400,'order_identity_mismatch','The payment session does not match the order account.');
      if(session.amount_total!==order.total_minor||session.currency?.toUpperCase()!==order.currency) fail(400,'payment_amount_mismatch','The payment amount or currency does not match the immutable order.');
      if(['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type)&&session.payment_status==='paid'){
        if(['refunded','refund_pending','review'].includes(order.status)) return {received:true,fulfillmentSkipped:true};
        if(session.customer_details?.address?.country!==order.market){
          await client.query("UPDATE commerce_orders SET status='review',stripe_payment_intent=$2,updated_at=now() WHERE id=$1",[order.id,typeof session.payment_intent==='string'?session.payment_intent:session.payment_intent?.id]);
          await audit(client,null,'payment_market_review',order.id,'Verified billing country differs from the quoted tax market',{quotedMarket:order.market});
          return {received:true,reviewRequired:true};
        }
        const snapshot=order.snapshot as OrderSnapshot;
        for(const item of snapshot)for(const component of item.components){
          await client.query(`INSERT INTO commerce_entitlements(user_id,asset_id,order_id,status) VALUES($1,$2,$3,'active') ON CONFLICT DO NOTHING`,[order.user_id,component.assetId,order.id]);
        }
        await client.query("UPDATE commerce_orders SET status='paid',stripe_payment_intent=$2,updated_at=now() WHERE id=$1",[order.id,typeof session.payment_intent==='string'?session.payment_intent:session.payment_intent?.id]);
        await audit(client,null,'payment_fulfilled',order.id,'Signed event and merchant query confirmed payment',{eventId:event.id,assetIds:snapshot.flatMap(i=>i.components.map(c=>c.assetId))});
      }else if(event.type==='checkout.session.async_payment_failed'&&session.payment_status!=='paid'&&order.status==='pending') await client.query("UPDATE commerce_orders SET status='failed',updated_at=now() WHERE id=$1",[order.id]);
      else if(event.type==='checkout.session.expired'&&session.status==='expired'&&session.payment_status==='unpaid'&&order.status==='pending') await client.query("UPDATE commerce_orders SET status='cancelled',updated_at=now() WHERE id=$1",[order.id]);
    }else if(charge){
      const paymentIntent=typeof charge.payment_intent==='string'?charge.payment_intent:charge.payment_intent?.id;
      if(paymentIntent!==order.stripe_payment_intent||charge.currency.toUpperCase()!==order.currency||charge.amount!==order.total_minor) fail(400,'refund_order_mismatch','The refund does not belong to the recorded payment.');
      if(charge.amount_refunded<order.refunded_minor) return {received:true,olderRefund:true};
      const full=charge.refunded&&charge.amount_refunded===order.total_minor;
      await client.query('UPDATE commerce_orders SET refunded_minor=$2,status=$3,updated_at=now() WHERE id=$1',[order.id,charge.amount_refunded,full?'refunded':'review']);
      if(full){
        await client.query("UPDATE commerce_entitlements SET status='revoked' WHERE order_id=$1",[order.id]);
        await client.query("UPDATE commerce_kru_records SET state='cancelled' WHERE order_id=$1 AND state IN ('eligibility_pending','pending','retry')",[order.id]);
      }
      await audit(client,null,'refund_confirmed',order.id,'Merchant-confirmed cumulative refund',{eventId:event.id,refundedMinor:charge.amount_refunded,full});
    }
    return {received:true};
  });
}
export async function webhook(request:Request){
  const signature=request.headers.get('stripe-signature');
  if(!signature) fail(400,'signature_required','A payment-provider signature is required.');
  if(Number(request.headers.get('content-length')??0)>2_000_000) fail(413,'event_too_large','The payment event is too large.');
  const payload=await request.text();
  if(payload.length>2_000_000) fail(413,'event_too_large','The payment event is too large.');
  const stripe=stripeClient();
  let event:Stripe.Event;
  try{event=stripe.webhooks.constructEvent(payload,signature,process.env.STRIPE_WEBHOOK_SECRET!,300);}catch{return fail(400,'invalid_signature','The payment event signature could not be verified.');}
  return processPaymentEvent(event);
}
