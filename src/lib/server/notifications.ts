import { timingSafeEqual } from 'node:crypto';
import { sendMail } from './auth';
import { fail } from './core';
import { query, transaction } from './db';

export async function deliverNotifications(request:Request){
  const secret=process.env.KARUU_NOTIFICATION_JOB_SECRET,actual=Buffer.from(request.headers.get('authorization')??''),expected=Buffer.from(`Bearer ${secret??''}`);
  if(!secret||secret.length<32||actual.length!==expected.length||!timingSafeEqual(actual,expected))fail(401,'job_unauthorized','A private notification-job credential is required.');
  const jobs=await transaction(async client=>{
    const rows=await client.query(`SELECT * FROM commerce_outbox WHERE (state IN ('pending','failed') OR (state='sending' AND leased_until<now())) AND attempts<5 ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 10`);
    for(const row of rows.rows)await client.query("UPDATE commerce_outbox SET state='sending',leased_until=now()+interval '2 minutes',attempts=attempts+1 WHERE id=$1",[row.id]);return rows.rows;
  });
  let accepted=0,failed=0;
  for(const job of jobs){
    try{
      const inquiry=(await query('SELECT reference,data FROM commerce_inquiries WHERE id=$1 AND brand=$2',[job.reference_id,job.brand]))[0];
      if(!inquiry)throw new Error('MissingInquiry');
      await sendMail(job.recipient,`${job.brand==='karuu'?'KARUU':'JKJ-Plus'} inquiry ${inquiry.reference}`,`${inquiry.reference}\n\n${Object.entries(inquiry.data).filter(([,v])=>Boolean(v)).map(([k,v])=>`${k}: ${v}`).join('\n')}`,job.brand,job.id);
      await transaction(async client=>{await client.query("UPDATE commerce_outbox SET state='sent',leased_until=NULL WHERE id=$1",[job.id]);await client.query("UPDATE commerce_inquiries SET notification_status='provider_accepted' WHERE id=$1",[job.reference_id]);});accepted++;
    }catch{await query("UPDATE commerce_outbox SET state='failed',leased_until=NULL WHERE id=$1",[job.id]);failed++;}
  }
  return {processed:jobs.length,providerAccepted:accepted,failed};
}
