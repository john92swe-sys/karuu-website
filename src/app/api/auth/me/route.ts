import { api } from '@/lib/server/http';
import { currentUser } from '@/lib/server/auth';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(){return api(async()=>({user:await currentUser()}));}
