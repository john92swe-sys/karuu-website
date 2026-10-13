import { api,body,sameOrigin } from '@/lib/server/http';
import { requireAdmin } from '@/lib/server/auth';
import { adminAction,adminView } from '@/lib/server/admin';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request){return api(async()=>adminView(await requireAdmin(),new URL(request.url).searchParams.get('view')??'status'));}
export async function POST(request:Request){return api(async()=>{sameOrigin(request);return adminAction(await requireAdmin(),await body(request));});}
