import { timingSafeEqual } from 'node:crypto';
import { sendMail } from './auth';
import { CommerceError, fail } from './core';
import { audit, DbClient, transaction } from './db';
import { brandMailRetryConfigured, MailAcceptance } from './mail';

type NotificationJob={id:string,brand:string,kind:string,reference_id:string,recipient:string,attempts:number};
type NotificationAttempt={receipt?:MailAcceptance};
type DeliveryOrder={id:string,user_id:string,status:string,refunded_minor:number,email:string,verified_at:string|null,snapshot:{title:string,components:{assetId:string}[]}[]};
function accountLink(){
  let origin:URL;try{origin=new URL(process.env.KARUU_SITE_ORIGIN??'');}catch{return fail(503,'notification_origin_unavailable','The account email origin needs configuration.');}
  if(origin.protocol!=='https:'||origin.username||origin.password||origin.search||origin.hash||origin.pathname!=='/')fail(503,'notification_origin_unavailable','Use the exact HTTPS account origin.');
  return new URL('/account',origin).href;
}
async function assertLease(client:DbClient,job:NotificationJob){
  const lease=(await client.query<{state:string,attempts:number}>('SELECT state,attempts FROM commerce_outbox WHERE id=$1 FOR UPDATE',[job.id])).rows[0];
  if(lease?.state!=='sending'||lease.attempts!==job.attempts+1)fail(409,'notification_lease_changed','A newer notification lease owns this job.');
}
async function deliverOrder(job:NotificationJob,attempt:NotificationAttempt){
  if(job.brand!=='karuu')fail(409,'delivery_notification_unavailable','The order notification brand needs review.');
  const link=accountLink();
  return transaction(async client=>{
    const order=(await client.query<DeliveryOrder>(`SELECT o.id,o.user_id,o.status,o.refunded_minor,o.snapshot,u.email,u.verified_at
      FROM commerce_orders o JOIN commerce_users u ON u.id=o.user_id WHERE o.id=$1 FOR SHARE OF o`,[job.reference_id])).rows[0];
    await assertLease(client,job);
    if(!order||order.status!=='paid'||order.refunded_minor!==0||!order.verified_at||order.email!==job.recipient||!Array.isArray(order.snapshot)||!order.snapshot.length||order.snapshot.some(item=>!Array.isArray(item.components)))fail(409,'delivery_notification_unavailable','The payment or recipient no longer qualifies for this notification.');
    const assets=order.snapshot.flatMap(item=>item.components.map(component=>component.assetId));
    if(!assets.length||assets.some(id=>typeof id!=='string'||!id)||new Set(assets).size!==assets.length)fail(409,'delivery_notification_unavailable','The receipt content needs review.');
    const rights=await client.query<{asset_id:string}>("SELECT asset_id FROM commerce_entitlements WHERE user_id=$1 AND order_id=$2 AND status='active'",[order.user_id,order.id]);
    if(assets.some(id=>!rights.rows.some(right=>right.asset_id===id)))fail(409,'delivery_notification_unavailable','The receipt no longer grants its complete content.');
    const titles=order.snapshot.map(item=>typeof item.title==='string'?item.title.slice(0,300):'Your digital content').join('\n');
    // Keep local refund updates behind this order lock until provider acceptance.
    // The account checks current rights again; the email contains no file/grant URL.
    attempt.receipt=await sendMail(job.recipient,'Your KARUU purchase',`Your payment has been recorded. These works have been added to your KARUU account:\n\n${titles}\n\nSign in to view your current orders and download available editions:\n${link}\n\nOrder reference: ${order.id}\nIf you did not make this purchase, contact john@karuu.net.`,job.brand,job.id);
    await client.query("UPDATE commerce_outbox SET state='sent',leased_until=NULL WHERE id=$1",[job.id]);
  });
}
async function deliverInquiry(job:NotificationJob,attempt:NotificationAttempt){
  return transaction(async client=>{
    await assertLease(client,job);
    const inquiry=(await client.query('SELECT reference,data FROM commerce_inquiries WHERE id=$1 AND brand=$2',[job.reference_id,job.brand])).rows[0];
    if(!inquiry)fail(409,'delivery_notification_unavailable','The inquiry notification needs review.');
    attempt.receipt=await sendMail(job.recipient,`${job.brand==='karuu'?'KARUU':'JKJ-Plus'} inquiry ${inquiry.reference}`,`${inquiry.reference}\n\n${Object.entries(inquiry.data).filter(([,v])=>Boolean(v)).map(([k,v])=>`${k}: ${v}`).join('\n')}`,job.brand,job.id);
    await client.query("UPDATE commerce_outbox SET state='sent',leased_until=NULL WHERE id=$1",[job.id]);
    await client.query("UPDATE commerce_inquiries SET notification_status='provider_accepted' WHERE id=$1",[job.reference_id]);
  });
}

