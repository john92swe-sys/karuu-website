import { api } from '@/lib/server/http';
import { listPublicCreations } from '@/lib/server/works';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(){return api(async()=>({items:await listPublicCreations()}));}
