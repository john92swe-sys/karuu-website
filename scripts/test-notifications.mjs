import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import Module from 'node:module';
import ts from 'typescript';
import { PGlite } from '@electric-sql/pglite';

const root=path.resolve('work/notification-tests');fs.mkdirSync(root,{recursive:true});
const directory=fs.mkdtempSync(path.join(root,'isolated-'));
const database=new PGlite(directory);await database.waitReady;
await database.exec(fs.readFileSync('db/001-commerce.sql','utf8'));
let failSent=false,mailFails=false;
const messages=[];
class TestPool {
  async query(sql,values=[]){return database.query(sql,values);}
  async connect(){return {query:async(sql,values=[])=>{
    if(failSent&&sql.includes("SET state='sent'")){failSent=false;throw new Error('Isolated post-send database failure');}
    return database.query(sql,values);
  },release(){}};}
}
const originalLoad=Module._load;
Module._load=function(name,parent,isMain){
  if(name==='pg')return {Pool:TestPool};
  if(name==='./auth'&&parent?.filename.endsWith('notifications.ts'))return {sendMail:async(to,subject,text,brand,key)=>{
    messages.push({to,subject,text,brand,key});if(mailFails)throw new Error('Isolated mail timeout');
    return {accepted:true,provider:'cloudflare',messageId:'fixture-only',providerIdempotency:false};
  }};
  return originalLoad.call(this,name,parent,isMain);
};
Module._extensions['.ts']=function(module,filename){module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true},
}).outputText,filename);};
const require=Module.createRequire(import.meta.url),notify=require('../src/lib/server/notifications.ts').deliverNotifications;
Object.assign(process.env,{KARUU_RUNTIME:'node',KARUU_DATABASE_URL:'postgres://local-only',KARUU_NOTIFICATION_JOB_SECRET:'fixture-only-private-notification-key-123456',KARUU_MAIL_PROVIDER:'cloudflare',JKJ_MAIL_PROVIDER:'relay'});
const request=(valid=true)=>new Request('https://karuu.test/api/internal/notifications',{
  method:'POST',headers:{Authorization:valid?`Bearer ${process.env.KARUU_NOTIFICATION_JOB_SECRET}`:'Bearer incorrect'},
});
async function job(brand='karuu'){
  const id=randomUUID(),outbox=randomUUID();
  await database.query('INSERT INTO commerce_inquiries(id,reference,brand,idempotency_key,request_hash,data,notification_status) VALUES($1,$2,$3,$4,$5,$6,$7)',[id,'LOCAL-'+id.slice(0,8),brand,randomUUID(),'fixture','{"message":"Isolated test inquiry"}','queued']);
  await database.query('INSERT INTO commerce_outbox(id,brand,kind,reference_id,recipient) VALUES($1,$2,$3,$4,$5)',[outbox,brand,'inquiry',id,'operator@example.test']);
  return {id,outbox};
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
} finally {
  await database.close();
  if(!directory.startsWith(root+path.sep)||!path.basename(directory).startsWith('isolated-'))throw new Error('Unsafe notification test cleanup');
  fs.rmSync(directory,{recursive:true,force:true});
}
console.log('Actual isolated SQL with mail boundary fixtures. No email was sent; provider acceptance is not mailbox delivery.');
