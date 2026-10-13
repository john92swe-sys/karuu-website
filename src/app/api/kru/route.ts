import { api,body,sameOrigin } from '@/lib/server/http';
import { fail,kruEligibility } from '@/lib/server/core';
import { requireUser } from '@/lib/server/auth';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(){return api(async()=>({enabled:false,status:'not_enabled',reason:kruEligibility({}).reason}));}
export async function POST(request:Request){return api(async()=>{
  sameOrigin(request);await requireUser();const input=await body(request);
  // Caller claims never become verified eligibility. There is no signer or mint action here.
  const decision=kruEligibility({market:typeof input.market==='string'?input.market:undefined,channel:typeof input.channel==='string'?input.channel:undefined,verified:false,approved:false});
  fail(input.market==='CN'||!input.market?403:503,'kru_unavailable',decision.reason);
});}
