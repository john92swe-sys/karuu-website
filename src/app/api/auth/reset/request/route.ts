import { api,body,sameOrigin } from '@/lib/server/http';
import { requestPasswordReset } from '@/lib/server/auth';
export const runtime='nodejs';
export async function POST(request:Request){return api(async()=>{sameOrigin(request);return requestPasswordReset(await body(request));});}
