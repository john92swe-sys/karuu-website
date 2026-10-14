import {createHash} from 'node:crypto';
import {prepareCommerceSchemaMigration,SchemaMigrationError} from './commerce-schema-migration.mjs';

export const COMMERCE_RUNTIME_ROLE='karuu_web';
// Derived from current server queries. No administrator promotion, destructive
// financial deletion, ledger editing, new funding or new KRU record is granted.
export const RUNTIME_TABLE_PERMISSIONS={
 commerce_schema:{},
 commerce_users:{insert:['id','email','display_name','password_hash'],update:['password_hash','verified_at']},
 commerce_sessions:{insert:true,delete:true},
 commerce_verifications:{insert:true,delete:true},
 commerce_password_resets:{insert:true,delete:true},
 commerce_rate_limits:{insert:true,update:true},
 commerce_assets:{insert:true,update:true},
 commerce_skus:{insert:true,update:true},
 commerce_creations:{insert:true,update:true},
 commerce_costs:{insert:true,update:true},
 commerce_orders:{insert:true,update:true},
 commerce_payment_events:{insert:true},
 commerce_entitlements:{insert:true,update:true},
 commerce_inquiries:{insert:true,update:true},
 commerce_outbox:{insert:true,update:true},
 commerce_audit:{insert:true},
 commerce_point_ledger:{insert:true},
 commerce_point_operations:{insert:true},
 commerce_game_funding:{update:['id'],updateCheck:false},
 commerce_game_campaigns:{update:['used_units']},
 commerce_game_reward_claims:{insert:true},
 commerce_kru_records:{update:['state']}
};

// Precise metadata predicate for the two existing platform SELECT exceptions.
// It also rejects renamed/replaced business views masquerading as statistics.
function statisticsException(alias){return `(${alias}.relkind='v' AND ${alias}.relname IN ('pg_stat_statements','pg_stat_statements_info')
 AND n.nspname='extensions'
 AND EXISTS(SELECT 1 FROM pg_depend ed JOIN pg_extension e ON ed.refclassid='pg_catalog.pg_extension'::regclass AND e.oid=ed.refobjid WHERE ed.classid='pg_catalog.pg_class'::regclass AND ed.objid=${alias}.oid AND ed.deptype='e' AND e.extname='pg_stat_statements' AND e.extversion='1.11')
 AND EXISTS(SELECT 1 FROM pg_rewrite w JOIN pg_depend d ON d.classid='pg_catalog.pg_rewrite'::regclass AND d.objid=w.oid WHERE w.ev_class=${alias}.oid AND d.refclassid='pg_catalog.pg_proc'::regclass AND ${statisticsFunction('d.refobjid',alias)})
 AND NOT EXISTS(SELECT 1 FROM pg_rewrite w JOIN pg_depend d ON d.classid='pg_catalog.pg_rewrite'::regclass AND d.objid=w.oid WHERE w.ev_class=${alias}.oid AND
   NOT((d.refclassid='pg_catalog.pg_class'::regclass AND d.refobjid=${alias}.oid)
    OR (d.refclassid='pg_catalog.pg_proc'::regclass AND ${statisticsFunction('d.refobjid',alias)}))))`;}
function statisticsFunction(oid,viewAlias){return `EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace pn ON pn.oid=p.pronamespace JOIN pg_language l ON l.oid=p.prolang WHERE p.oid=${oid} AND pn.nspname='extensions' AND p.proname=${viewAlias}.relname AND NOT p.prosecdef AND l.lanname='c' AND p.probin='$libdir/pg_stat_statements' AND p.prorettype='record'::regtype
 AND ((p.proname='pg_stat_statements' AND p.prosrc='pg_stat_statements_1_11' AND p.proargtypes::text='16' AND p.proretset) OR (p.proname='pg_stat_statements_info' AND p.prosrc='pg_stat_statements_info' AND p.proargtypes::text='' AND NOT p.proretset))
 AND EXISTS(SELECT 1 FROM pg_depend fd JOIN pg_extension e ON fd.refclassid='pg_catalog.pg_extension'::regclass AND e.oid=fd.refobjid WHERE fd.classid='pg_catalog.pg_proc'::regclass AND fd.objid=p.oid AND fd.deptype='e' AND e.extname='pg_stat_statements' AND e.extversion='1.11'))`;}
