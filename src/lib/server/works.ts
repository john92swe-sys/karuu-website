import type { Creation } from '@/data/creations';
import { creations } from '@/data/creations';
import { User } from './auth';
import { fail, identifier, text } from './core';
import { audit, databaseConfigured, query, transaction } from './db';

function publicCreation(creation:Creation):Creation{
  return {id:creation.id,slug:creation.slug,title:creation.title,author:creation.author,publisher:creation.publisher,language:creation.language,summary:creation.summary,cover:creation.cover,coverAlt:creation.coverAlt,categories:creation.categories,featured:creation.featured,formats:creation.formats.map(format=>({label:format.label,status:format.status,note:format.note})),links:creation.links.map(link=>({label:link.label,format:link.format,url:link.url})),evidence:[],...(creation.aiDisclosure?{aiDisclosure:creation.aiDisclosure}:{}),...(creation.development?{development:{status:creation.development.status,version:creation.development.version,...(creation.development.imageCaption?{imageCaption:creation.development.imageCaption}:{})}}:{})};
}
export async function listPublicCreations():Promise<Creation[]>{
  try{if(!(await databaseConfigured()))return creations.map(publicCreation);}
  catch(error){console.error('creation_catalog_database_unavailable',error instanceof Error?error.name:'UnknownError');return [];}
  let rows:{slug:string,publication_status:string,data:Creation}[];
  try{rows=await query<{slug:string,publication_status:string,data:Creation}>('SELECT slug,publication_status,data FROM commerce_creations');}
  catch(error){console.error('creation_catalog_database_unavailable',error instanceof Error?error.name:'UnknownError');return [];}
  const overridden=new Set(rows.map(row=>row.slug));
  return [...creations.filter(creation=>!overridden.has(creation.slug)),...rows.filter(row=>row.publication_status==='published').map(row=>row.data)].map(publicCreation);
}
export async function getPublicCreation(slug:string){return (await listPublicCreations()).find(creation=>creation.slug===slug||creation.id===slug);}
function obj(value:unknown):Record<string,unknown>{if(!value||typeof value!=='object'||Array.isArray(value))fail(400,'invalid_creation','Provide a structured creation object.');return value as Record<string,unknown>;}
function precisePlatformLink(value:unknown){
  const data=obj(value),url=text(data.url,2000);let parsed:URL;try{parsed=new URL(url);}catch{return fail(400,'invalid_platform_url','Provide an exact HTTPS work page.');}
  const hostname=parsed.hostname.toLowerCase();
  const allowed=parsed.protocol==='https:'&& !parsed.username&&!parsed.password && (
    (hostname==='play.google.com'&&/^\/store\/(books|audiobooks)\/details\//.test(parsed.pathname)&&Boolean(parsed.searchParams.get('id'))) ||
    (/^(www\.)?amazon\.(com|co\.uk|de|se)$/.test(hostname)&&/^\/dp\/[A-Z0-9]{10}\/?$/.test(parsed.pathname)) ||
    (hostname==='payhip.com'&&/^\/b\/[a-zA-Z0-9]+$/.test(parsed.pathname)) ||
    (['www.youtube.com','youtube.com'].includes(hostname)&&parsed.pathname==='/watch'&&/^[a-zA-Z0-9_-]{11}$/.test(parsed.searchParams.get('v')??'')) ||
    (hostname==='fanqienovel.com'&&/^\/page\/\d+$/.test(parsed.pathname)) ||
    (hostname==='www.ximalaya.com'&&/^\/album\/\d+$/.test(parsed.pathname))
  );
  if(!allowed)fail(400,'invalid_platform_url','Use an exact supported publication or listening page; generic store pages and search links are not permitted.');
  const verifiedAt=text(data.verifiedAt,40),sourceUrl=text(data.sourceUrl,2000);
  if(!verifiedAt||!Number.isFinite(Date.parse(verifiedAt))||Date.parse(verifiedAt)>Date.now()||sourceUrl!==url)fail(400,'platform_evidence_required','Each platform link requires its exact sourceUrl and a past verification date.');
  return {label:text(data.label,100),format:text(data.format,50),url,verifiedAt,sourceUrl};
}
export async function saveCreation(user:User,input:Record<string,unknown>,reason:string){
  const value=obj(input.creation),slug=identifier(value.slug),id=identifier(value.id),title=text(value.title,300),publicationStatus=text(input.publicationStatus,20);
  if(!title||!['draft','published','archived'].includes(publicationStatus))fail(400,'invalid_creation','Provide the real title and a publication status.');
  const categories=value.categories;if(!Array.isArray(categories)||!categories.length||categories.some(c=>!['ebooks','audiobooks','bundles','music','games'].includes(c)))fail(400,'invalid_categories','Choose supported creation categories.');
  const cover=value.cover==null?null:text(value.cover,500);
  if(cover&&(!/^\/images\/creations\/[a-zA-Z0-9_/-]+\.(png|jpe?g|webp)$/.test(cover)||cover.includes('..')))fail(400,'approved_cover_required','Use an approved image installed under /images/creations/.');
  const formats=value.formats;if(!Array.isArray(formats)||formats.length>10)fail(400,'invalid_formats','Provide the actual editions and format statuses.');
  const normalizedFormats=formats.map(format=>{const v=obj(format),status=text(v.status);if(!['published-externally','pending'].includes(status))fail(400,'invalid_formats','Choose an accurate edition status.');return {label:text(v.label,100),status:status as 'published-externally'|'pending',note:text(v.note,1000)};});
  const links=value.links??[];if(!Array.isArray(links)||links.length>20)fail(400,'invalid_links','Provide a limited list of exact platform links.');
  const evidence=value.evidence;if(!Array.isArray(evidence)||!evidence.length||evidence.some(e=>typeof e!=='string'||!e.trim()))fail(400,'creation_evidence_required','Record sources verifying this work and its public materials.');
  const data:Creation={id,slug,title,author:text(value.author,200)||null,publisher:text(value.publisher,200)||null,language:text(value.language,100)||null,summary:text(value.summary,6000)||null,cover,coverAlt:text(value.coverAlt,300)||title,categories,featured:value.featured===true,formats:normalizedFormats,links:links.map(precisePlatformLink),evidence:evidence.map(e=>text(e,500))};
  if(value.aiDisclosure)data.aiDisclosure=text(value.aiDisclosure,1000);
  if(value.development){const d=obj(value.development);data.development={status:text(d.status,100),version:text(d.version,100)||null,...(d.imageCaption?{imageCaption:text(d.imageCaption,300)}:{})};}
  return transaction(async client=>{await client.query(`INSERT INTO commerce_creations(slug,publication_status,data) VALUES($1,$2,$3) ON CONFLICT(slug) DO UPDATE SET publication_status=EXCLUDED.publication_status,data=EXCLUDED.data,updated_at=now()`,[slug,publicationStatus,JSON.stringify(data)]);await audit(client,user.id,'save_creation',slug,reason,{publicationStatus});return {saved:true,slug,publicationStatus};});
}
