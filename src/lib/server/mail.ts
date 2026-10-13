import { cloudflareEnvironment } from './cloudflare';
import { fail } from './core';

export type MailBrand='karuu'|'jkj-plus';
export type MailAcceptance={accepted:true,provider:'relay'|'cloudflare',messageId:string|null,providerIdempotency:boolean};
type EmailBinding={send:(message:{from:string,to:string,subject:string,text:string})=>Promise<{messageId:string}>};
type MailConfiguration=
  | {provider:'relay',endpoint:string,token:string,brand:MailBrand}
  | {provider:'cloudflare',from:string,binding:EmailBinding,brand:MailBrand};

function prefix(brand:string):'KARUU'|'JKJ'|null {return brand==='karuu'?'KARUU':brand==='jkj-plus'?'JKJ':null;}
function value(env:Record<string,unknown>|null,key:string):string {
  const candidate=env?.[key]??process.env[key];
  return typeof candidate==='string'?candidate.trim():'';
}
function address(value:string):boolean {return value.length<=254&&/^[^\s@<>\x00-\x1f\x7f]+@[^\s@<>\x00-\x1f\x7f]+\.[^\s@<>\x00-\x1f\x7f]+$/.test(value);}
function relayEndpoint(endpoint:string):boolean {
  try{const url=new URL(endpoint);return url.protocol==='https:'&&!url.username&&!url.password;}catch{return false;}
}
async function configuration(brand:string):Promise<MailConfiguration|null> {
  const scope=prefix(brand);
  if(!scope)return null;
  const env=await cloudflareEnvironment();
  const provider=value(env,`${scope}_MAIL_PROVIDER`)||'relay';
  if(provider==='relay') {
    const endpoint=value(env,`${scope}_MAIL_ENDPOINT`),token=value(env,`${scope}_MAIL_TOKEN`);
    return relayEndpoint(endpoint)&&token?{provider,endpoint,token,brand:brand as MailBrand}:null;
  }
  if(provider==='cloudflare') {
    const from=value(env,`${scope}_MAIL_FROM`),binding=env?.[`${scope}_EMAIL`] as EmailBinding|undefined;
    return address(from)&&binding&&typeof binding.send==='function'?{provider,from,binding,brand:brand as MailBrand}:null;
  }
  // Unknown providers and unconfigured brands never fall back to another sender.
  return null;
}
export async function brandMailConfigured(brand:string='karuu'):Promise<boolean> {
  try{return Boolean(await configuration(brand));}catch{return false;}
}
export function brandMailSupportsIdempotency(brand:string):boolean {
  const scope=prefix(brand);
  if(!scope)return false;
  const provider=process.env[`${scope}_MAIL_PROVIDER`]?.trim()||'relay';
  return provider==='relay'&&process.env[`${scope}_MAIL_IDEMPOTENCY_CONFIRMED`]==='true';
}
export async function sendBrandMail(to:string,subject:string,message:string,brand:string='karuu',deliveryKey?:string):Promise<MailAcceptance> {
  let configured:MailConfiguration|null;
  try{configured=await configuration(brand);}catch{configured=null;}
  if(!configured)fail(503,'mail_not_configured','The email delivery service for this brand is not configured.');
  if(!address(to)||!subject||subject.length>500||/[\x00-\x1f\x7f]/.test(subject)||typeof message!=='string'||message.length>100000||(deliveryKey&&(/[\x00-\x1f\x7f]/.test(deliveryKey)||deliveryKey.length>200))) {
    fail(400,'invalid_mail_message','Provide a valid recipient and email message.');
  }
  if(configured.provider==='cloudflare') {
    // Structured Email Service API, not legacy EmailMessage routing.
    // https://developers.cloudflare.com/email-service/api/send-emails/workers-api/
    // Its documented interface has no provider idempotency parameter.
    let receipt:{messageId:string};
    try{receipt=await configured.binding.send({from:configured.from,to,subject,text:message});}catch{
      fail(503,'mail_delivery_unavailable','The email provider could not accept the message. Please retry later.');
    }
    if(!receipt||typeof receipt.messageId!=='string'||!receipt.messageId.trim()||receipt.messageId.length>500||/[\x00-\x1f\x7f]/.test(receipt.messageId)) {
      fail(503,'mail_delivery_unavailable','The email provider did not confirm acceptance of the message.');
    }
    return {accepted:true,provider:'cloudflare',messageId:receipt.messageId,providerIdempotency:false};
  }
  let result:Response;
  try{
    result=await fetch(configured.endpoint,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${configured.token}`,...(deliveryKey?{'Idempotency-Key':deliveryKey}:{})},body:JSON.stringify({to,subject,text:message,brand:configured.brand}),signal:AbortSignal.timeout(10000)});
  }catch{fail(503,'mail_delivery_unavailable','The email provider could not accept the message. Please retry later.');}
  if(!result.ok)fail(503,'mail_delivery_unavailable','The email provider could not accept the message. Please retry later.');
  return {accepted:true,provider:'relay',messageId:null,providerIdempotency:brandMailSupportsIdempotency(brand)};
}
