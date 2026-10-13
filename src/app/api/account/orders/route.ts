import { api } from '@/lib/server/http';
import { requireUser } from '@/lib/server/auth';
import { orders } from '@/lib/server/commerce';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(){return api(async()=>orders(await requireUser()));}
