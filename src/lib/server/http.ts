import { NextResponse } from 'next/server';
import { CommerceError, fail } from './core';

export async function api(work:()=>Promise<unknown>,status=200) {
  try { const value=await work(); return value instanceof Response ? value : NextResponse.json(value,{status,headers:{'Cache-Control':'no-store'}}); }
  catch(error) {
    if(error instanceof CommerceError) return NextResponse.json({error:error.message,code:error.code},{status:error.status,headers:{'Cache-Control':'no-store'}});
    // Never expose SQL, provider responses, storage URLs or credentials.
    console.error('commerce_operation_failed',error instanceof Error ? error.name : 'UnknownError');
    return NextResponse.json({error:'The service is temporarily unavailable. No success has been recorded. Please try again.',code:'service_unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});
  }
}
export function sameOrigin(request:Request) {
  const origin=request.headers.get('origin');
  const expected=process.env.KARUU_SITE_ORIGIN || new URL(request.url).origin;
  if(!origin || origin!==expected) fail(403,'origin_denied','This action must be made from the KARUU website.');
}
export async function body(request:Request):Promise<Record<string,unknown>> {
  const length=Number(request.headers.get('content-length') || 0);
  if(length>20000) fail(413,'request_too_large','The request is too large.');
  const raw=await request.text();
  if(raw.length>20000) fail(413,'request_too_large','The request is too large.');
  try { const value=JSON.parse(raw); if(!value || Array.isArray(value) || typeof value!=='object') throw new Error(); return value; }
  catch { return fail(400,'invalid_json','Provide a valid JSON object.'); }
}