export async function deliverNotifications(request:Request){
  const secret=process.env.KARUU_NOTIFICATION_JOB_SECRET,actual=Buffer.from(request.headers.get('authorization')??''),expected=Buffer.from(`Bearer ${secret??''}`);
  if(!secret||secret.length<32||actual.length!==expected.length||!timingSafeEqual(actual,expected))fail(401,'job_unauthorized','A private notification-job credential is required.');
  const brands=['karuu','jkj-plus'],retryAllowed=await Promise.all(brands.map(brand=>brandMailRetryConfigured(brand)));
  const retryBrands=brands.filter((_brand,index)=>retryAllowed[index]),seen:string[]=[];
  let accepted=0,failed=0,needsReview=0;
  for(let claimed=0;claimed<10;claimed++){
    // Claim only the next job: later jobs retain their full lease after slow sends.
    // A job gets at most one provider attempt during this scheduler invocation.
    const job=await transaction(async client=>{
      const row=(await client.query<NotificationJob>(`SELECT * FROM commerce_outbox WHERE (state IN ('pending','failed') OR (state='sending' AND leased_until<now())) AND attempts<5 AND (attempts=0 OR brand=ANY($1::text[])) AND NOT(id=ANY($2::uuid[])) ORDER BY created_at,id FOR UPDATE SKIP LOCKED LIMIT 1`,[retryBrands,seen])).rows[0];
      if(row)await client.query("UPDATE commerce_outbox SET state='sending',leased_until=now()+interval '2 minutes',attempts=attempts+1 WHERE id=$1",[row.id]);return row;
    });
    if(!job)break;seen.push(job.id);
    const attempt:NotificationAttempt={};
    try{
      if(job.kind==='order_delivery'){await deliverOrder(job,attempt);accepted++;continue;}
      if(job.kind!=='inquiry')fail(409,'delivery_notification_unavailable','Unknown notification type needs review.');
      await deliverInquiry(job,attempt);accepted++;
    }catch(error){
      if(error instanceof CommerceError&&error.code==='notification_lease_changed')continue;
      const terminal=error instanceof CommerceError&&error.code==='delivery_notification_unavailable';
      const retrySafe=!terminal&&retryBrands.includes(job.brand)&&(attempt.receipt?.providerIdempotency??true);
      const recorded=await transaction(async client=>{
        const changed=await client.query(`UPDATE commerce_outbox SET state='failed',leased_until=NULL,attempts=CASE WHEN $3 THEN 5 ELSE attempts END WHERE id=$1 AND state='sending' AND attempts=$2 RETURNING id`,[job.id,job.attempts+1,terminal]);
        if(!changed.rows.length)return false;
        if(job.kind==='inquiry'&&!retrySafe)await client.query("UPDATE commerce_inquiries SET notification_status='delivery_review' WHERE id=$1",[job.reference_id]);
        if(job.kind!=='inquiry')await audit(client,null,'delivery_notification_review',job.reference_id,'The notification was withheld or its provider result needs review',{jobId:job.id,terminal,retrySafe,providerAccepted:Boolean(attempt.receipt),provider:attempt.receipt?.provider??null,messageId:attempt.receipt?.messageId??null});
        return true;
      });
      if(!recorded)continue;
      if(!retrySafe)needsReview++;failed++;
    }
  }
  return {processed:accepted+failed,providerAccepted:accepted,failed,needsReview};
}
