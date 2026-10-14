import { fail } from './core';

export function isWorkersRuntime():boolean {
  // Official Workers user-agent; server runtime detection, never a client request header.
  return typeof navigator!=='undefined'&&navigator.userAgent==='Cloudflare-Workers';
}
export async function cloudflareEnvironment():Promise<Record<string,unknown>|null>{
  if(!isWorkersRuntime()){
    if(process.env.KARUU_RUNTIME==='cloudflare')fail(503,'workers_runtime_unconfirmed','The configured Worker runtime could not be verified. Database access remains disabled.');
    return null;
  }
  try{
    // The Node build/test path never imports the adapter or initializes Wrangler.
    // Sync context lookup inside the request cannot initialize a Node dev platform.
    const {getCloudflareContext}=await import('@opennextjs/cloudflare');
    return getCloudflareContext().env as unknown as Record<string,unknown>;
  }catch{fail(503,'workers_context_unavailable','The Worker request bindings are not available.');}
}
export async function commerceHyperdrive(){
  const env=await cloudflareEnvironment();
  if(!env)return null;
  const binding=env.HYPERDRIVE_COMMERCE as {connectionString?:unknown}|undefined;
  return {connectionString:typeof binding?.connectionString==='string'?binding.connectionString:null,cacheDisabledConfirmed:env.KARUU_HYPERDRIVE_CACHING_DISABLED==='true'};
}
