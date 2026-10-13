import { NextResponse } from 'next/server';
import { api } from '@/lib/server/http';
import { requireAdmin } from '@/lib/server/auth';
import { adminView } from '@/lib/server/admin';
import { fail } from '@/lib/server/core';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request){return api(async()=>{
  const user=await requireAdmin(),view=new URL(request.url).searchParams.get('view')??'inquiries';
  if(!['inquiries','orders','audit','costs','catalog','works','assets','points','kru'].includes(view))fail(400,'invalid_export','Choose a supported administration export.');
  const result=await adminView(user,view);
  return NextResponse.json({exportedAt:new Date().toISOString(),view,...result},{headers:{'Content-Disposition':`attachment; filename="karuu-${view}.json"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
});}
