import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {prepareCommerceSchemaMigration} from './lib/commerce-schema-migration.mjs';

// Intentionally accepts no service URL and imports no database client.
try{
  if(process.argv.length!==2)throw new Error('Run without arguments; this command only prepares review files in work/supabase.');
  const base=fs.readFileSync(new URL('../db/001-commerce.sql',import.meta.url),'utf8');
  const prepared=prepareCommerceSchemaMigration(base);
  const directory=path.resolve('work','supabase');fs.mkdirSync(directory,{recursive:true});
  const output=path.join(directory,'karuu-commerce-schema.sql');fs.writeFileSync(output,prepared.sql,'utf8');
  const manifest={schema:prepared.schema,source:'db/001-commerce.sql',sourceSha256:prepared.baseSha256,sqlSha256:createHash('sha256').update(prepared.sql).digest('hex'),tables:prepared.tables,indexes:prepared.indexes,scope:'File preparation only. No database connection, migration history or provider resource was changed.'};
  fs.writeFileSync(path.join(directory,'karuu-commerce-schema-manifest.json'),JSON.stringify(manifest,null,2)+'\n','utf8');
  console.log(JSON.stringify({output,manifest: path.join(directory,'karuu-commerce-schema-manifest.json'),tableCount:prepared.tables.length,sqlSha256:manifest.sqlSha256,applied:false},null,2));
}catch{console.error('Migration preparation refused. Review the dedicated-schema target and base version-1 manifest; no database was contacted.');process.exitCode=1;}