const nonSystemNamespace=alias=>`${alias}.nspname NOT IN ('pg_catalog','information_schema') AND ${alias}.nspname !~ '^pg_(toast|temp_[0-9]+|toast_temp_[0-9]+)$'`;

// Preparation only. Passwords are neither accepted nor embedded in this SQL.
export function prepareCommerceRuntimeRole(baseMigration,{role=COMMERCE_RUNTIME_ROLE,allowExistingPlatformStatistics=false}={}){
 if(role!==COMMERCE_RUNTIME_ROLE||typeof allowExistingPlatformStatistics!=='boolean')throw new SchemaMigrationError('invalid_runtime_options','Use the fixed karuu_web role and an explicit boolean platform-statistics choice.');
 const prepared=prepareCommerceSchemaMigration(baseMigration),schema=prepared.schema;
 if(JSON.stringify(Object.keys(RUNTIME_TABLE_PERMISSIONS))!==JSON.stringify(prepared.tables))throw new SchemaMigrationError('unsupported_runtime_manifest','Review the source tables and server-query privileges together.');
 const clauses=[],policies=[];
 for(const table of prepared.tables){
  const permissions=RUNTIME_TABLE_PERMISSIONS[table],qualified=`"${schema}"."${table}"`;
  clauses.push(`GRANT SELECT ON TABLE ${qualified} TO "${role}";`);
  policies.push(`CREATE POLICY karuu_web_select ON ${qualified} FOR SELECT TO "${role}" USING(true);`);
  for(const command of ['insert','update','delete'])if(permissions[command]){
   const columns=Array.isArray(permissions[command])?`(${permissions[command].map(column=>`"${column}"`).join(',')})`:'';
   clauses.push(`GRANT ${command.toUpperCase()}${columns} ON TABLE ${qualified} TO "${role}";`);
   const check=permissions.updateCheck===false?'false':'true';
   policies.push(`CREATE POLICY karuu_web_${command} ON ${qualified} FOR ${command.toUpperCase()} TO "${role}" ${command==='insert'?'WITH CHECK(true)':command==='delete'?'USING(true)':`USING(true) WITH CHECK(${check})`};`);
  }
 }
 const tableList=prepared.tables.map(table=>`'${table}'`).join(','),exception=allowExistingPlatformStatistics?statisticsException('c'):'false';
 const sql=`-- REVIEW ARTIFACT: stage a fixed NOLOGIN server role; no credential is present.
-- Requires approved, unchanged karuu_private_commerce_v1_20261013 baseline.
-- Platform SELECT exception: ${allowExistingPlatformStatistics?'exact existing extensions.pg_stat_statements and extensions.pg_stat_statements_info only':'none (strict)'}.
BEGIN;
SET LOCAL search_path TO pg_catalog,pg_temp;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
SELECT pg_advisory_xact_lock(1262572117,2);
DO $karuu_runtime_preflight$
DECLARE target_oid oid; schema_owner name; schema_comment text; actual_fingerprint text;
BEGIN
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='${role}') THEN RAISE EXCEPTION 'KARUU runtime role collision: existing role must be reviewed, never reused'; END IF;
 SELECT n.oid,r.rolname,obj_description(n.oid,'pg_namespace') INTO target_oid,schema_owner,schema_comment FROM pg_namespace n JOIN pg_roles r ON r.oid=n.nspowner WHERE n.nspname='${schema}';
 IF target_oid IS NULL OR schema_owner<>current_user THEN RAISE EXCEPTION 'KARUU runtime requires the recognized owner-operated private schema'; END IF;
 ${prepared.catalogFingerprint} INTO actual_fingerprint;
 IF schema_comment IS DISTINCT FROM '${prepared.sentinel}; catalog md5='||actual_fingerprint THEN RAISE EXCEPTION 'KARUU private baseline drift: review a new migration instead of repairing it'; END IF;
 IF (SELECT count(*) FROM pg_class WHERE relnamespace=target_oid AND relkind='r' AND relname IN (${tableList}) AND relrowsecurity AND NOT relforcerowsecurity)<>22
   OR EXISTS(SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid WHERE c.relnamespace=target_oid)
   OR NOT(SELECT count(*)=1 AND min(version)=1 FROM "${schema}".commerce_schema) THEN RAISE EXCEPTION 'KARUU runtime baseline is not the initial private version 1'; END IF;
END;
$karuu_runtime_preflight$;
DO $karuu_creator_defaults$
BEGIN
 IF current_setting('server_version_num')::integer>=160000 THEN
  PERFORM set_config('createrole_self_grant','',true);
 END IF;
END;
$karuu_creator_defaults$;
CREATE ROLE "${role}" NOLOGIN PASSWORD NULL NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS CONNECTION LIMIT 10;
COMMENT ON ROLE "${role}" IS 'KARUU server-only runtime v1; no owner; credential activation pending';
-- PostgreSQL 16+ gives the creator administrative governance. Keep only this
-- new role's operator ADMIN edge; explicitly disable its SET/INHERIT abilities.
ALTER ROLE "${role}" SET search_path TO "${schema}",pg_catalog,pg_temp;
ALTER ROLE "${role}" SET row_security=on;
ALTER ROLE "${role}" SET statement_timeout='30s';
ALTER ROLE "${role}" SET lock_timeout='5s';
ALTER ROLE "${role}" SET idle_in_transaction_session_timeout='30s';
DO $karuu_creator_membership$
BEGIN
 IF current_setting('server_version_num')::integer>=160000 THEN
  IF (SELECT rolsuper FROM pg_roles WHERE rolname=current_user) THEN
   EXECUTE format('GRANT %I TO %I WITH ADMIN TRUE, INHERIT FALSE, SET FALSE','${role}',current_user);
  ELSIF NOT EXISTS(SELECT 1 FROM pg_auth_members m JOIN pg_roles r ON r.oid=m.roleid JOIN pg_roles creator ON creator.oid=m.member WHERE r.rolname='${role}' AND creator.rolname=current_user AND m.admin_option AND NOT m.inherit_option AND NOT m.set_option) THEN
   RAISE EXCEPTION 'KARUU creator administrative governance was not established safely';
  END IF;
 END IF;
END;
$karuu_creator_membership$;
GRANT USAGE ON SCHEMA "${schema}" TO "${role}";
${clauses.join('\n')}
${policies.join('\n')}
DO $karuu_runtime_permissions$
DECLARE runtime_oid oid; creator_oid oid;
BEGIN
 SELECT oid INTO runtime_oid FROM pg_roles WHERE rolname='${role}' AND NOT rolsuper AND NOT rolcreaterole AND NOT rolcreatedb AND NOT rolreplication AND NOT rolbypassrls AND NOT rolinherit AND NOT rolcanlogin;
 SELECT oid INTO creator_oid FROM pg_roles WHERE rolname=current_user;
 IF runtime_oid IS NULL OR EXISTS(SELECT 1 FROM pg_auth_members WHERE member=runtime_oid)
  OR EXISTS(SELECT 1 FROM pg_auth_members m WHERE roleid=runtime_oid AND (member<>creator_oid OR NOT admin_option OR coalesce((to_jsonb(m)->>'inherit_option')::boolean,false) OR coalesce((to_jsonb(m)->>'set_option')::boolean,false))) THEN RAISE EXCEPTION 'KARUU runtime role attributes or memberships are unsafe'; END IF;
 IF EXISTS(SELECT 1 FROM pg_namespace WHERE nspowner=runtime_oid) OR EXISTS(SELECT 1 FROM pg_class WHERE relowner=runtime_oid)
  OR EXISTS(SELECT 1 FROM pg_proc WHERE proowner=runtime_oid) OR EXISTS(SELECT 1 FROM pg_database WHERE datdba=runtime_oid) THEN RAISE EXCEPTION 'KARUU runtime must not own database objects'; END IF;
 IF has_database_privilege('${role}',current_database(),'CREATE') OR EXISTS(SELECT 1 FROM pg_namespace n WHERE ${nonSystemNamespace('n')} AND has_schema_privilege('${role}',oid,'CREATE')) THEN RAISE EXCEPTION 'KARUU runtime inherited persistent CREATE privilege'; END IF;
 IF EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE ${nonSystemNamespace('n')} AND n.nspname<>'${schema}' AND c.relkind IN ('r','p','v','m','f') AND
  (has_table_privilege('${role}',c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') OR has_any_column_privilege('${role}',c.oid,'SELECT,INSERT,UPDATE,REFERENCES'))
  AND NOT(${exception} AND NOT has_table_privilege('${role}',c.oid,'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') AND NOT has_any_column_privilege('${role}',c.oid,'INSERT,UPDATE,REFERENCES'))) THEN RAISE EXCEPTION 'KARUU runtime inherited data access outside its private schema'; END IF;
 IF EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE ${nonSystemNamespace('n')} AND n.nspname<>'${schema}' AND CASE WHEN c.relkind='S' THEN has_sequence_privilege('${role}',c.oid,'SELECT,USAGE,UPDATE') ELSE false END) THEN RAISE EXCEPTION 'KARUU runtime inherited outside sequence access'; END IF;
 IF EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE p.prosecdef AND ${nonSystemNamespace('n')} AND has_schema_privilege('${role}',n.oid,'USAGE') AND has_function_privilege('${role}',p.oid,'EXECUTE')) THEN RAISE EXCEPTION 'KARUU runtime inherited executable SECURITY DEFINER'; END IF;
 IF EXISTS(SELECT 1 FROM pg_default_acl d CROSS JOIN LATERAL aclexplode(d.defaclacl) a WHERE d.defaclobjtype IN ('r','S') AND a.grantee=0) THEN RAISE EXCEPTION 'KARUU runtime requires review of PUBLIC table/sequence defaults'; END IF;
 IF EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='extensions' AND p.proname='pg_stat_statements_reset' AND has_function_privilege('${role}',p.oid,'EXECUTE')) THEN RAISE EXCEPTION 'KARUU runtime must not reset shared statistics'; END IF;
 IF EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='${schema}' AND has_table_privilege('${role}',c.oid,'TRUNCATE,REFERENCES,TRIGGER'))
  OR EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace CROSS JOIN LATERAL aclexplode(c.relacl) a WHERE n.nspname='${schema}' AND a.grantee=runtime_oid AND a.is_grantable)
  OR EXISTS(SELECT 1 FROM pg_attribute at JOIN pg_class c ON c.oid=at.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace CROSS JOIN LATERAL aclexplode(at.attacl) a WHERE n.nspname='${schema}' AND a.grantee=runtime_oid AND a.is_grantable) THEN RAISE EXCEPTION 'KARUU runtime has destructive or delegable privileges'; END IF;
 IF EXISTS(SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='${schema}' AND p.polroles<>ARRAY[runtime_oid]) THEN RAISE EXCEPTION 'KARUU runtime policies must target only the dedicated role'; END IF;
END;
$karuu_runtime_permissions$;
-- Preserve the original schema provenance comment. This phase changes ACLs and
-- policies intentionally; the old v1 bootstrap now refuses to replay as upkeep.
COMMIT;
`;
 return {sql,sqlSha256:createHash('sha256').update(sql).digest('hex'),role,schema,tablePermissions:RUNTIME_TABLE_PERMISSIONS,policyCount:policies.length,platformStatisticsExceptions:allowExistingPlatformStatistics?['extensions.pg_stat_statements','extensions.pg_stat_statements_info']:[],operatorGovernance:'PG16+: creator ADMIN=true, INHERIT=false, SET=false only; runtime has zero outbound memberships.',credentialIncluded:false,applied:false};
}
