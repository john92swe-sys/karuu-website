import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomUUID} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {build} from 'esbuild';
import {PGlite} from '@electric-sql/pglite';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {prepareCommerceSchemaMigration} from './lib/commerce-schema-migration.mjs';
import {prepareCommerceRuntimeRole} from './lib/commerce-runtime-role.mjs';

// The only replaced application dependency is SQL transport, bridged to PGlite.
// Actual upload/media/admin code, FixedLengthStream and native R2 run in workerd.
// Independent admin branches are stubbed to reject any payment/CMS operation.
const root=path.resolve(process.env.KARUU_TEST_DIR??'work/private-upload-native-tests');
fs.mkdirSync(root,{recursive:true});
const directory=fs.mkdtempSync(path.join(root,'isolated-'));
const db=new PGlite(path.join(directory,'db'));await db.waitReady;
const base=fs.readFileSync('db/001-commerce.sql','utf8');
await db.exec('CREATE ROLE anon; CREATE ROLE authenticated');
await db.exec(prepareCommerceSchemaMigration(base).sql);
await db.exec(prepareCommerceRuntimeRole(base).sql);
const searchPath='SET search_path TO karuu_commerce,pg_catalog,pg_temp';await db.exec(searchPath);
const user={id:randomUUID(),email:'operator@example.test',role:'admin',brands:['karuu']};
await db.query('INSERT INTO commerce_users(id,email,display_name,password_hash,verified_at,role) VALUES($1,$2,$3,$4,now(),$5)',[user.id,user.email,'Isolated operator','fixture','admin']);
let active=false,updateFails=false,phaseHook=null;
const sqlTrace=[],storageTrace=[];
async function runtimeQuery(sql,values=[]){
  sqlTrace.push(sql);
  if(sql==='BEGIN'){assert.equal(active,false);await db.exec('SET SESSION AUTHORIZATION karuu_web; '+searchPath);active=true;}
  try{if(updateFails&&sql.startsWith('UPDATE commerce_assets'))throw Error('Isolated final SQL failure');return await db.query(sql,values);}
  // PGlite's embedded authenticated identity follows SET SESSION AUTHORIZATION;
  // RESET does not restore its initial postgres identity. Restore it explicitly
  // only in this local fixture, never in the runtime application/remote database.
  finally{if(sql==='COMMIT'||sql==='ROLLBACK'){active=false;await db.exec('SET SESSION AUTHORIZATION postgres; '+searchPath);}}
}
const bridge=`
async function rpc(value){const response=await globalThis.__fixtureEnv.FIXTURE_DB.fetch('https://fixture.test/rpc',{method:'POST',body:JSON.stringify(value)});const result=await response.json();if(result.error)throw new Error(result.error);return result;}
export async function query(sql,values=[]){return (await rpc({sql,values})).rows;}
export async function transaction(work){const client={query:(sql,values=[])=>rpc({sql,values})};try{await client.query('BEGIN');const result=await work(client);await client.query('COMMIT');return result;}catch(error){await client.query('ROLLBACK');throw error;}}
export async function audit(client,actor,action,target,reason,detail={}){await client.query('INSERT INTO commerce_audit(id,actor_id,action,target,reason,detail) VALUES($1,$2,$3,$4,$5,$6)',[crypto.randomUUID(),actor,action,target,reason,JSON.stringify(detail)]);}
export async function phase(method,key){await rpc({phase:method,key});}
`;
const built=await build({
  stdin:{contents:`
    import {uploadPrivateAsset} from './src/lib/server/private-upload.ts';
    import {adminAction} from './src/lib/server/admin.ts';
    import {phase} from 'fixture-db';
    const user=${JSON.stringify(user)};
    export default {async fetch(request,env){
      process.env.KARUU_PRIVATE_MEDIA_PROVIDER='r2';
      const bucket=env.KARUU_PRIVATE_MEDIA;
      const store={head:async key=>{await phase('head',key);return bucket.head(key);},get:(key,options)=>bucket.get(key,options),put:async(key,value,options)=>{await phase('put',key);return bucket.put(key,value,options);}};
      globalThis.__fixtureEnv={...env,KARUU_PRIVATE_MEDIA:store};
      try{const url=new URL(request.url);
        if(request.headers.get('x-local-stream-disconnect')){let pulls=0;const headers=new Headers(request.headers);headers.delete('content-length');request=new Request(request.url,{method:'POST',headers,body:new ReadableStream({pull(controller){if(pulls++===0)controller.enqueue(new Uint8Array(65536));else controller.error(Error('Local native disconnect'));}})});}
        const result=url.pathname==='/admin'?await adminAction(user,await request.json()):await uploadPrivateAsset(user,url.pathname.split('/').at(-1),request,store);return Response.json(result);}
      catch(error){return Response.json({code:error.code||'isolated_failure',message:error.message},{status:error.status||503});}
    }};`,resolveDir:process.cwd(),sourcefile:'local-upload-fixture.ts'},
  bundle:true,write:false,format:'esm',platform:'neutral',target:'es2022',external:['node:crypto'],
  plugins:[{name:'isolated-transport',setup(builder){
    builder.onResolve({filter:/^(fixture-db|\.\/db)$/},()=>({path:'db',namespace:'fixture'}));
    builder.onResolve({filter:/^\.\/cloudflare$/},()=>({path:'cloudflare',namespace:'fixture'}));
    for(const name of ['commerce','delivery','works','payments'])builder.onResolve({filter:new RegExp('^\\./'+name+'$')},args=>args.importer.replaceAll('\\','/').endsWith('/admin.ts')?{path:name,namespace:'fixture'}:undefined);
    builder.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:args.path==='db'?bridge:args.path==='cloudflare'?'export async function cloudflareEnvironment(){return globalThis.__fixtureEnv;}':({
      commerce:'export function status(){throw Error("Unexpected status");} export function stripeClient(){throw Error("No payments in upload fixture");}',
      delivery:'export function entitledAsset(){throw Error("Unexpected delivery branch");}',works:'export function saveCreation(){throw Error("Unexpected CMS");}',payments:'export function requestFullRefund(){throw Error("No refunds in upload fixture");}',
    })[args.path],loader:'js'}));
  }}],
});
const workerPath=path.join(directory,'upload-worker.mjs');fs.writeFileSync(workerPath,built.outputFiles[0].text);
const mf=new Miniflare(convertV4MiniflareOptions({
  modules:true,scriptPath:workerPath,compatibilityDate:'2026-09-17',compatibilityFlags:['nodejs_compat'],
  r2Buckets:['KARUU_PRIVATE_MEDIA'],r2Persist:path.join(directory,'r2'),
  serviceBindings:{FIXTURE_DB:async request=>{
    const value=await request.json();
    try{if(value.phase){assert.equal(active,false,'R2 I/O held a SQL transaction');storageTrace.push({method:value.phase,key:value.key});if(phaseHook)await phaseHook(value);return new Response('{}');}
      return Response.json(await runtimeQuery(value.sql,value.values));
    }catch(error){return Response.json({error:error.message});}
  }},
}));
const store=await mf.getR2Bucket('KARUU_PRIVATE_MEDIA');
const bytes=Buffer.from('Isolated exact private edition'),digest=createHash('sha256').update(bytes).digest('hex');
const reason=encodeURIComponent('Isolated private upload verification');
async function asset(id,hash=null,format='epub',key='private/'+id+'.'+format){await db.query('INSERT INTO commerce_assets(id,work_slug,title,format,language,object_key,content_sha256) VALUES($1,$2,$3,$4,$5,$6,$7)',[id,'local-work','Test edition',format,'en',key,hash]);}
async function ready(id){return (await db.query('SELECT delivery_verified FROM commerce_assets WHERE id=$1',[id])).rows[0].delivery_verified;}
async function upload(id,body=bytes,headers={}){const response=await mf.dispatchFetch('https://karuu.test/upload/'+id,{method:'POST',headers:{'X-KARUU-Reason':reason,...headers},body,duplex:'half'});return {status:response.status,...await response.json()};}
function stream(size,value=7){let remaining=size;return new ReadableStream({pull(controller){if(!remaining){controller.close();return;}const n=Math.min(65536,remaining);remaining-=n;controller.enqueue(new Uint8Array(n).fill(value));}});}
function streamHash(size,value=7){const hash=createHash('sha256'),chunk=Buffer.alloc(65536,value);for(let n=size;n>0;n-=chunk.length)hash.update(chunk.subarray(0,Math.min(chunk.length,n)));return hash.digest('hex');}
const large=32*1024*1024+65536;
async function admin(id,key,hash,verified=true){const response=await mf.dispatchFetch('https://karuu.test/admin',{method:'POST',body:JSON.stringify({action:'save_asset',reason:'Isolated actual object confirmation',asset:{id,workSlug:'local-work',title:'Test edition',format:'epub',language:'en',objectKey:key,contentSha256:hash,deliveryVerified:verified}})});return {status:response.status,...await response.json()};}
try{
  await test('native header/size validation fails before any R2 operation',async()=>{
    await asset('headers');const prior=storageTrace.length;
    for(const [headers,code] of [
      [{'X-KARUU-File-Bytes':'junk'},'file_size_invalid'],[{'X-KARUU-File-Bytes':String(90*1024*1024+1)},'file_too_large'],[{'X-KARUU-File-Bytes':'0'},'empty_file'],
      [{'X-KARUU-File-Bytes':'10','Content-Length':String(bytes.length)},'file_size_mismatch'],[{'X-KARUU-File-Bytes':String(bytes.length+1)},'file_size_mismatch'],
      [{'X-KARUU-Expected-Sha256':'bad'},'file_digest_required'],[{'X-KARUU-Expected-Sha256':digest},'edition_changed'],
    ]){const result=await upload('headers',bytes,headers);assert.equal(result.code,code,JSON.stringify(result));}
    assert.equal(storageTrace.length,prior);assert.equal(await ready('headers'),false);
  });
  await test('large uploads require a server-registered complete SHA, never a client-only digest',async()=>{
    await asset('no-digest',null,'mp3');const result=await upload('no-digest',stream(large),{'X-KARUU-File-Bytes':String(large)});
    assert.equal(result.status,400);assert.equal(result.code,'file_digest_required');assert.equal(await ready('no-digest'),false);assert.equal(await store.head('private/no-digest.mp3'),null);
  });
  await test('actual workerd streams MP3/FLAC sized editions and the 90 MiB boundary with native full-object SHA proof',async()=>{
    for(const [id,size,format] of [['mp3-size',61531210,'mp3'],['flac-size',78239725,'flac'],['maximum-size',90*1024*1024,'mp3']]){
      const hash=streamHash(size);await asset(id,hash,format);
      const result=await upload(id,stream(size),{'X-KARUU-File-Bytes':String(size),'X-KARUU-Expected-Sha256':hash});
      assert.equal(result.status,200,JSON.stringify(result));assert.equal(result.bytes,size);assert.equal(result.sha256,hash);assert.equal(result.recovered,false);assert.equal(await ready(id),true);
      const object=await store.get('private/'+id+'.'+format);assert.equal(object.size,size);assert.equal(Buffer.from(object.checksums.sha256).toString('hex'),hash);
      const verify=createHash('sha256');let count=0;for await(const chunk of object.body){count+=chunk.byteLength;verify.update(chunk);}assert.equal(count,size);assert.equal(verify.digest('hex'),hash);
    }
  });
  await test('native R2 rejects a complete stream with wrong SHA without an object or delivery confirmation',async()=>{
    await asset('wrong-sha','0'.repeat(64),'mp3');const result=await upload('wrong-sha',stream(large),{'X-KARUU-File-Bytes':String(large)});
    assert.equal(result.status,503);assert.equal(result.code,'upload_unconfirmed');assert.equal(await ready('wrong-sha'),false);assert.equal(await store.head('private/wrong-sha.mp3'),null);
  });
  await test('native FixedLengthStream rejects both truncated and excess bodies without a verified object',async()=>{
    const hash=streamHash(large);for(const [id,delta] of [['truncated',-1],['excess',1]]){
      await asset(id,hash,'mp3');const result=await upload(id,stream(large+delta),{'X-KARUU-File-Bytes':String(large)});
      assert.equal(result.status,503,JSON.stringify(result));assert.equal(result.code,'upload_unconfirmed');assert.equal(await ready(id),false);assert.equal(await store.head('private/'+id+'.mp3'),null);
    }
  });
  await test('actual Worker source stream failure cancels the R2 pump without delivery confirmation',async()=>{
    await asset('disconnect',streamHash(large),'mp3');const result=await upload('disconnect',bytes,{'X-KARUU-File-Bytes':String(large),'X-Local-Stream-Disconnect':'true'});
    assert.equal(result.status,503,JSON.stringify(result));assert.equal(result.code,'upload_unconfirmed');assert.equal(await ready('disconnect'),false);assert.equal(await store.head('private/disconnect.mp3'),null);
  });
  await test('unknown/pre-existing wrong objects and an atomic creation race after HEAD cannot be overwritten',async()=>{
    const other=Buffer.from('Another exact edition'),otherHash=createHash('sha256').update(other).digest('hex');
    for(const [id,proof] of [['unverified',false],['other-edition',true]]){
      await asset(id);const key='private/'+id+'.epub';await store.put(key,other,proof?{sha256:otherHash}:undefined);
      assert.equal((await upload(id)).code,'private_object_exists');assert.equal(await ready(id),false);assert.equal(await (await store.get(key)).text(),other.toString());
    }
    await asset('atomic-race');phaseHook=async value=>{if(value.phase==='put'){phaseHook=null;await store.put(value.key,other,{sha256:otherHash});}};
    assert.equal((await upload('atomic-race')).code,'private_object_exists');assert.equal(await ready('atomic-race'),false);assert.equal(await (await store.get('private/atomic-race.epub')).text(),other.toString());phaseHook=null;
  });
  await test('same-content conditional creation and SQL-finalization retry recover without replacement',async()=>{
    await asset('same-race');phaseHook=async value=>{if(value.phase==='put'){phaseHook=null;await store.put(value.key,bytes,{sha256:digest});}};
    const raced=await upload('same-race');assert.equal(raced.status,200);assert.equal(raced.recovered,true);phaseHook=null;
    await asset('recover');updateFails=true;assert.equal((await upload('recover')).status,503);assert.equal(await ready('recover'),false);updateFails=false;
    const before=await store.head('private/recover.epub'),recovered=await upload('recover');assert.equal(recovered.status,200);assert.equal(recovered.recovered,true);assert.equal((await store.head('private/recover.epub')).etag,before.etag);
    const actions=(await db.query("SELECT action FROM commerce_audit WHERE target='recover' ORDER BY created_at")).rows.map(r=>r.action);assert.deepEqual(actions,['private_file_upload_started','private_file_upload_started','private_file_upload']);
  });
  await test('large stream conditional race cancels promptly and retains the winning verified object',async()=>{
    const hash=streamHash(large);await asset('large-race',hash,'mp3');
    // The competing object is fixture preparation in Node; the application
    // request remains streamed inside workerd and never allocates this buffer.
    phaseHook=async value=>{if(value.phase==='put'){phaseHook=null;await store.put(value.key,Buffer.alloc(large,7),{sha256:hash});}};
    const result=await upload('large-race',stream(large),{'X-KARUU-File-Bytes':String(large)});assert.equal(result.status,200,JSON.stringify(result));assert.equal(result.recovered,true);assert.equal(await ready('large-race'),true);phaseHook=null;
    const prior=await store.head('private/large-race.mp3');const recovered=await upload('large-race',stream(large,9),{'X-KARUU-File-Bytes':String(large)});
    assert.equal(recovered.status,200);assert.equal(recovered.recovered,true);assert.equal((await store.head('private/large-race.mp3')).etag,prior.etag);
  });
  await test('edition/admin changes during storage prevent final delivery confirmation',async()=>{
    await asset('changed');phaseHook=async value=>{if(value.phase==='put'){phaseHook=null;await db.query("UPDATE commerce_assets SET language='sv' WHERE id='changed'");}};
    assert.equal((await upload('changed')).code,'edition_changed');assert.equal(await ready('changed'),false);phaseHook=null;
    await asset('revoked');phaseHook=async value=>{if(value.phase==='put'){phaseHook=null;const identity=(await db.query('SELECT session_user,current_user')).rows[0];assert.equal(identity.current_user,'postgres',JSON.stringify(identity));await db.query("UPDATE commerce_users SET role='customer' WHERE id=$1",[user.id]);}};
    const revoked=await upload('revoked');assert.equal(revoked.code,'brand_denied',JSON.stringify(revoked));assert.equal(await ready('revoked'),false);phaseHook=null;await db.query("UPDATE commerce_users SET role='admin' WHERE id=$1",[user.id]);
  });
  await test('quoted edition without its committed digest cannot be assigned arbitrary replacement bytes',async()=>{
    await asset('quoted');await db.query("INSERT INTO commerce_orders(id,user_id,idempotency_key,request_hash,status,currency,total_minor,market,snapshot,consent_version,consent_at) VALUES($1,$2,$3,$4,'pending',$5,$6,$7,$8,'fixture',now())",[randomUUID(),user.id,randomUUID(),'fixture-hash','SEK',100,'SE',JSON.stringify([{components:[{assetId:'quoted'}]}])]);
    assert.equal((await upload('quoted')).code,'edition_immutable');assert.equal(await store.head('private/quoted.epub'),null);
  });
  await test('save_asset needs actual native checksum proof; client deliveryVerified cannot fabricate readiness or share another key',async()=>{
    assert.equal((await admin('admin-missing','private/missing.epub',digest)).code,'file_integrity_unconfirmed');
    await store.put('private/admin-unverified.epub',bytes);assert.equal((await admin('admin-unverified','private/admin-unverified.epub',digest)).code,'file_integrity_unconfirmed');
    await store.put('private/admin-proof.epub',bytes,{sha256:digest});assert.equal((await admin('admin-wrong','private/admin-proof.epub','0'.repeat(64))).code,'file_integrity_unconfirmed');
    assert.equal((await admin('admin-proof','private/admin-proof.epub',digest)).status,200);assert.equal(await ready('admin-proof'),true);
    assert.equal((await admin('admin-collision','private/admin-proof.epub',digest)).code,'object_key_in_use');
    assert.equal((await admin('admin-draft','private/not-uploaded.epub',digest,false)).status,200);assert.equal(await ready('admin-draft'),false);
  });
  await test('all native R2 phases run outside SQL; private RLS allows ordinary locks with no advisory calls',()=>{
    assert.ok(storageTrace.some(v=>v.method==='put'));assert.ok(sqlTrace.some(sql=>sql==='LOCK TABLE commerce_assets IN SHARE ROW EXCLUSIVE MODE'));assert.ok(sqlTrace.every(sql=>!sql.includes('pg_advisory')));assert.equal(active,false);
  });
}finally{
  phaseHook=null;updateFails=false;await mf.dispose();await db.close();
  if(!directory.startsWith(root+path.sep)||!path.basename(directory).startsWith('isolated-'))throw Error('Unsafe native upload test cleanup');
  fs.rmSync(directory,{recursive:true,force:true});
}
console.log('Actual local workerd/R2/FixedLengthStream and PGlite private schema + runtime RLS; synthetic bytes only. No remote upload, mother file, account grant, customer message or payment. Remote Hyperdrive is outside this fixture scope.');
