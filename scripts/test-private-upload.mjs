import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import Module from 'node:module';
import ts from 'typescript';
import { PGlite } from '@electric-sql/pglite';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';

const root=path.resolve('work/private-upload-tests');
fs.mkdirSync(root,{recursive:true});
const directory=fs.mkdtempSync(path.join(root,'isolated-'));
const database=new PGlite(path.join(directory,'db'));
await database.waitReady;
await database.exec(fs.readFileSync('db/001-commerce.sql','utf8'));
let updateFails=false;
class TestPool {
  async query(sql,values=[]){return database.query(sql,values);}
  async connect(){return {query:async(sql,values=[])=>{
    if(updateFails&&sql.startsWith('UPDATE commerce_assets'))throw new Error('Isolated commit boundary failure');
    return database.query(sql,values);
  },release(){}};}
}
const load=Module._load;
Module._load=function(name,parent,isMain){if(name==='pg')return {Pool:TestPool};return load.call(this,name,parent,isMain);};
Module._extensions['.ts']=function(module,filename){
  module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true},
  }).outputText,filename);
};
const require=Module.createRequire(import.meta.url);
const upload=require('../src/lib/server/private-upload.ts').uploadPrivateAsset;
Object.assign(process.env,{KARUU_RUNTIME:'node',KARUU_DATABASE_URL:'postgres://local-upload-test',KARUU_PRIVATE_MEDIA_PROVIDER:'r2'});
const mf=new Miniflare(convertV4MiniflareOptions({
  modules:true,script:'export default { fetch() { return new Response("Local only"); } }',
  r2Buckets:['KARUU_PRIVATE_MEDIA'],r2Persist:path.join(directory,'r2'),
}));
const store=await mf.getR2Bucket('KARUU_PRIVATE_MEDIA');
const user={id:randomUUID(),email:'operator@example.test',role:'admin',brands:['karuu']};
await database.query('INSERT INTO commerce_users(id,email,display_name,password_hash,verified_at,role) VALUES($1,$2,$3,$4,now(),$5)',[user.id,user.email,'Local operator','test-only','admin']);
const bytes=Buffer.from('isolated verified edition');
const digest=createHash('sha256').update(bytes).digest('hex');
const request=(body=bytes,headers={})=>new Request('https://karuu.test/api/admin/assets/test/file',{
  method:'POST',headers:{'Content-Type':'application/epub+zip','X-KARUU-Reason':encodeURIComponent('Isolated private upload verification'),...headers},body,
});
async function asset(id,key){await database.query('INSERT INTO commerce_assets(id,work_slug,title,format,language,object_key) VALUES($1,$2,$3,$4,$5,$6)',[id,'local-work','Test edition','epub','en',key]);}
try {
  await test('upload rejects customers, another brand, short reasons and oversize/empty bodies before storage writes',async()=>{
    await assert.rejects(upload({...user,role:'customer'},'edition',request(),store),{code:'brand_denied'});
    await assert.rejects(upload({...user,brands:['jkj-plus']},'edition',request(),store),{code:'brand_denied'});
    await assert.rejects(upload(user,'edition',request(bytes,{'X-KARUU-Reason':'short'}),store),{code:'reason_required'});
    await assert.rejects(upload(user,'edition',request(bytes,{'Content-Length':String(90*1024*1024+1)}),store),{code:'file_too_large'});
    await assert.rejects(upload(user,'edition',request(Buffer.alloc(0)),store),{code:'empty_file'});
    assert.equal((await store.list()).objects.length,0);
  });
  await test('raw upload persists checksum, audit and delivery readiness with actual local R2 while keeping rights closed',async()=>{
    await asset('edition','private/edition.epub');
    const result=await upload(user,'edition',request(),store);
    assert.equal(result.sha256,digest);assert.equal(result.bytes,bytes.length);
    const saved=(await database.query("SELECT content_sha256,delivery_verified,rights_verified FROM commerce_assets WHERE id='edition'")).rows[0];
    assert.deepEqual(saved,{content_sha256:digest,delivery_verified:true,rights_verified:false});
    assert.equal((await database.query("SELECT count(*)::int AS count FROM commerce_audit WHERE action='private_file_upload'")).rows[0].count,1);
    assert.equal(await (await store.get('private/edition.epub')).text(),bytes.toString());
  });
  await test('different bytes and a shared object key cannot overwrite another configured edition',async()=>{
    await assert.rejects(upload(user,'edition',request(Buffer.from('another edition')),store),{code:'edition_immutable'});
    await asset('collision','private/edition.epub');
    await assert.rejects(upload(user,'collision',request(),store),{code:'object_key_in_use'});
    assert.equal(await (await store.get('private/edition.epub')).text(),bytes.toString());
  });
  await test('a database failure after storage leaves delivery disabled and a same-digest retry can recover',async()=>{
    await asset('recover','private/recover.epub');updateFails=true;
    await assert.rejects(upload(user,'recover',request(),store),/Isolated commit boundary failure/);
    assert.equal((await database.query("SELECT delivery_verified FROM commerce_assets WHERE id='recover'")).rows[0].delivery_verified,false);
    assert.deepEqual((await database.query("SELECT action FROM commerce_audit WHERE target='recover'")).rows,[{action:'private_file_upload_started'}]);
    assert.ok(await store.head('private/recover.epub'));
    updateFails=false;
    const result=await upload(user,'recover',request(),store);
    assert.equal(result.deliveryVerified,true);assert.equal(result.recovered,true);
  });
} finally {
  await mf.dispose();await database.close();
  if(!directory.startsWith(root+path.sep)||!path.basename(directory).startsWith('isolated-'))throw new Error('Unsafe upload test cleanup');
  fs.rmSync(directory,{recursive:true,force:true});
}
console.log('Isolated PostgreSQL SQL and actual local R2; no remote upload, account grant or real file publication.');
