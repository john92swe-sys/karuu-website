import fs from 'node:fs';
import path from 'node:path';
import {prepareCommerceRuntimeRole} from './lib/commerce-runtime-role.mjs';

try{
 const args=process.argv.slice(2);
 if(args.length>1||(args.length===1&&args[0]!=='--allow-existing-platform-statistics'))throw new Error('Only the documented exact platform-statistics choice is accepted. No credential arguments are supported.');
 const base=fs.readFileSync(new URL('../db/001-commerce.sql',import.meta.url),'utf8');
 const prepared=prepareCommerceRuntimeRole(base,{allowExistingPlatformStatistics:args[0]==='--allow-existing-platform-statistics'});
 const directory=path.resolve('work','supabase');fs.mkdirSync(directory,{recursive:true});
 const suffix=prepared.platformStatisticsExceptions.length?'platform-statistics':'strict';
 const output=path.join(directory,`karuu-runtime-role-${suffix}.sql`),manifest=path.join(directory,`karuu-runtime-role-${suffix}.json`);
 fs.writeFileSync(output,prepared.sql,'utf8');const {sql,...metadata}=prepared;fs.writeFileSync(manifest,JSON.stringify(metadata,null,2)+'\n','utf8');
 console.log(JSON.stringify({output,manifest,sqlSha256:prepared.sqlSha256,policies:prepared.policyCount,role:prepared.role,loginEnabled:false,credentialIncluded:false,applied:false},null,2));
}catch{console.error('Runtime role preparation refused. This generator contacts no database and accepts no credential.');process.exitCode=1;}
