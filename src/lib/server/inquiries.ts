import { fail, hash, idempotency, text, uuid } from './core';
import { email } from './auth';
import { audit, limit, transaction } from './db';
import { brandMailConfigured } from './mail';

const fields=['productSku','productName','productSlug','inquiryType','companyName','contactName','businessEmail','countryRegion','businessType','intendedUse','instructorStaffWear','memberRetail','teacherTraining','privateLabel','phone','estimatedQuantity','preferredProductCategories','representativeStyles','selectedColor','numberOfColors','sizeRequirements','customLogo','customLabel','customPackaging','brandingRequirement','preferredTradeTerm','requiredDeliveryDate','targetLaunchDate','message'];
export async function receiveInquiry(input:Record<string,unknown>,keyValue:unknown) {
  const brand=input.brand??'karuu';
  if(brand!=='karuu' && brand!=='jkj-plus') fail(400,'invalid_brand','Choose a supported brand.');
  if(text(input.website)) fail(400,'invalid_submission','The submission could not be accepted.');
  if(![true,'true','on'].includes(input.privacyConsent as string|boolean)) fail(400,'consent_required','Consent to handling this inquiry is required.');
  const key=idempotency(keyValue),contact=email(input.businessEmail??input.email);
  const data=Object.fromEntries(fields.map(field=>[field,text(input[field],field==='message'?4000:500)]));
  data.businessEmail=contact;data.contactName=text(input.contactName??input.name,100);data.companyName=text(input.companyName??input.company,200);
  if(!data.contactName || data.message.length<10) fail(400,'inquiry_fields_required','Provide your name and at least 10 characters describing your requirements.');
  const recipient=brand==='karuu'?(process.env.KARUU_INQUIRY_EMAIL||'john@karuu.net'):process.env.JKJ_INQUIRY_EMAIL;
  if(!recipient) fail(503,'brand_routing_not_configured','The JKJ-Plus inquiry owner is not configured. Please contact JKJ-Plus directly.');
  await limit(`inquiry:${brand}:${hash(contact)}`,5,3600);
  await limit(`inquiry:global:${brand}`,1000,3600);
  const digest=hash(JSON.stringify(data));
  return transaction(async client=>{
    const id=uuid(),reference=`${brand==='karuu'?'KARUU':'JKJ'}-${id.slice(0,8).toUpperCase()}`;
    const configured=await brandMailConfigured(brand);
    const created=await client.query(`INSERT INTO commerce_inquiries(id,reference,brand,idempotency_key,request_hash,data,notification_status) VALUES($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT(brand,idempotency_key) DO NOTHING RETURNING *`,[id,reference,brand,key,digest,JSON.stringify(data),configured?'queued':'not_configured']);
    if(!created.rows[0]) {
      const existing=await client.query('SELECT * FROM commerce_inquiries WHERE brand=$1 AND idempotency_key=$2',[brand,key]);
      if(existing.rows[0].request_hash!==digest) fail(409,'idempotency_conflict','This submission key was already used for different requirements.');
      return {id:existing.rows[0].id,reference:existing.rows[0].reference,status:'received',notification:existing.rows[0].notification_status,duplicate:true};
    }
    if(configured) await client.query('INSERT INTO commerce_outbox(id,brand,kind,reference_id,recipient) VALUES($1,$2,$3,$4,$5)',[uuid(),brand,'inquiry',id,recipient]);
    await audit(client,null,'inquiry_received',id,'Buyer submitted a project inquiry',{brand});
    return {id,reference,status:'received',notification:configured?'queued':'not_configured',duplicate:false};
  });
}
