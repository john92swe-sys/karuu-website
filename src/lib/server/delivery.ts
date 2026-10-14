import { createHmac, timingSafeEqual } from 'node:crypto';
import { User, requireUser } from './auth';
import { fail, identifier } from './core';
import { query } from './db';
import { Asset, mediaConfigured } from './commerce';
import { readPrivateObject } from './private-media';

function sign(value:string){return createHmac('sha256',process.env.KARUU_DELIVERY_SIGNING_SECRET!).update(value).digest('base64url');}
export async function entitledAsset(user:User,assetId:string):Promise<Asset>{
  const rows=await query<Asset>(`SELECT a.* FROM commerce_assets a WHERE a.id=$1 AND EXISTS(SELECT 1 FROM commerce_entitlements e WHERE e.asset_id=a.id AND e.user_id=$2 AND e.status='active')`,[assetId,user.id]);
  if(!rows[0]) fail(404,'content_not_found','This account does not have active access to that content.');
  if(!rows[0].rights_verified||!rows[0].delivery_verified) fail(503,'file_temporarily_unavailable','Your purchase is recorded; this file is temporarily unavailable. Please retry or contact support.');
  return rows[0];
}
export async function grantAccess(user:User,assetId:string){
  if(!await mediaConfigured()) fail(503,'delivery_not_configured','Private content access is not configured. Your entitlement has not been removed.');
  await entitledAsset(user,identifier(assetId));
  const expires=Math.floor(Date.now()/1000)+300;
  const payload=Buffer.from(JSON.stringify({userId:user.id,assetId,expires})).toString('base64url');
  return {url:`/api/delivery/${encodeURIComponent(assetId)}?grant=${payload}.${sign(payload)}`,expiresAt:new Date(expires*1000).toISOString()};
}
export async function deliver(request:Request,assetId:string){
  if(!await mediaConfigured()) fail(503,'delivery_not_configured','Private content access is not configured.');
  const user=await requireUser(),grant=new URL(request.url).searchParams.get('grant')??'';
  if(grant.length>2000) fail(403,'invalid_grant','This access link is invalid or expired.');
  const [payload,signature]=grant.split('.'),actual=Buffer.from(signature??''),expected=Buffer.from(sign(payload??''));
  if(actual.length!==expected.length||!timingSafeEqual(actual,expected)) fail(403,'invalid_grant','This access link is invalid or expired.');
  let decoded:{userId:string,assetId:string,expires:number};
  try{decoded=JSON.parse(Buffer.from(payload,'base64url').toString());}catch{return fail(403,'invalid_grant','This access link is invalid or expired.');}
  if(decoded.userId!==user.id||decoded.assetId!==assetId||!Number.isInteger(decoded.expires)||decoded.expires<Math.floor(Date.now()/1000)||decoded.expires>Math.floor(Date.now()/1000)+300) fail(403,'expired_grant','Create a new access link from My creations.');
  const asset=await entitledAsset(user,identifier(assetId));
  const upstream=await readPrivateObject(asset.object_key,asset.content_sha256!,request.headers.get('range'));
  const output=new Headers({'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox"});
  for(const name of ['Content-Type','Content-Length','Content-Range','Accept-Ranges']){const value=upstream.headers.get(name);if(value)output.set(name,value);}
  if(['epub','pdf'].includes(asset.format.toLowerCase()))output.set('Content-Disposition',`attachment; filename="${asset.id}.${asset.format.toLowerCase()}"`);
  return new Response(upstream.body,{status:upstream.status,headers:output});
}
