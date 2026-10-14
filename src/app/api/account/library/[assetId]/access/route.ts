import { api,sameOrigin } from '@/lib/server/http';
import { requireUser } from '@/lib/server/auth';
import { grantAccess } from '@/lib/server/delivery';
export const runtime='nodejs';
export async function POST(request:Request,{params}:{params:Promise<{assetId:string}>}){return api(async()=>{sameOrigin(request);return grantAccess(await requireUser(),(await params).assetId);});}
