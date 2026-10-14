import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import Module from 'node:module';
import ts from 'typescript';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';

const require=Module.createRequire(import.meta.url);
Module._extensions['.ts']=function(module,filename){
  const code=ts.transpileModule(fs.readFileSync(filename,'utf8'),{
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true},
  }).outputText;
  module._compile(code,filename);
};
const media=require('../src/lib/server/private-media.ts');
const root=path.resolve('work/private-media-tests');
fs.mkdirSync(root,{recursive:true});
const directory=fs.mkdtempSync(path.join(root,'local-r2-'));
// Installed Miniflare 5 provides the official v4-options conversion bridge.
const mf=new Miniflare(convertV4MiniflareOptions({
  modules:true,
  script:'export default { fetch() { return new Response("Local test only"); } }',
  r2Buckets:['KARUU_PRIVATE_MEDIA'],
  r2Persist:directory,
}));
const store=await mf.getR2Bucket('KARUU_PRIVATE_MEDIA');
const bytes=Buffer.from('0123456789abcdefghij');
const digest=createHash('sha256').update(bytes).digest('hex');
await store.put('test/edition.mp3',bytes,{sha256:digest,httpMetadata:{contentType:'audio/mpeg'}});

try {
  await test('actual local R2 serves the exact digest and correct whole-file headers',async()=>{
    const response=await media.readPrivateR2(store,'test/edition.mp3',digest,null);
    assert.equal(response.status,200);
    assert.equal(response.headers.get('Content-Length'),String(bytes.length));
    assert.equal(response.headers.get('Content-Type'),'audio/mpeg');
    assert.equal(await response.text(),bytes.toString());
  });
  await test('actual R2 range reads support bounded, open-ended and suffix audio seeking',async()=>{
    for(const [header,expected,contentRange] of [
      ['bytes=2-5','2345','bytes 2-5/20'],
      ['bytes=18-','ij','bytes 18-19/20'],
      ['bytes=-4','ghij','bytes 16-19/20'],
      ['bytes=18-100','ij','bytes 18-19/20'],
    ]) {
      const response=await media.readPrivateR2(store,'test/edition.mp3',digest,header);
      assert.equal(response.status,206);
      assert.equal(response.headers.get('Content-Range'),contentRange);
      assert.equal(response.headers.get('Content-Length'),String(expected.length));
      assert.equal(await response.text(),expected);
    }
  });
  await test('invalid, unsatisfiable and multipart byte ranges fail before object bytes are served',async()=>{
    for(const range of ['bytes=-','bytes=-0','bytes=20-','bytes=5-2','bytes=1-2,4-5','bytes=9007199254740992-'])
      await assert.rejects(media.readPrivateR2(store,'test/edition.mp3',digest,range),{code:'invalid_range'});
  });
  await test('missing objects, absent SHA metadata and another edition never masquerade as verified delivery',async()=>{
    await assert.rejects(media.readPrivateR2(store,'missing',digest,null),{code:'file_integrity_unconfirmed'});
    await assert.rejects(media.readPrivateR2(store,'test/edition.mp3','0'.repeat(64),null),{code:'file_integrity_unconfirmed'});
    await store.put('test/unverified.mp3',bytes);
    await assert.rejects(media.readPrivateR2(store,'test/unverified.mp3',digest,null),{code:'file_integrity_unconfirmed'});
  });
  await test('an R2 replacement between metadata and body is rejected by the real conditional read',async()=>{
    await store.put('test/race.mp3',bytes,{sha256:digest});
    const changed={
      head:key=>store.head(key),
      get:async(key,options)=>{
        await store.put(key,Buffer.from('different edition'));
        return store.get(key,options);
      },
    };
    await assert.rejects(media.readPrivateR2(changed,'test/race.mp3',digest,null),{code:'file_temporarily_unavailable'});
  });
} finally {
  await mf.dispose();
  const resolved=path.resolve(directory);
  if(!resolved.startsWith(root+path.sep)||!path.basename(resolved).startsWith('local-r2-'))throw new Error('Unsafe local test cleanup');
  fs.rmSync(resolved,{recursive:true,force:true});
}
console.log('Actual local Miniflare R2; no remote bucket, published files, customer data or network payment was used.');
