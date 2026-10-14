import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import Module from 'node:module';
import ts from 'typescript';
import { PGlite } from '@electric-sql/pglite';
import { prepareCommerceSchemaMigration } from './lib/commerce-schema-migration.mjs';
import { prepareCommerceRuntimeRole } from './lib/commerce-runtime-role.mjs';

const root=path.resolve('work/notification-tests');fs.mkdirSync(root,{recursive:true});
const directory=fs.mkdtempSync(path.join(root,'isolated-'));
const database=new PGlite(directory);await database.waitReady;
const base=fs.readFileSync('db/001-commerce.sql','utf8');
await database.exec('CREATE ROLE anon; CREATE ROLE authenticated');
await database.exec(prepareCommerceSchemaMigration(base).sql);
await database.exec(prepareCommerceRuntimeRole(base).sql);
await database.exec('SET search_path TO karuu_commerce,pg_catalog,pg_temp');
let failSent=false,mailFails=false,mailHangs=false,lateAcceptance,stealNextClaim=false,stealAfterRollback;
const messages=[],claims=[],nativeCalls=[];
let queue=Promise.resolve();
async function acquire(){const previous=queue;let release;queue=new Promise(resolve=>{release=resolve;});await previous;return release;}
async function enter(){await database.exec('SET SESSION AUTHORIZATION karuu_web; SET search_path TO karuu_commerce,pg_catalog,pg_temp');}
async function leave(){await database.exec('SET SESSION AUTHORIZATION postgres; RESET ROLE; SET search_path TO karuu_commerce,pg_catalog,pg_temp');}
const workerEnv={KARUU_EMAIL:{send:async message=>{
  nativeCalls.push({message,time:Date.now()});
  if(mailFails)throw new Error('Sensitive isolated mail timeout');
  if(mailHangs){mailHangs=false;return new Promise(resolve=>{lateAcceptance=resolve;});}
  return {messageId:'fixture-native-'+nativeCalls.length};
}}};
class TestPool {
  async query(sql,values=[]){const release=await acquire();try{await enter();return await database.query(sql,values);}finally{await leave();release();}}
  async connect(){const release=await acquire();await enter();let swapped;
    return {query:async(sql,values=[])=>{
    if(failSent&&sql.includes("SET state='sent'")){failSent=false;throw new Error('Isolated post-send database failure');}
    const result=await database.query(sql,values);
    if(sql.includes("SET state='sending'")&&sql.includes('attempts=attempts+1')){
      claims.push({id:values[0],time:Date.now()});if(stealNextClaim){swapped=values[0];stealNextClaim=false;}
    }
    if(sql==='COMMIT'&&swapped){await database.query("UPDATE commerce_outbox SET state='sent',attempts=attempts+1,leased_until=NULL WHERE id=$1",[swapped]);swapped=undefined;}
    if(sql==='ROLLBACK'&&stealAfterRollback){const id=stealAfterRollback;stealAfterRollback=undefined;await database.query("UPDATE commerce_outbox SET state='sent',attempts=attempts+1,leased_until=NULL WHERE id=$1",[id]);}
    return result;
  },release(){void leave().then(release);}};}
}
let actualMail;
const originalLoad=Module._load;
Module._load=function(name,parent,isMain){
  if(name==='pg')return {Pool:TestPool};
  if(name==='./cloudflare'&&parent?.filename.includes('lib'+path.sep+'server'))return {cloudflareEnvironment:async()=>workerEnv,commerceHyperdrive:async()=>null};
  if(name==='./auth'&&parent?.filename.endsWith('notifications.ts'))return {sendMail:async(to,subject,text,brand,key)=>{
    messages.push({to,subject,text,brand,key});return actualMail.sendBrandMail(to,subject,text,brand,key);
  }};
  return originalLoad.call(this,name,parent,isMain);
};
Module._extensions['.ts']=function(module,filename){module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true},
}).outputText,filename);};
const require=Module.createRequire(import.meta.url);actualMail=require('../src/lib/server/mail.ts');
const notify=require('../src/lib/server/notifications.ts').deliverNotifications;
Object.assign(process.env,{KARUU_RUNTIME:'node',KARUU_DATABASE_SCHEMA:'karuu_commerce',KARUU_DATABASE_URL:'postgres://local-only',KARUU_NOTIFICATION_JOB_SECRET:'fixture-only-private-notification-key-123456',KARUU_MAIL_PROVIDER:'cloudflare',KARUU_MAIL_FROM:'noreply@karuu.example.test',JKJ_MAIL_PROVIDER:'relay',JKJ_MAIL_ENDPOINT:'https://jkj-mail.example.test/send',JKJ_MAIL_TOKEN:'fixture-only-relay-token',KARUU_SITE_ORIGIN:'https://karuu.test'});
globalThis.fetch=async(url)=>{
  assert.equal(new URL(url).hostname,'jkj-mail.example.test','No external network is allowed');
  if(mailFails)throw new Error('Sensitive isolated relay timeout');return new Response('{}',{status:202});
};
const request=(valid=true)=>new Request('https://karuu.test/api/internal/notifications',{
  method:'POST',headers:{Authorization:valid?`Bearer ${process.env.KARUU_NOTIFICATION_JOB_SECRET}`:'Bearer incorrect'},
});
async function job(brand='karuu'){
  const id=randomUUID(),outbox=randomUUID();
  await database.query('INSERT INTO commerce_inquiries(id,reference,brand,idempotency_key,request_hash,data,notification_status) VALUES($1,$2,$3,$4,$5,$6,$7)',[id,'LOCAL-'+id.slice(0,8),brand,randomUUID(),'fixture','{"message":"Isolated test inquiry"}','queued']);
  await database.query('INSERT INTO commerce_outbox(id,brand,kind,reference_id,recipient) VALUES($1,$2,$3,$4,$5)',[outbox,brand,'inquiry',id,'operator@example.test']);
  return {id,outbox};
}
async function orderJob({status='paid',refunded=0,verified=true,entitled=true,brand='karuu',recipient='buyer@example.test',kind='order_delivery'}={}){
  const user=randomUUID(),order=randomUUID(),outbox=randomUUID(),asset='asset-'+randomUUID();
  await database.query('INSERT INTO commerce_users(id,email,display_name,password_hash,verified_at) VALUES($1,$2,$3,$4,$5)',[user,'buyer+'+user+'@example.test','Isolated buyer','test-only',verified?new Date().toISOString():null]);
  const actualRecipient=recipient==='buyer@example.test'?'buyer+'+user+'@example.test':recipient;
  await database.query('INSERT INTO commerce_assets(id,work_slug,title,format,language,object_key) VALUES($1,$2,$3,$4,$5,$6)',[asset,'local-work','Local book','epub','en','private/never-in-email.epub']);
  await database.query('INSERT INTO commerce_orders(id,user_id,idempotency_key,request_hash,status,currency,total_minor,market,snapshot,consent_version,consent_at,refunded_minor) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,now(),$11)',[order,user,randomUUID(),'fixture',status,'USD',199,'SE',JSON.stringify([{title:'Local book',components:[{assetId:asset,objectKey:'private/never-in-email.epub'}]}]),'test-only',refunded]);
  if(entitled)await database.query("INSERT INTO commerce_entitlements(user_id,asset_id,order_id,status) VALUES($1,$2,$3,'active')",[user,asset,order]);
  await database.query('INSERT INTO commerce_outbox(id,brand,kind,reference_id,recipient) VALUES($1,$2,$3,$4,$5)',[outbox,brand,kind,order,actualRecipient]);
  return {user,order,outbox,asset,recipient:actualRecipient};
}
try {
  await test('a private scheduler credential is required before any job is claimed',async()=>{
    await job();await assert.rejects(notify(request(false)),{code:'job_unauthorized'});
    assert.equal(messages.length,0);
  });
  await test('a provider without confirmed idempotency is not automatically re-sent after a timeout',async()=>{
    mailFails=true;const result=await notify(request());assert.equal(result.needsReview,1);
    mailFails=false;assert.equal((await notify(request())).processed,0);
    assert.equal(messages.length,1);
    assert.equal((await database.query('SELECT notification_status FROM commerce_inquiries')).rows[0].notification_status,'delivery_review');
  });
  await test('acceptance followed by a failed database acknowledgement requires review rather than a duplicate send',async()=>{
    const entry=await job();failSent=true;
    const before=messages.length;assert.equal((await notify(request())).needsReview,1);
    assert.equal((await notify(request())).processed,0);assert.equal(messages.length,before+1);
    assert.equal((await database.query('SELECT notification_status FROM commerce_inquiries WHERE id=$1',[entry.id])).rows[0].notification_status,'delivery_review');
  });
  await test('only a separately confirmed relay contract can retry a failed job with the same provider key',async()=>{
    process.env.JKJ_MAIL_IDEMPOTENCY_CONFIRMED='true';const entry=await job('jkj-plus');mailFails=true;
    assert.equal((await notify(request())).failed,1);mailFails=false;
    assert.equal((await notify(request())).providerAccepted,1);
    const attempts=messages.filter(m=>m.key===entry.outbox);assert.equal(attempts.length,2);
    assert.ok(attempts.every(m=>m.brand==='jkj-plus'));
    assert.equal((await database.query('SELECT notification_status FROM commerce_inquiries WHERE id=$1',[entry.id])).rows[0].notification_status,'provider_accepted');
  });
  await test('paid content notification uses the verified account and a login link, never the stored object or download grant',async()=>{
    const entry=await orderJob(),before=messages.length;
    assert.equal((await notify(request())).providerAccepted,1);
    const sent=messages[before];assert.equal(sent.to,entry.recipient);assert.equal(sent.key,entry.outbox);
    assert.ok(sent.text.includes('https://karuu.test/account'));assert.ok(sent.text.includes('Local book'));
    assert.ok(!sent.text.includes('private/'));assert.ok(!sent.text.includes('grant='));
    assert.equal((await database.query('SELECT state FROM commerce_outbox WHERE id=$1',[entry.outbox])).rows[0].state,'sent');
    assert.equal((await notify(request())).processed,0);
  });
  await test('refunds, review, unverified identity, missing rights, wrong email or brand and unknown jobs never send purchase notices',async()=>{
    for(const overrides of [{status:'refunded',refunded:199},{status:'refund_pending'},{status:'review'},{verified:false},{entitled:false},{recipient:'different@example.test'},{brand:'jkj-plus'},{kind:'unknown_kind'}]){
      const entry=await orderJob(overrides),before=messages.length;
      assert.equal((await notify(request())).needsReview,1);assert.equal(messages.length,before);
      const row=(await database.query('SELECT state,attempts FROM commerce_outbox WHERE id=$1',[entry.outbox])).rows[0];
      assert.equal(row.state,'failed');assert.equal(row.attempts,5);
      assert.equal((await notify(request())).processed,0);
    }
  });
  await test('an order whose entitlement was revoked before dispatch is withheld',async()=>{
    const entry=await orderJob(),before=messages.length;
    await database.query("UPDATE commerce_entitlements SET status='revoked' WHERE order_id=$1",[entry.order]);
    assert.equal((await notify(request())).needsReview,1);assert.equal(messages.length,before);
  });
  await test('purchase email acknowledgement failure leaves one provider attempt and manual review',async()=>{
    const entry=await orderJob(),before=messages.length;failSent=true;
    assert.equal((await notify(request())).needsReview,1);assert.equal(messages.length,before+1);
    assert.equal((await notify(request())).processed,0);
    const reviews=(await database.query("SELECT detail FROM commerce_audit WHERE action='delivery_notification_review' AND target=$1",[entry.order])).rows;
    assert.equal(reviews.length,1);assert.equal(reviews[0].detail.providerAccepted,true);
    assert.equal(reviews[0].detail.provider,'cloudflare');assert.match(reviews[0].detail.messageId,/^fixture-native-/);
    assert.equal(reviews[0].detail.retrySafe,false);
  });
  await test('a hanging native purchase notification releases its transaction at the deadline and preserves late acceptance for manual review',async()=>{
    const first=await orderJob(),second=await orderJob(),before=messages.length;
    mailHangs=true;const result=await notify(request());
    assert.deepEqual(result,{processed:2,providerAccepted:1,failed:1,needsReview:1});
    assert.equal(messages.length,before+2);
    assert.equal((await database.query('SELECT state,attempts FROM commerce_outbox WHERE id=$1',[first.outbox])).rows[0].state,'failed');
    assert.equal((await database.query('SELECT state FROM commerce_outbox WHERE id=$1',[second.outbox])).rows[0].state,'sent');
    const firstClaim=claims.find(claim=>claim.id===first.outbox),secondClaim=claims.find(claim=>claim.id===second.outbox);
    assert.ok(secondClaim.time-firstClaim.time>=9000,'The next native job is claimed after the prior deadline, with a fresh lease');
    lateAcceptance({messageId:'fixture-late-native-acceptance'});await new Promise(resolve=>setImmediate(resolve));
    assert.equal((await notify(request())).processed,0);assert.equal(messages.length,before+2);
    assert.equal((await database.query('SELECT state FROM commerce_outbox WHERE id=$1',[first.outbox])).rows[0].state,'failed');
  });
  await test('a changed order or inquiry lease is neither sent nor counted as an acknowledgement by the old owner',async()=>{
    for(const create of [()=>orderJob(),()=>job()]){
      const entry=await create(),before=messages.length;stealNextClaim=true;
      assert.deepEqual(await notify(request()),{processed:0,providerAccepted:0,failed:0,needsReview:0});
      assert.equal(messages.length,before);
      const row=(await database.query('SELECT state,attempts FROM commerce_outbox WHERE id=$1',[entry.outbox])).rows[0];
      assert.equal(row.state,'sent');assert.equal(row.attempts,2);
    }
  });
  await test('failure after another lease has already acknowledged a job cannot overwrite it or count a failure',async()=>{
    const entry=await orderJob();mailFails=true;stealAfterRollback=entry.outbox;
    assert.deepEqual(await notify(request()),{processed:0,providerAccepted:0,failed:0,needsReview:0});mailFails=false;
    const row=(await database.query('SELECT state,attempts FROM commerce_outbox WHERE id=$1',[entry.outbox])).rows[0];
    assert.equal(row.state,'sent');assert.equal(row.attempts,2);
    assert.equal((await database.query("SELECT count(*)::int AS n FROM commerce_audit WHERE target=$1 AND action='delivery_notification_review'",[entry.order])).rows[0].n,0);
  });
  await test('an expired native lease is retained for manual review while an explicitly idempotent relay may recover once per run',async()=>{
    const native=await orderJob(),relay=await job('jkj-plus'),before=messages.length;
    await database.query("UPDATE commerce_outbox SET state='sending',attempts=1,leased_until=now()-interval '1 second' WHERE id=ANY($1::uuid[])",[[native.outbox,relay.outbox]]);
    assert.deepEqual(await notify(request()),{processed:1,providerAccepted:1,failed:0,needsReview:0});
    assert.equal(messages.length,before+1);assert.equal(messages[before].key,relay.outbox);
    assert.equal((await database.query('SELECT state,attempts FROM commerce_outbox WHERE id=$1',[native.outbox])).rows[0].state,'sending');
    assert.equal((await notify(request())).processed,0);
  });
  await test('one scheduler run acknowledges at most ten fresh jobs and leaves the next job unclaimed',async()=>{
    const entries=[];for(let index=0;index<11;index++)entries.push(await orderJob());
    const before=messages.length;
    assert.deepEqual(await notify(request()),{processed:10,providerAccepted:10,failed:0,needsReview:0});
    assert.equal(messages.length,before+10);
    const remaining=(await database.query('SELECT state,attempts FROM commerce_outbox WHERE id=ANY($1::uuid[]) AND state=$2',[entries.map(entry=>entry.outbox),'pending'])).rows;
    assert.equal(remaining.length,1);assert.equal(remaining[0].attempts,0);
    assert.deepEqual(await notify(request()),{processed:1,providerAccepted:1,failed:0,needsReview:0});
    assert.equal(messages.length,before+11);
  });
  await test('insecure or credential-bearing account origins cannot enter a purchase email',async()=>{
    for(const origin of ['http://karuu.test','https://user:password@karuu.test','https://karuu.test/path','https://karuu.test?tracking=1']){
      const entry=await orderJob(),before=messages.length;process.env.KARUU_SITE_ORIGIN=origin;
      assert.equal((await notify(request())).failed,1);assert.equal(messages.length,before);
      assert.equal((await database.query('SELECT state FROM commerce_outbox WHERE id=$1',[entry.outbox])).rows[0].state,'failed');
    }
    process.env.KARUU_SITE_ORIGIN='https://karuu.test';
  });
} finally {
  await queue;
  await database.close();
  if(!directory.startsWith(root+path.sep)||!path.basename(directory).startsWith('isolated-'))throw new Error('Unsafe notification test cleanup');
  fs.rmSync(directory,{recursive:true,force:true});
}
console.log('Actual isolated SQL with mail boundary fixtures. No email was sent; provider acceptance is not mailbox delivery.');
