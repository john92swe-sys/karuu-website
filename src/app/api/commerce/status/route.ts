import { api } from '@/lib/server/http';
import { status } from '@/lib/server/commerce';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(){return api(status);}
