import { api } from '@/lib/server/http';
import { deliver } from '@/lib/server/delivery';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:{assetId:string}}){return api(()=>deliver(request,params.assetId));}
