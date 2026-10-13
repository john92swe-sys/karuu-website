import { api, body, sameOrigin } from '@/lib/server/http';
import { receiveInquiry } from '@/lib/server/inquiries';
import { fail } from '@/lib/server/core';
export const runtime='nodejs';
export async function POST(request:Request){return api(async()=>{
  sameOrigin(request);
  let input:Record<string,unknown>;
  if(request.headers.get('content-type')?.includes('application/json'))input=await body(request);
  else{
    if(Number(request.headers.get('content-length')??0)>20000)fail(413,'request_too_large','The inquiry is too large.');
    const form=await request.formData();input={};let length=0;
    for(const [key,value]of form.entries()){if(typeof value!=='string')fail(400,'files_not_supported','Use text fields for an inquiry.');length+=key.length+value.length;input[key]=value;}
    if(length>20000)fail(413,'request_too_large','The inquiry is too large.');
  }
  return receiveInquiry(input,request.headers.get('idempotency-key')??input.inquiryKey);
},201);}
