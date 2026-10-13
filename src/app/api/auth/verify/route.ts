import { NextResponse } from 'next/server';
import { api } from '@/lib/server/http';
import { verify } from '@/lib/server/auth';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request){return api(async()=>{
  await verify(new URL(request.url).searchParams.get('token')??'');
  return NextResponse.redirect(new URL('/account?verified=1',process.env.KARUU_SITE_ORIGIN??request.url),{headers:{'Referrer-Policy':'no-referrer','Cache-Control':'no-store'}});
});}
