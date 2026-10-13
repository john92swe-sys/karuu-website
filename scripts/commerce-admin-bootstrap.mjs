import {Pool} from 'pg';
import {bootstrapAdministrator,bootstrapDatabaseSchema,operatorConnectionString,parseBootstrapArguments,safeBootstrapFailure} from './lib/commerce-admin-bootstrap.mjs';

const help=`First KARUU administrator setup — controlled database-owner CLI

Required: --email existing-verified-email --brands karuu[,jkj-plus]
          --operator "authorized operator" --reason "documented authorization"

Default: dry-run only. It prints the exact existing user UUID and proposed scope.
Apply:   add --apply --confirm-user-id UUID after reviewing that dry-run.

KARUU_ADMIN_DATABASE_URL must be set privately in the trusted operator environment.
KARUU_DATABASE_SCHEMA selects the reviewed commerce namespace (legacy default public).
For the selected Supabase project explicitly set KARUU_DATABASE_SCHEMA=karuu_commerce.
Remote PostgreSQL requires sslmode=verify-full and appropriate provider trust.
No credential URL argument is accepted; no Worker variable is created.

The account must already exist and have verified email. No account/password/email
verification is created. Existing administrators cause refusal. Apply is atomic,
audited, and revokes old target sessions; normal sign-in is required afterward.
This grants administrator access only; it does not approve payments or KRU.
`;
let pool;
try{
  const input=parseBootstrapArguments(process.argv.slice(2));
  if(input.help)console.log(help);
  else{
    const connectionString=operatorConnectionString(process.env.KARUU_ADMIN_DATABASE_URL);
    const schema=bootstrapDatabaseSchema(process.env.KARUU_DATABASE_SCHEMA??'public');
    pool=new Pool({connectionString,max:1,connectionTimeoutMillis:8000,idleTimeoutMillis:5000,allowExitOnIdle:true});
    console.log(JSON.stringify(await bootstrapAdministrator(pool,input,{schema}),null,2));
  }
}catch(error){
  console.error(JSON.stringify(safeBootstrapFailure(error)));process.exitCode=1;
}finally{if(pool)await pool.end().catch(()=>{});}
