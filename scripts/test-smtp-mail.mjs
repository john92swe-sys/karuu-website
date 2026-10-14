import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {EventEmitter} from 'node:events';
import ts from 'typescript';
import {build} from 'esbuild';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';

// Fake provider boundaries never authenticate or send mail. The final workerd
// check uses the actual library and helper with no account, so only TLS/EHLO/QUIT
// can be sent to the fixed public PrivateEmail server; no credentials are read.
const source=fs.readFileSync('src/lib/server/smtp-mail.ts','utf8');
const fixtureAccount={brand:'karuu',user:'fixture@karuu.net',from:'fixture@karuu.net',password:'fixture-only-not-a-credential'};
function fixture(){
  const calls=[],sockets=[],deadlines=new Map();let result,failure,hanging=false,lateResolve,authorized=true;
  const context=vm.createContext({module:{exports:{}},exports:{},Buffer,URL,
    setTimeout:(callback,milliseconds)=>{const key={};deadlines.set(key,{callback,milliseconds});return key;},clearTimeout:key=>deadlines.delete(key),
    require(name){
      if(name==='./core')return {fail:(status,code,message)=>{const error=new Error(message);Object.assign(error,{status,code});throw error;}};
      if(name==='node:tls')return {connect:options=>{
        const socket=new EventEmitter();socket.options=options;socket.authorized=authorized;socket.destroyed=false;
        socket.destroy=()=>{if(!socket.destroyed){socket.destroyed=true;socket.emit('close');}return socket;};socket.setTimeout=()=>socket;
        sockets.push(socket);queueMicrotask(()=>{if(!socket.destroyed)socket.emit('secureConnect');});return socket;
      }};
      if(name==='nodemailer')return {createTransport:options=>{
        const call={options,closed:false};calls.push(call);
        const open=()=>new Promise((resolve,reject)=>options.getSocket(options,(error,opened)=>error?reject(error):resolve(opened)));
        return {
          close(){call.closed=true;},
          verify:async()=>{call.operation='verify';await open();if(failure)throw new Error(failure);return true;},
          sendMail:async message=>{call.operation='send';call.message=message;await open();if(failure)throw new Error(failure);if(hanging)return new Promise(resolve=>{lateResolve=resolve;});return result??{messageId:'<fixture@example.test>',accepted:[message.to],rejected:[],response:'250 queued fixture-only'};},
        };
      }};
      throw Error('Unexpected fixture dependency '+name);
    },
  });
  context.exports=context.module.exports;
  vm.runInContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,context);
  return {smtp:context.module.exports,calls,sockets,deadlines,setResult:value=>{result=value;},setFailure:value=>{failure=value;},setAuthorized:value=>{authorized=value;},hang:()=>{hanging=true;},acceptLate:value=>lateResolve(value),
    expire:()=>{const values=[...deadlines.values()];assert.equal(values.length,1);assert.equal(values[0].milliseconds,10000);values[0].callback();}};
}
await test('SMTP has a fixed verified TLS endpoint, independent sender envelope, no pool or credential logging and closes its socket',async()=>{
  const f=fixture();assert.equal((await f.smtp.sendPrivateEmailSmtp(fixtureAccount,'buyer@example.test','Subject','Body')).messageId,'<fixture@example.test>');
  const call=f.calls[0],options=call.options;
  assert.equal(options.host,'mail.privateemail.com');assert.equal(options.port,465);assert.equal(options.secure,true);assert.equal(options.pool,false);
  assert.equal(options.tls.rejectUnauthorized,true);assert.equal(options.tls.servername,'mail.privateemail.com');assert.equal(options.logger,false);assert.equal(options.debug,false);
  assert.deepEqual(JSON.parse(JSON.stringify(call.message.envelope)),{from:fixtureAccount.user,to:['buyer@example.test']});
  assert.ok(call.closed&&f.sockets[0].destroyed);assert.equal(f.deadlines.size,0);
});
await test('a no-account verification helper never receives authentication or a message envelope',async()=>{
  const f=fixture(),result=await f.smtp.verifyPrivateEmailSmtp();
  assert.equal(result.authenticationChecked,false);assert.equal(f.calls[0].operation,'verify');
  assert.equal(f.calls[0].options.auth,undefined);assert.equal(f.calls[0].message,undefined);
  assert.ok(f.calls[0].closed&&f.sockets[0].destroyed);
});
await test('explicit verification checks only its independent account credentials without sending mail',async()=>{
  const f=fixture(),result=await f.smtp.verifyPrivateEmailSmtp(fixtureAccount);
  assert.equal(result.authenticationChecked,true);assert.equal(f.calls[0].operation,'verify');assert.equal(f.calls[0].message,undefined);
  assert.equal(f.calls[0].options.auth.user,fixtureAccount.user);
});
await test('wrong sender, cross-brand mailbox and missing credentials fail before any socket is opened',async()=>{
  for(const change of [{from:'another@karuu.net'},{brand:'jkj-plus'},{password:''},{password:'unsafe\nfixture'}]){
    const f=fixture();await assert.rejects(f.smtp.sendPrivateEmailSmtp({...fixtureAccount,...change},'buyer@example.test','Subject','Body'),error=>error.code==='mail_not_configured');
    assert.equal(f.calls.length,0);assert.equal(f.sockets.length,0);
  }
});
await test('an unverified TLS peer cannot reach the SMTP operation and is closed without exposing provider details',async()=>{
  const f=fixture();f.setAuthorized(false);
  await assert.rejects(f.smtp.verifyPrivateEmailSmtp(),error=>error.code==='mail_delivery_unavailable'&&!error.message.includes('peer'));
  assert.ok(f.calls[0].closed&&f.sockets[0].destroyed);
});
await test('a Message-ID without the exact recipient and final DATA acceptance is not a send receipt',async()=>{
  for(const change of [{accepted:[]},{accepted:['other@example.test']},{rejected:['buyer@example.test']},{response:'450 try later'},{messageId:''}]){
    const f=fixture();f.setResult({messageId:'<fixture@example.test>',accepted:['buyer@example.test'],rejected:[],response:'250 queued fixture-only',...change});
    await assert.rejects(f.smtp.sendPrivateEmailSmtp(fixtureAccount,'buyer@example.test','Subject','Body'),error=>error.code==='mail_delivery_unavailable');
    assert.ok(f.calls[0].closed&&f.sockets[0].destroyed);
  }
});
await test('SMTP deadline closes in-flight work and late acceptance never converts an unknown result to success',async()=>{
  const f=fixture();f.hang();const sending=f.smtp.sendPrivateEmailSmtp(fixtureAccount,'buyer@example.test','Subject','Body');
  const rejected=assert.rejects(sending,error=>error.code==='mail_delivery_unavailable'&&error.message.includes('unconfirmed'));
  await new Promise(resolve=>setImmediate(resolve));f.expire();await rejected;
  assert.ok(f.calls[0].closed&&f.sockets[0].destroyed);assert.equal(f.deadlines.size,0);
  f.acceptLate({messageId:'<late@example.test>',accepted:['buyer@example.test'],rejected:[],response:'250 late acceptance'});
  await new Promise(resolve=>setImmediate(resolve));await assert.rejects(sending,error=>error.code==='mail_delivery_unavailable');assert.equal(f.calls.length,1);
});
await test('provider failure and invalid message input never expose credentials or produce an accepted result',async()=>{
  const f=fixture();f.setFailure('Sensitive fixture detail');
  await assert.rejects(f.smtp.sendPrivateEmailSmtp(fixtureAccount,'buyer@example.test','Subject','Body'),error=>error.code==='mail_delivery_unavailable'&&!error.message.includes('Sensitive'));
  assert.ok(f.calls[0].closed&&f.sockets[0].destroyed);
  const bad=fixture();await assert.rejects(bad.smtp.sendPrivateEmailSmtp(fixtureAccount,'buyer@example.test','Subject\nInjected: value','Body'),error=>error.code==='invalid_mail_message');assert.equal(bad.calls.length,0);
});
await test('actual workerd and Nodemailer verify the public PrivateEmail TLS/EHLO path without account authentication or email',async()=>{
  const built=await build({
    stdin:{contents:`import {verifyPrivateEmailSmtp} from './src/lib/server/smtp-mail.ts';
      export default {async fetch(){try{return Response.json(await verifyPrivateEmailSmtp());}catch(error){return Response.json({code:error.code||'smtp_probe_failed'},{status:error.status||503});}}};`,resolveDir:process.cwd(),sourcefile:'no-auth-smtp-worker.ts'},
    bundle:true,write:false,format:'esm',platform:'node',target:'es2022',external:['node:*'],
  });
  const runtime=new Miniflare(convertV4MiniflareOptions({modules:true,script:built.outputFiles[0].text,compatibilityDate:'2026-09-17',compatibilityFlags:['nodejs_compat'],log:undefined}));
  try{
    const response=await runtime.dispatchFetch('https://fixture.test/no-auth-smtp'),result=await response.json();
    assert.equal(response.status,200,JSON.stringify(result));
    assert.deepEqual(result,{server:'mail.privateemail.com',port:465,tlsVerified:true,authenticationChecked:false});
    console.log('Actual workerd + Nodemailer 10.1.0: verified PrivateEmail TLS/EHLO/QUIT; no credentials, AUTH, MAIL FROM, RCPT TO, DATA or email.');
  }finally{await runtime.dispose();}
});
