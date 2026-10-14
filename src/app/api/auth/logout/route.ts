import { api,sameOrigin } from '@/lib/server/http';
import { logout } from '@/lib/server/auth';
export const runtime='nodejs';
export async function POST(request:Request){return api(async()=>{sameOrigin(request);return logout();});}
