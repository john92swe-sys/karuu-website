import nodemailer, { SMTPTransportOptions } from 'nodemailer';
import { connect, TLSSocket } from 'node:tls';
import { fail } from './core';

const server='mail.privateemail.com',port=465,deadlineMs=10000;
export type PrivateEmailAccount={brand:'karuu'|'jkj-plus',user:string,password:string,from:string};
function address(value:string){return value.length<=254&&/^[^\s@<>\x00-\x1f\x7f]+@[^\s@<>\x00-\x1f\x7f]+\.[^\s@<>\x00-\x1f\x7f]+$/.test(value);}
function validateAccount(account:PrivateEmailAccount){
  const domain=account.brand==='karuu'?'karuu.net':account.brand==='jkj-plus'?'jkjplus.com':null;
  if(!domain||!address(account.user)||!address(account.from)||!account.user.toLowerCase().endsWith('@'+domain)||account.user.toLowerCase()!==account.from.toLowerCase()||!account.password||account.password.length>500||/[\x00-\x1f\x7f]/.test(account.password))fail(503,'mail_not_configured','Configure an independent PrivateEmail mailbox and its application password.');
}
async function withTransport<T>(account:PrivateEmailAccount|undefined,work:(transport:ReturnType<typeof nodemailer.createTransport>)=>Promise<T>):Promise<T>{
  if(account)validateAccount(account);
  let activeSocket:TLSSocket|undefined,deadline:ReturnType<typeof setTimeout>|undefined;
  const options:SMTPTransportOptions={
    host:server,port,secure:true,pool:false,name:account?.user.split('@')[1]??'karuu.net',
    ...(account?{auth:{user:account.user,pass:account.password}}:{}),
    tls:{servername:server,rejectUnauthorized:true,minVersion:'TLSv1.2'},
    connectionTimeout:8000,greetingTimeout:5000,socketTimeout:8000,dnsTimeout:5000,
    disableFileAccess:true,disableUrlAccess:true,logger:false,debug:false,
    getSocket(_options,callback){
      // Own the socket so a total deadline can destroy in-flight SMTP work.
      // A non-pooled Nodemailer transport's close() alone only emits close.
      const socket=connect({host:server,port,servername:server,rejectUnauthorized:true,minVersion:'TLSv1.2'});activeSocket=socket;
      let handedOff=false;
      const finish=(error:Error|null)=>{
        if(handedOff)return;handedOff=true;
        if(error){socket.destroy();callback(error);return;}
        callback(null,{connection:socket,secured:true});
      };
      socket.setTimeout(8000,()=>finish(new Error('SMTP TLS connection deadline')));
      socket.once('error',error=>finish(error));
      socket.once('close',()=>finish(new Error('SMTP TLS connection closed')));
      socket.once('secureConnect',()=>finish(socket.authorized?null:new Error('SMTP TLS peer was not authorized')));
    },
  };
  const transport=nodemailer.createTransport(options);
  try{
    return await Promise.race([
      work(transport),
      new Promise<never>((_resolve,reject)=>{deadline=setTimeout(()=>reject(new Error('SMTP acceptance deadline')),deadlineMs);}),
    ]);
  }catch{
    // A lost final DATA response may follow real acceptance. SMTP has no
    // provider idempotency contract; a repeated Message-ID does not deduplicate.
    return fail(503,'mail_delivery_unavailable','The email provider acceptance is unconfirmed. Review its delivery record before retrying.');
  }finally{
    if(deadline!==undefined)clearTimeout(deadline);
    activeSocket?.destroy();transport.close();
  }
}
export async function sendPrivateEmailSmtp(account:PrivateEmailAccount,to:string,subject:string,text:string):Promise<{messageId:string}>{
  if(!address(to)||!subject||subject.length>500||/[\x00-\x1f\x7f]/.test(subject)||typeof text!=='string'||text.length>100000)fail(400,'invalid_mail_message','Provide a valid recipient and email message.');
  return withTransport(account,async transport=>{
    const result=await transport.sendMail({from:account.from,to,subject,text,envelope:{from:account.from,to:[to]}});
    if(!Array.isArray(result.accepted)||result.accepted.length!==1||result.accepted[0]?.toLowerCase()!==to.toLowerCase()||!Array.isArray(result.rejected)||result.rejected.length||typeof result.response!=='string'||!/^250(?:[ -]|$)/.test(result.response)||typeof result.messageId!=='string'||!result.messageId.trim()||result.messageId.length>500||/[\x00-\x1f\x7f]/.test(result.messageId))fail(503,'mail_delivery_unavailable','The email provider did not confirm acceptance for this recipient.');
    return {messageId:result.messageId};
  });
}
// No route invokes this helper. With no account it only verifies TLS/EHLO/QUIT;
// explicitly supplied server-only account configuration also checks SMTP AUTH.
// Neither mode sends MAIL FROM, RCPT TO or DATA or proves mailbox delivery.
export async function verifyPrivateEmailSmtp(account?:PrivateEmailAccount){
  await withTransport(account,async transport=>{if(await transport.verify()!==true)throw new Error('SMTP verification unconfirmed');});
  return {server,port,tlsVerified:true,authenticationChecked:Boolean(account)};
}
