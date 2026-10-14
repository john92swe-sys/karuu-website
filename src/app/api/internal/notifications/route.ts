import { api } from '@/lib/server/http';
import { deliverNotifications } from '@/lib/server/notifications';
export const runtime='nodejs';
export async function POST(request:Request){return api(()=>deliverNotifications(request));}
