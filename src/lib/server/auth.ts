import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { fail, hash, text, uuid } from './core';
import { limit, query, transaction } from './db';

const scrypt=promisify(scryptCallback);
const cookieName='karuu_session';
export type User={id:string,email:string,role:'customer'|'admin',brands:string[]};
export function email(value:unknown) {
  const result=text(value,254).toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) fail(400,'invalid_email','Provide a valid email address.');
  return result;
}
export function mailConfigured() { return Boolean(process.env.KARUU_MAIL_ENDPOINT && process.env.KARUU_MAIL_TOKEN && process.env.KARUU_SITE_ORIGIN); }
export async function sendMail(to:string,subject:string,message:string,brand='karuu',deliveryKey?:string) {
  const endpoint=brand==='jkj-plus'?process.env.JKJ_MAIL_ENDPOINT:process.env.KARUU_MAIL_ENDPOINT;
  const token=brand==='jkj-plus'?process.env.JKJ_MAIL_TOKEN:process.env.KARUU_MAIL_TOKEN;
  if(!endpoint || !token || !endpoint.startsWith('https://')) fail(503,'mail_not_configured','The email delivery service is not configured.');
  const result=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`,...(deliveryKey?{'Idempotency-Key':deliveryKey}:{})},body:JSON.stringify({to,subject,text:message,brand}),signal:AbortSignal.timeout(10000)});
  if(!result.ok) fail(503,'mail_delivery_unavailable','The email provider could not accept the message. Please retry later.');
}
async function passwordHash(password:string) {
  const salt=randomBytes(16).toString('hex');
  const derived=await scrypt(password,salt,64) as Buffer;
  return `${salt}:${derived.toString('hex')}`;
}
export async function passwordMatches(password:string,stored:string) {
  const [salt,value]=stored.split(':');
  const actual=await scrypt(password,salt,64) as Buffer;
  const expected=Buffer.from(value,'hex');
  return expected.length===actual.length && timingSafeEqual(expected,actual);
}
export async function currentUser():Promise<User|null> {
  const token=(await cookies()).get(cookieName)?.value;
  if(!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const rows=await query<User>(`SELECT u.id,u.email,u.role,u.brands FROM commerce_sessions s JOIN commerce_users u ON u.id=s.user_id
    WHERE s.token_hash=$1 AND s.expires_at>now() AND u.verified_at IS NOT NULL`,[hash(token)]);
  return rows[0]??null;
}
export async function requireUser():Promise<User> { const user=await currentUser(); if(!user) fail(401,'authentication_required','Sign in to your verified KARUU account.'); return user; }
export async function requireAdmin():Promise<User> {const user=await requireUser();if(user.role!=='admin') fail(403,'admin_required','Administrator access is required.');return user;}
export async function register(input:Record<string,unknown>) {
  if(!mailConfigured()) fail(503,'accounts_not_configured','Account email verification is not configured yet.');
  const address=email(input.email),password=typeof input.password==='string'?input.password:'';
  if(password.length<12 || password.length>128) fail(400,'password_length','Use a password containing 12–128 characters.');
  await limit(`register:${hash(address)}`,3,3600);
  await limit('register:global',200,3600);
  const token=randomBytes(32).toString('hex'),id=uuid(),stored=await passwordHash(password);
  const existing=await query<{id:string,verified_at:string|null}>('SELECT id,verified_at FROM commerce_users WHERE email=$1',[address]);
  // Same public response for existing accounts. Never overwrite a verified account.
  if(existing[0]?.verified_at) return {verificationRequired:true};
  const userId=existing[0]?.id??id;
  await transaction(async client=>{
    await client.query(`INSERT INTO commerce_users(id,email,display_name,password_hash) VALUES($1,$2,$3,$4)
      ON CONFLICT(email) DO UPDATE SET password_hash=CASE WHEN commerce_users.verified_at IS NULL THEN EXCLUDED.password_hash ELSE commerce_users.password_hash END`,[userId,address,text(input.displayName,100)||'KARUU member',stored]);
    await client.query('DELETE FROM commerce_verifications WHERE user_id=$1',[userId]);
    await client.query(`INSERT INTO commerce_verifications(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '30 minutes')`,[hash(token),userId]);
  });
  await sendMail(address,'Verify your KARUU account',`Confirm your account within 30 minutes: ${process.env.KARUU_SITE_ORIGIN}/api/auth/verify?token=${token}\nIf you did not request this, ignore this message.`);
  return {verificationRequired:true};
}
export async function verify(token:string) {
  if(!/^[a-f0-9]{64}$/.test(token)) fail(400,'invalid_token','This verification link is invalid or expired.');
  await transaction(async client=>{
    const result=await client.query('DELETE FROM commerce_verifications WHERE token_hash=$1 AND expires_at>now() RETURNING user_id',[hash(token)]);
    if(!result.rows[0]) fail(400,'invalid_token','This verification link is invalid or expired.');
    await client.query('UPDATE commerce_users SET verified_at=now() WHERE id=$1',[result.rows[0].user_id]);
  });
  return {verified:true};
}
export async function login(input:Record<string,unknown>) {
  const address=email(input.email),password=typeof input.password==='string'?input.password:'';
  if(password.length>128) fail(400,'invalid_password','Invalid credentials.');
  await limit(`login:${hash(address)}`,10,900);
  const rows=await query<User&{password_hash:string,verified_at:string|null}>('SELECT id,email,role,brands,password_hash,verified_at FROM commerce_users WHERE email=$1',[address]);
  const row=rows[0];
  const matches=await passwordMatches(password,row?.password_hash??`00000000000000000000000000000000:${'00'.repeat(64)}`);
  if(!row || !matches || !row.verified_at) fail(401,'invalid_credentials','Email or password is invalid, or the account has not been verified.');
  const token=randomBytes(32).toString('hex');
  await query(`INSERT INTO commerce_sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '7 days')`,[hash(token),row.id]);
  const user:User={id:row.id,email:row.email,role:row.role,brands:row.brands};
  const response=NextResponse.json({user},{headers:{'Cache-Control':'no-store'}});
  response.cookies.set(cookieName,token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:7*86400});
  return response;
}
export async function logout() {
  const token=(await cookies()).get(cookieName)?.value;
  if(token) await query('DELETE FROM commerce_sessions WHERE token_hash=$1',[hash(token)]);
  const response=NextResponse.json({signedOut:true});response.cookies.set(cookieName,'',{httpOnly:true,path:'/',maxAge:0});return response;
}
export async function requestPasswordReset(input:Record<string,unknown>){
  if(!mailConfigured())fail(503,'accounts_not_configured','Account email delivery is not configured.');
  const address=email(input.email);await limit(`reset:${hash(address)}`,3,3600);await limit('reset:global',200,3600);
  const user=(await query<{id:string}>('SELECT id FROM commerce_users WHERE email=$1 AND verified_at IS NOT NULL',[address]))[0];
  if(user){
    const token=randomBytes(32).toString('hex');
    await transaction(async client=>{await client.query('DELETE FROM commerce_password_resets WHERE user_id=$1',[user.id]);await client.query("INSERT INTO commerce_password_resets(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '15 minutes')",[hash(token),user.id]);});
    await sendMail(address,'Reset your KARUU password',`Reset your password within 15 minutes: ${process.env.KARUU_SITE_ORIGIN}/account?reset=${token}\nIf you did not request this, ignore the message.`);
  }
  return {message:'If a verified account exists, a password-reset email has been requested.'};
}
export async function confirmPasswordReset(input:Record<string,unknown>){
  const token=text(input.token,64),password=typeof input.password==='string'?input.password:'';
  if(!/^[a-f0-9]{64}$/.test(token)||password.length<12||password.length>128)fail(400,'invalid_reset','Provide a valid reset link and a password of 12–128 characters.');
  const stored=await passwordHash(password);
  await transaction(async client=>{
    const row=(await client.query('DELETE FROM commerce_password_resets WHERE token_hash=$1 AND expires_at>now() RETURNING user_id',[hash(token)])).rows[0];
    if(!row)fail(400,'reset_expired','This reset link is invalid or expired.');
    await client.query('UPDATE commerce_users SET password_hash=$1 WHERE id=$2',[stored,row.user_id]);
    await client.query('DELETE FROM commerce_sessions WHERE user_id=$1',[row.user_id]);
  });return {passwordReset:true};
}
