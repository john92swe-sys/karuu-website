import { api } from '@/lib/server/http';
import { webhook } from '@/lib/server/payments';
export const runtime='nodejs';
export async function POST(request:Request){return api(()=>webhook(request));}
