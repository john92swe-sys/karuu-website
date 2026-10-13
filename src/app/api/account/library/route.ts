import { api } from '@/lib/server/http';
import { requireUser } from '@/lib/server/auth';
import { library } from '@/lib/server/commerce';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(){return api(async()=>library(await requireUser()));}
