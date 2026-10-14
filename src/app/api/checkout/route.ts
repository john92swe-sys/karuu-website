import { api,body,sameOrigin } from '@/lib/server/http';
import { requireUser } from '@/lib/server/auth';
import { checkout } from '@/lib/server/commerce';
export const runtime='nodejs';
export async function POST(request:Request){return api(async()=>{sameOrigin(request);const user=await requireUser();return checkout(user,await body(request),request.headers.get('idempotency-key'));});}
