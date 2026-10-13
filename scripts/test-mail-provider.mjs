import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import util from 'node:util';
import ts from 'typescript';

// Real application modules, isolated environment and mock provider/SQL boundaries.
// No real process secrets, account API, recipient, network or Worker is contacted.
const root=path.resolve(import.meta.dirname,'..');
const plain=value=>JSON.parse(JSON.stringify(value));
function fixture(env={},workerEnv=null){
  const settings={...env},relayCalls=[],nativeCalls=[],sqlCalls=[];
  let providerResponse=new Response('{}',{status:202}),fetchFailure=false,contextFailure=false;
  const database={configured:true,ready:true};
  const cache=new Map();
  function load(filename){
    const target=path.resolve(root,'src/lib/server',filename);
    if(cache.has(target))return cache.get(target);
    const module={exports:{}};cache.set(target,module.exports);
    function require(name){
      if(name==='node:crypto')return crypto;
      if(name==='node:util')return util;
      if(name==='stripe')return class Stripe{};
      if(name==='next/headers')return {cookies:async()=>({get:()=>undefined})};
      if(name==='next/server')return {NextResponse:{json:value=>({value,cookies:{set(){}}})}};
      if(name==='./cloudflare')return {cloudflareEnvironment:async()=>{if(contextFailure)throw new Error('Isolated missing context');return workerEnv;}};
      if(name==='./private-media')return {privateMediaConfigured:async()=>false};
      if(name==='./db')return {
        databaseConfigured:async()=>database.configured,
        query:async(sql,values=[])=>{sqlCalls.push({sql,values});return sql.startsWith('SELECT version')?(database.ready?[{version:1}]:[]):[];},
        limit:async()=>{},audit:async()=>{},
        transaction:async work=>work({query:async(sql,values=[])=>{
          sqlCalls.push({sql,values});
          if(sql.startsWith('INSERT INTO commerce_inquiries'))return {rows:[{id:values[0],reference:values[1]}]};
          return {rows:[]};
        }}),
      };
      if(name.startsWith('./'))return load(name.slice(2)+'.ts');
      throw new Error(`Unapproved fixture dependency ${name}`);
    }
    const context=vm.createContext({module,exports:module.exports,require,process:{env:settings},URL,Response,AbortSignal,Buffer,
      fetch:async(url,options)=>{
        const parsed=new URL(url);
        assert.ok(['karuu-mail.example.test','jkj-mail.example.test'].includes(parsed.hostname),'No external network is allowed');
        relayCalls.push({url:String(url),options,body:JSON.parse(options.body)});
        if(fetchFailure)throw new Error('Sensitive relay fixture detail');
        return providerResponse;
      },
    });
    const compiled=ts.transpileModule(fs.readFileSync(target,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
    vm.runInContext(compiled,context,{filename:target});cache.set(target,module.exports);return module.exports;
  }
  const mail=load('mail.ts');
  function binding(brand,result={messageId:`fixture-${brand}-accepted`},failure=false){return {send:async message=>{nativeCalls.push({brand,message:plain(message)});if(failure)throw new Error('Sensitive native fixture detail');return result;}};}
  return {settings,mail,load,relayCalls,nativeCalls,sqlCalls,database,binding,
    setWorkerEnv:value=>{workerEnv=value;},setContextFailure:value=>{contextFailure=value;},
    setResponse:value=>{providerResponse=value;},setFetchFailure:value=>{fetchFailure=value;},
  };
}
const relayEnv={KARUU_MAIL_ENDPOINT:'https://karuu-mail.example.test/send',KARUU_MAIL_TOKEN:'isolated-karuu-fixture-only'};
const nativeEnv={KARUU_MAIL_PROVIDER:'cloudflare',KARUU_MAIL_FROM:'noreply@karuu.example.test'};
const code=expected=>error=>error.code===expected;

await test('unconfigured brands and unknown brand cannot send or borrow configuration',async()=>{
  const f=fixture();
  assert.equal(await f.mail.brandMailConfigured('karuu'),false);
  assert.equal(await f.mail.brandMailConfigured('jkj-plus'),false);
  assert.equal(await f.mail.brandMailConfigured('other'),false);
  await assert.rejects(f.mail.sendBrandMail('buyer@example.test','Subject','Message'),code('mail_not_configured'));
  assert.equal(f.relayCalls.length+f.nativeCalls.length,0);
});
await test('default relay preserves payload and idempotency header but does not infer deduplication',async()=>{
  const f=fixture(relayEnv);
  assert.equal(await f.mail.brandMailConfigured('karuu'),true);
  const receipt=await f.mail.sendBrandMail('buyer@example.test','Fixture subject','Fixture message','karuu','fixture-job-1');
  assert.deepEqual(plain(receipt),{accepted:true,provider:'relay',messageId:null,providerIdempotency:false});
  assert.equal(receipt.delivered,undefined);
  assert.equal(f.relayCalls[0].options.headers['Idempotency-Key'],'fixture-job-1');
  assert.equal(f.relayCalls[0].options.headers.Authorization,'Bearer isolated-karuu-fixture-only');
  assert.deepEqual(f.relayCalls[0].body,{to:'buyer@example.test',subject:'Fixture subject',text:'Fixture message',brand:'karuu'});
});
await test('missing JKJ provider never borrows KARUU relay',async()=>{
  const f=fixture(relayEnv);
  assert.equal(await f.mail.brandMailConfigured('jkj-plus'),false);
  await assert.rejects(f.mail.sendBrandMail('buyer@example.test','JKJ subject','Message','jkj-plus'),code('mail_not_configured'));
  assert.equal(f.relayCalls.length,0);
});
await test('JKJ relay and confirmed idempotency are independently configured',async()=>{
  const f=fixture({...relayEnv,JKJ_MAIL_ENDPOINT:'https://jkj-mail.example.test/send',JKJ_MAIL_TOKEN:'isolated-jkj-fixture-only',JKJ_MAIL_IDEMPOTENCY_CONFIRMED:'true'});
  assert.equal(f.mail.brandMailSupportsIdempotency('karuu'),false);
  assert.equal(f.mail.brandMailSupportsIdempotency('jkj-plus'),true);
  const receipt=await f.mail.sendBrandMail('buyer@example.test','Subject','Message','jkj-plus','fixture-jkj-job');
  assert.equal(receipt.providerIdempotency,true);
  assert.equal(f.relayCalls[0].url,'https://jkj-mail.example.test/send');
  assert.equal(f.relayCalls[0].options.headers.Authorization,'Bearer isolated-jkj-fixture-only');
  assert.equal(f.relayCalls[0].body.brand,'jkj-plus');
});
await test('native sender and binding are mandatory with no relay fallback',async()=>{
  const f=fixture({...relayEnv,...nativeEnv});
  assert.equal(await f.mail.brandMailConfigured('karuu'),false);
  f.setWorkerEnv({KARUU_EMAIL:f.binding('karuu')});
  delete f.settings.KARUU_MAIL_FROM;
  assert.equal(await f.mail.brandMailConfigured('karuu'),false);
  f.settings.KARUU_MAIL_FROM='sender\n@karuu.example.test';
  assert.equal(await f.mail.brandMailConfigured('karuu'),false);
  await assert.rejects(f.mail.sendBrandMail('buyer@example.test','Subject','Message'),code('mail_not_configured'));
  assert.equal(f.relayCalls.length+f.nativeCalls.length,0);
});
await test('native send uses only documented fields and reports accepted, not delivered or idempotent',async()=>{
  const f=fixture({...nativeEnv,KARUU_MAIL_IDEMPOTENCY_CONFIRMED:'true'});
  f.setWorkerEnv({KARUU_EMAIL:f.binding('karuu')});
  assert.equal(await f.mail.brandMailConfigured('karuu'),true);
  assert.equal(f.mail.brandMailSupportsIdempotency('karuu'),false);
  const receipt=await f.mail.sendBrandMail('customer@example.test','Native subject','Native message','karuu','ignored-native-job-key');
  assert.deepEqual(plain(receipt),{accepted:true,provider:'cloudflare',messageId:'fixture-karuu-accepted',providerIdempotency:false});
  assert.equal(receipt.delivered,undefined);
  assert.deepEqual(f.nativeCalls[0].message,{from:'noreply@karuu.example.test',to:'customer@example.test',subject:'Native subject',text:'Native message'});
  assert.equal(f.relayCalls.length,0);
});
await test('native JKJ sender and binding cannot borrow KARUU',async()=>{
  const f=fixture(nativeEnv);
  f.setWorkerEnv({KARUU_EMAIL:f.binding('karuu')});
  assert.equal(await f.mail.brandMailConfigured('jkj-plus'),false);
  await assert.rejects(f.mail.sendBrandMail('buyer@example.test','Subject','Message','jkj-plus'),code('mail_not_configured'));
  Object.assign(f.settings,{JKJ_MAIL_PROVIDER:'cloudflare',JKJ_MAIL_FROM:'noreply@jkj.example.test'});
  assert.equal(await f.mail.brandMailConfigured('jkj-plus'),false);
  f.setWorkerEnv({KARUU_EMAIL:f.binding('karuu'),JKJ_EMAIL:f.binding('jkj-plus')});
  const receipt=await f.mail.sendBrandMail('buyer@example.test','Subject','Message','jkj-plus');
  assert.equal(receipt.provider,'cloudflare');
  assert.equal(f.nativeCalls.length,1);
  assert.equal(f.nativeCalls[0].brand,'jkj-plus');
  assert.equal(f.nativeCalls[0].message.from,'noreply@jkj.example.test');
});
await test('unknown provider, HTTP relay and credential URL fail closed',async()=>{
  for(const change of [{KARUU_MAIL_PROVIDER:'unknown'},{KARUU_MAIL_ENDPOINT:'http://karuu-mail.example.test/send'},{KARUU_MAIL_ENDPOINT:'https://user:fixture@karuu-mail.example.test/send'}]){
    const f=fixture({...relayEnv,...change});
    assert.equal(await f.mail.brandMailConfigured('karuu'),false);
    await assert.rejects(f.mail.sendBrandMail('buyer@example.test','Subject','Message'),code('mail_not_configured'));
    assert.equal(f.relayCalls.length,0);
  }
});
await test('native provider failure and legacy/malformed receipts never become acceptance',async()=>{
  for(const [result,failure] of [[null,false],[{},false],[{messageId:''},false],[{messageId:'fixture'},true]]){
    const f=fixture(nativeEnv);f.setWorkerEnv({KARUU_EMAIL:f.binding('karuu',result,failure)});
    await assert.rejects(f.mail.sendBrandMail('buyer@example.test','Subject','Message'),error=>{
      assert.equal(error.code,'mail_delivery_unavailable');assert.equal(error.message.includes('Sensitive'),false);return true;
    });
    assert.equal(f.relayCalls.length,0);
  }
});
await test('relay failure and rejected requests are sanitized and not retried',async()=>{
  for(const failure of ['status','network']){
    const f=fixture(relayEnv);
    if(failure==='status')f.setResponse(new Response('{}',{status:503}));else f.setFetchFailure(true);
    await assert.rejects(f.mail.sendBrandMail('buyer@example.test','Subject','Message'),error=>error.code==='mail_delivery_unavailable'&&!error.message.includes('Sensitive'));
    assert.equal(f.relayCalls.length,1);
  }
});
await test('invalid message headers never reach the native provider',async()=>{
  const f=fixture(nativeEnv);f.setWorkerEnv({KARUU_EMAIL:f.binding('karuu')});
  await assert.rejects(f.mail.sendBrandMail('buyer@example.test','Subject\r\nInjected: value','Message'),code('invalid_mail_message'));
  await assert.rejects(f.mail.sendBrandMail('not an address','Subject','Message'),code('invalid_mail_message'));
  assert.equal(f.nativeCalls.length,0);
});
await test('context failure remains unconfigured instead of exposing a fallback sender',async()=>{
  const f=fixture(relayEnv);f.setContextFailure(true);
  assert.equal(await f.mail.brandMailConfigured('karuu'),false);
  await assert.rejects(f.mail.sendBrandMail('buyer@example.test','Subject','Message'),code('mail_not_configured'));
  assert.equal(f.relayCalls.length,0);
});
await test('account wrappers await configuration and require site origin before database work',async()=>{
  const f=fixture(nativeEnv);f.setWorkerEnv({KARUU_EMAIL:f.binding('karuu')});
  const auth=f.load('auth.ts');
  assert.equal(await auth.mailConfigured(),false);
  await assert.rejects(auth.register({email:'buyer@example.test',password:'isolated-password-only'}),code('accounts_not_configured'));
  await assert.rejects(auth.requestPasswordReset({email:'buyer@example.test'}),code('accounts_not_configured'));
  assert.equal(f.sqlCalls.length,0);
  f.settings.KARUU_SITE_ORIGIN='https://karuu.example.test';
  assert.equal(await auth.mailConfigured(),true);
  const receipt=await auth.sendMail('buyer@example.test','Subject','Message');
  assert.equal(receipt.accepted,true);
  assert.equal(receipt.provider,'cloudflare');
});
await test('commerce accounts boolean tracks asynchronous native configuration and site origin',async()=>{
  const f=fixture(nativeEnv);f.setWorkerEnv({KARUU_EMAIL:f.binding('karuu')});
  const commerce=f.load('commerce.ts');
  assert.equal((await commerce.status()).accounts,false);
  f.settings.KARUU_SITE_ORIGIN='https://karuu.example.test';
  assert.equal((await commerce.status()).accounts,true);
  f.setWorkerEnv(null);
  assert.equal((await commerce.status()).accounts,false);
});
await test('inquiry notification queue awaits each brand configuration without sending mail',async()=>{
  const f=fixture({...nativeEnv,JKJ_INQUIRY_EMAIL:'owner@jkj.example.test'});f.setWorkerEnv({KARUU_EMAIL:f.binding('karuu')});
  const inquiries=f.load('inquiries.ts');
  const input={name:'Fixture buyer',email:'buyer@example.test',message:'An isolated fixture inquiry only.',privacyConsent:true};
  const karuu=await inquiries.receiveInquiry({...input,brand:'karuu'},'fixture-inquiry-karuu-0001');
  const jkj=await inquiries.receiveInquiry({...input,brand:'jkj-plus'},'fixture-inquiry-jkj-0001');
  assert.equal(karuu.notification,'queued');
  assert.equal(jkj.notification,'not_configured');
  const queued=f.sqlCalls.filter(call=>call.sql.startsWith('INSERT INTO commerce_outbox'));
  assert.equal(queued.length,1);
  assert.equal(queued[0].values[1],'karuu');
  assert.equal(f.relayCalls.length+f.nativeCalls.length,0);
});
await test('idempotency confirmation is explicit, per-brand and cannot enable native or unknown providers',()=>{
  const f=fixture({KARUU_MAIL_IDEMPOTENCY_CONFIRMED:'true',JKJ_MAIL_IDEMPOTENCY_CONFIRMED:'false'});
  assert.equal(f.mail.brandMailSupportsIdempotency('karuu'),true);
  assert.equal(f.mail.brandMailSupportsIdempotency('jkj-plus'),false);
  assert.equal(f.mail.brandMailSupportsIdempotency('other'),false);
  for(const provider of ['cloudflare','unknown']){
    f.settings.KARUU_MAIL_PROVIDER=provider;
    assert.equal(f.mail.brandMailSupportsIdempotency('karuu'),false);
  }
});
