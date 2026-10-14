import { cloudflareEnvironment } from './cloudflare';
import { fail } from './core';

export type MailBrand='karuu'|'jkj-plus';
export type MailAcceptance={accepted:true,provider:'relay'|'cloudflare'|'smtp',messageId:string|null,providerIdempotency:boolean};
type EmailBinding={send:(message:{from:string,to:string,subject:string,text:string})=>Promise<{messageId:string}>};
type MailConfiguration=
  | {provider:'relay',endpoint:string,token:string,brand:MailBrand,idempotency:boolean}
  | {provider:'cloudflare',from:string,binding:EmailBinding,brand:MailBrand}
  | {provider:'smtp',from:string,user:string,password:string,brand:MailBrand};

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
    return relayEndpoint(endpoint)&&token?{provider,endpoint,token,brand:brand as MailBrand,idempotency:value(env,`${scope}_MAIL_IDEMPOTENCY_CONFIRMED`)==='true'}:null;
  }
  if(provider==='cloudflare') {
    const from=value(env,`${scope}_MAIL_FROM`),binding=env?.[`${scope}_EMAIL`] as EmailBinding|undefined;
    return address(from)&&binding&&typeof binding.send==='function'?{provider,from,binding,brand:brand as MailBrand}:null;
  }
  if(provider==='smtp') {
    const from=value(env,`${scope}_MAIL_FROM`),user=value(env,`${scope}_SMTP_USER`),password=value(env,`${scope}_SMTP_PASSWORD`);
    const domain=brand==='karuu'?'karuu.net':'jkjplus.com';
    return address(from)&&address(user)&&user.toLowerCase().endsWith('@'+domain)&&from.toLowerCase()===user.toLowerCase()&&password&&password.length<=500&&!/[\x00-\x1f\x7f]/.test(password)?{provider,from,user,password,brand:brand as MailBrand}:null;
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
export async function brandMailRetryConfigured(brand:string):Promise<boolean> {
  try{const configured=await configuration(brand);return configured?.provider==='relay'&&configured.idempotency;}catch{return false;}
}
export async function sendBrandMail(to:string,subject:string,message:string,brand:string='karuu',deliveryKey?:string):Promise<MailAcceptance> {
  let configured:MailConfiguration|null;
  try{configured=await configuration(brand);}catch{configured=null;}
  if(!configured)fail(503,'mail_not_configured','The email delivery service for this brand is not configured.');
  if(!address(to)||!subject||subject.length>500||/[\x00-\x1f\x7f]/.test(subject)||typeof message!=='string'||message.length>100000||(deliveryKey&&(/[\x00-\x1f\x7f]/.test(deliveryKey)||deliveryKey.length>200))) {
    fail(400,'invalid_mail_message','Provide a valid recipient and email message.');
  }
  if(configured.provider==='smtp') {
    const {sendPrivateEmailSmtp}=await import('./smtp-mail');
    const receipt=await sendPrivateEmailSmtp(configured,to,subject,message);
    return {accepted:true,provider:'smtp',messageId:receipt.messageId,providerIdempotency:false};
  }
  if(configured.provider==='cloudflare') {
    // Structured Email Service API, not legacy EmailMessage routing.
    // https://developers.cloudflare.com/email-service/api/send-emails/workers-api/
    // Its documented interface has no provider idempotency parameter.
    let receipt:{messageId:string},deadline:ReturnType<typeof setTimeout>|undefined;
    try{
      receipt=await Promise.race([
        configured.binding.send({from:configured.from,to,subject,text:message}),
        new Promise<never>((_resolve,reject)=>{deadline=setTimeout(()=>reject(new Error('Mail acceptance deadline')),10000);}),
      ]);
    }catch{
      // The binding has no cancellation or idempotency parameter. A deadline can
      // expire after acceptance, so the outbox must preserve manual reconciliation.
      fail(503,'mail_delivery_unavailable','The email provider acceptance is unconfirmed. Review its delivery record before retrying.');
    }finally{if(deadline!==undefined)clearTimeout(deadline);}
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
  return {accepted:true,provider:'relay',messageId:null,providerIdempotency:configured.idempotency};
}
