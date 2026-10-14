import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';

// Actual custom entry, with an isolated OpenNext handler and service binding.
// No Worker, scheduler, database, mail or external fetch is contacted.
const root=path.resolve(import.meta.dirname,'..'),filename=path.join(root,'cloudflare/worker.mjs');
const source=fs.readFileSync(filename,'utf8');
const fixtureSecret='fixture-notification-private-key-1234567890';
function fixture(){
  const calls=[],fetchCalls=[],waited=[],logs=[],module={exports:{}};
  const generated={__esModule:true,DOQueueHandler:class Queue{},DOShardedTagCache:class Tag{},BucketCachePurge:class Purge{},default:{fetch:async(...args)=>{fetchCalls.push(args);return new Response('OpenNext fixture');},queue:()=> 'preserved fixture handler'}};
  let response=new Response(JSON.stringify({processed:0,providerAccepted:0,failed:0,needsReview:0}),{status:200}),failure=null;
  const binding={fetch:async request=>{calls.push(request);if(failure)throw failure;return response;}};
  const env={KARUU_NOTIFICATIONS_SCHEDULED_ENABLED:'true',KARUU_NOTIFICATION_JOB_SECRET:fixtureSecret,WORKER_SELF_REFERENCE:binding};
  const context=vm.createContext({module,exports:module.exports,require:name=>{assert.equal(name,'../.open-next/worker.js');return generated;},Request,Response,AbortSignal,
    fetch:()=>{throw new Error('External fetch forbidden');},console:new Proxy({},{get:(_,name)=>(...args)=>logs.push({name,args})}),
  });
  // A virtual .ts filename requests CommonJS for the isolated VM; .mjs would force ESM.
  const code=ts.transpileModule(source,{fileName:'notification-worker-fixture.ts',compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  vm.runInContext(code,context,{filename});
  const ctx={waitUntil:task=>waited.push(task)};
  return {worker:module.exports.default,exports:module.exports,generated,calls,fetchCalls,waited,logs,env,ctx,
    setResponse:value=>{response=value;},setFailure:value=>{failure=value;},
  };
}
const controller={cron:'fixture-only-not-configured',scheduledTime:0};
const errorCode=code=>error=>error.message===code&&!error.message.includes(fixtureSecret);

await test('actual isolated review target enables five-minute scheduling while all commerce gates stay closed',()=>{
  const config=JSON.parse(fs.readFileSync(path.join(root,'wrangler.jsonc'),'utf8'));
  assert.equal(config.name,'karuu-c-review-20261013');assert.equal(config.main,'cloudflare/worker.mjs');
  assert.equal(config.vars.KARUU_DEPLOYMENT_ENV,'preview');assert.equal(config.vars.KARUU_NOTIFICATIONS_SCHEDULED_ENABLED,'true');
  assert.deepEqual(config.triggers,{crons:['*/5 * * * *']});assert.equal(config.routes,undefined);
  for(const gate of ['KARUU_PAYMENTS_ENABLED','KARUU_LIVE_COMMERCE_APPROVED','KARUU_TAX_CONFIG_APPROVED','KARUU_DISTRIBUTION_APPROVED','KARUU_LEGAL_APPROVED'])assert.equal(config.vars[gate],'false');
  assert.equal(config.services.find(s=>s.binding==='WORKER_SELF_REFERENCE').service,config.name);
});
await test('generated fetch, default handlers and all named Durable Object exports are retained',async()=>{
  const f=fixture();assert.equal(f.worker.fetch,f.generated.default.fetch);assert.equal(f.worker.queue,f.generated.default.queue);
  for(const name of ['DOQueueHandler','DOShardedTagCache','BucketCachePurge'])assert.equal(f.exports[name],f.generated[name]);
  const request=new Request('https://karuu.example.test/creations');const response=await f.worker.fetch(request,f.env,f.ctx);
  assert.equal(await response.text(),'OpenNext fixture');assert.equal(f.fetchCalls[0][0],request);assert.equal(f.fetchCalls[0][1],f.env);assert.equal(f.calls.length,0);
});
await test('explicit schedule enablement is required before any private job call',async()=>{
  for(const flag of [undefined,'false',true,'TRUE','']){
    const f=fixture();f.env.KARUU_NOTIFICATIONS_SCHEDULED_ENABLED=flag;await f.worker.scheduled(controller,f.env,f.ctx);
    assert.equal(f.calls.length,0);assert.equal(f.waited.length,0);assert.equal(f.logs.length,0);
  }
});
await test('missing binding or malformed secret fails closed with no request and no sensitive error',async()=>{
  for(const change of [env=>delete env.WORKER_SELF_REFERENCE,env=>env.WORKER_SELF_REFERENCE={},env=>delete env.KARUU_NOTIFICATION_JOB_SECRET,env=>env.KARUU_NOTIFICATION_JOB_SECRET='too-short',env=>env.KARUU_NOTIFICATION_JOB_SECRET=fixtureSecret+'\n',env=>env.KARUU_NOTIFICATION_JOB_SECRET='x'.repeat(257)]){
    const f=fixture();change(f.env);await assert.rejects(f.worker.scheduled(controller,f.env,f.ctx),errorCode('notification_schedule_not_configured'));
    assert.equal(f.calls.length,0);assert.equal(f.logs.length,0);
  }
});
await test('one authenticated POST targets only the fixed internal path through self binding',async()=>{
  const f=fixture();f.env.KARUU_SITE_ORIGIN='https://untrusted-origin.example.test';
  await f.worker.scheduled({...controller,url:'https://untrusted-controller.example.test'},f.env,f.ctx);
  assert.equal(f.calls.length,1);assert.equal(f.waited.length,1);await f.waited[0];
  const request=f.calls[0];assert.equal(request.url,'https://karuu.internal/api/internal/notifications');assert.equal(request.method,'POST');
  assert.equal(request.headers.get('authorization'),`Bearer ${fixtureSecret}`);assert.equal(request.redirect,'manual');assert.ok(request.signal);
  assert.equal(request.headers.has('cookie'),false);assert.equal(await request.text(),'');assert.equal(f.logs.length,0);
});
await test('private endpoint rejection or redirect does not retry or leak its response',async()=>{
  for(const status of [401,403,404,500,302]){
    const f=fixture();f.setResponse(new Response(`Sensitive response ${fixtureSecret}`,{status,headers:{Location:'https://untrusted.example.test'}}));
    await assert.rejects(f.worker.scheduled(controller,f.env,f.ctx),errorCode('notification_job_failed'));
    assert.equal(f.calls.length,1);assert.equal(f.logs.length,0);
  }
});
await test('network/timeout failure is generic and has no internal automatic retry',async()=>{
  const f=fixture();f.setFailure(new Error(`Sensitive provider timeout ${fixtureSecret}`));
  await assert.rejects(f.worker.scheduled(controller,f.env,f.ctx),errorCode('notification_job_failed'));assert.equal(f.calls.length,1);assert.equal(f.logs.length,0);
});
await test('successful job counts are accepted without treating provider acceptance as delivery',async()=>{
  const f=fixture();f.setResponse(new Response(JSON.stringify({processed:2,providerAccepted:2,failed:0,needsReview:0})));
  await f.worker.scheduled(controller,f.env,f.ctx);assert.equal(f.calls.length,1);assert.equal(f.logs.length,0);
});
await test('failed or manual-review job makes scheduled invocation fail without resending',async()=>{
  for(const counts of [{processed:2,providerAccepted:1,failed:1,needsReview:1},{processed:1,providerAccepted:0,failed:1,needsReview:0}]){
    const f=fixture();f.setResponse(new Response(JSON.stringify(counts)));
    await assert.rejects(f.worker.scheduled(controller,f.env,f.ctx),errorCode('notification_job_failed'));assert.equal(f.calls.length,1);assert.equal(f.logs.length,0);
  }
});
await test('invalid JSON or inconsistent job contract fails closed without logging payload',async()=>{
  for(const body of ['invalid JSON',JSON.stringify({processed:11,providerAccepted:11,failed:0,needsReview:0}),JSON.stringify({processed:1,providerAccepted:0,failed:0,needsReview:0}),JSON.stringify({processed:0,providerAccepted:0,failed:0,needsReview:1}),JSON.stringify({processed:0,providerAccepted:0,failed:0}),JSON.stringify({processed:'1',providerAccepted:1,failed:0,needsReview:0})]){
    const f=fixture();f.setResponse(new Response(body));await assert.rejects(f.worker.scheduled(controller,f.env,f.ctx),errorCode('notification_job_failed'));assert.equal(f.calls.length,1);assert.equal(f.logs.length,0);
  }
});
