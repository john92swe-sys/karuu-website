import {createHash} from 'node:crypto';

export const PRIVATE_COMMERCE_SCHEMA='karuu_commerce';
const REVIEWED_BASE_SHA256='b4e894abf4e983cccd4632721aba21129a864b5eb0718fab7fed2d62cd1f56b6';
export class SchemaMigrationError extends Error {
  constructor(code,message){super(message);this.name='SchemaMigrationError';this.code=code;}
}
export function validatedCommerceSchema(value=PRIVATE_COMMERCE_SCHEMA){
  if(value!==PRIVATE_COMMERCE_SCHEMA)throw new SchemaMigrationError('invalid_schema','This isolated migration only prepares the dedicated karuu_commerce schema.');
  return value;
}
const literal=value=>`'${value.replaceAll("'","''")}'`;

// File generation only: this module never connects to a PostgreSQL service.
export function prepareCommerceSchemaMigration(baseMigration,{schema=PRIVATE_COMMERCE_SCHEMA}={}){
  validatedCommerceSchema(schema);
  if(typeof baseMigration!=='string'||!baseMigration.trim())throw new SchemaMigrationError('invalid_base','Read the reviewed db/001-commerce.sql source first.');
  const normalized=baseMigration.replaceAll('\r\n','\n');
  if((normalized.match(/^BEGIN;\s*$/gm)??[]).length!==1||(normalized.match(/^COMMIT;\s*$/gm)??[]).length!==1)throw new SchemaMigrationError('invalid_base','The reviewed base must have exactly one outer BEGIN and COMMIT.');
  if(createHash('sha256').update(normalized).digest('hex')!==REVIEWED_BASE_SHA256)throw new SchemaMigrationError('unsupported_base','The reviewed version-1 source changed. Review and pin a new migration before preparing SQL.');
  const tables=[...normalized.matchAll(/^CREATE TABLE IF NOT EXISTS (commerce_[a-z_]+)\s*\(/gm)].map(match=>match[1]);
  const indexes=[...normalized.matchAll(/^CREATE INDEX IF NOT EXISTS (commerce_[a-z_]+) ON (commerce_[a-z_]+)\(/gm)].map(match=>({name:match[1],table:match[2]}));
  if(tables.length!==22||new Set(tables).size!==22||indexes.length!==4||indexes.some(index=>!tables.includes(index.table))||!normalized.includes('INSERT INTO commerce_schema(version) VALUES(1) ON CONFLICT DO NOTHING;'))throw new SchemaMigrationError('unsupported_base','The reviewed version-1 table/index manifest changed. Review a new migration instead of silently wrapping it.');
  const baseSha256=createHash('sha256').update(baseMigration).digest('hex');
  const sentinel=`KARUU private commerce wrapper v1; base sha256=${baseSha256}`;
  const tableList=tables.map(literal).join(',');
  const indexValues=indexes.map(index=>`(${literal(index.name)},${literal(index.table)})`).join(',');
  const body=normalized.replace(/^BEGIN;\s*$/m,'').replace(/^COMMIT;\s*$/m,'').trim();
  const rls=tables.map(table=>`ALTER TABLE "${schema}"."${table}" ENABLE ROW LEVEL SECURITY;`).join('\n');
  // Metadata checksum detects drift on replay; it is not a cryptographic seal
  // against a database owner, who can deliberately change both objects/comment.
  const catalogFingerprint=`SELECT md5(coalesce(jsonb_agg(entry ORDER BY kind,object_name)::text,'[]')) FROM (
    SELECT 'schema' AS kind,n.nspname::text AS object_name,jsonb_build_array(n.nspname,n.nspowner,n.nspacl::text) AS entry FROM pg_namespace n WHERE n.nspname=${literal(schema)}
    UNION ALL SELECT 'table',c.relname::text,jsonb_build_array(c.relname,c.relowner,c.relrowsecurity,c.relforcerowsecurity,c.relacl::text) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=${literal(schema)} AND c.relkind='r'
    UNION ALL SELECT 'column',c.relname||'.'||a.attnum,jsonb_build_array(c.relname,a.attnum,a.attname,format_type(a.atttypid,a.atttypmod),a.attnotnull,a.attidentity,a.attgenerated,pg_get_expr(d.adbin,d.adrelid)) FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace LEFT JOIN pg_attrdef d ON d.adrelid=c.oid AND d.adnum=a.attnum WHERE n.nspname=${literal(schema)} AND c.relkind='r' AND a.attnum>0 AND NOT a.attisdropped
    UNION ALL SELECT 'constraint',c.relname||'.'||co.conname,jsonb_build_array(c.relname,co.conname,pg_get_constraintdef(co.oid)) FROM pg_constraint co JOIN pg_class c ON c.oid=co.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=${literal(schema)}
    UNION ALL SELECT 'index',c.relname::text,jsonb_build_array(c.relname,pg_get_indexdef(c.oid)) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=${literal(schema)} AND c.relkind='i'
    UNION ALL SELECT 'policy',p.polname::text,jsonb_build_array(c.relname,p.polname,p.polcmd,p.polroles,pg_get_expr(p.polqual,p.polrelid),pg_get_expr(p.polwithcheck,p.polrelid)) FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=${literal(schema)}
    UNION ALL SELECT 'default',d.defaclrole::text||'.'||d.defaclobjtype::text,jsonb_build_array(d.defaclrole,d.defaclobjtype,d.defaclacl::text) FROM pg_default_acl d JOIN pg_namespace n ON n.oid=d.defaclnamespace WHERE n.nspname=${literal(schema)}
  ) metadata`;
  const sql=`-- GENERATED REVIEW ARTIFACT: do not apply without the selected-project preflight.
-- Source: db/001-commerce.sql; SHA256 ${baseSha256}
-- No users, prices, files, role credentials or runtime policies are created.
BEGIN;
SET LOCAL search_path TO pg_catalog, pg_temp;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
SELECT pg_advisory_xact_lock(1262572117,2);
DO $karuu_guard$
DECLARE target_oid oid; target_owner name; target_comment text; marker_present boolean; actual_fingerprint text;
BEGIN
  SELECT n.oid,r.rolname,obj_description(n.oid,'pg_namespace')
    INTO target_oid,target_owner,target_comment
    FROM pg_namespace n JOIN pg_roles r ON r.oid=n.nspowner WHERE n.nspname=${literal(schema)};
  IF target_oid IS NOT NULL THEN
    ${catalogFingerprint} INTO actual_fingerprint;
    IF target_owner<>current_user OR target_comment IS DISTINCT FROM ${literal(sentinel+'; catalog md5=')}||actual_fingerprint THEN
      RAISE EXCEPTION 'KARUU target schema collision: unrecognized provenance or owner';
    END IF;
    IF EXISTS(SELECT 1 FROM pg_class WHERE relnamespace=target_oid AND relkind IN ('r','p','v','m','S','f','c') AND (relname NOT IN (${tableList}) OR relkind<>'r' OR relowner<>(SELECT oid FROM pg_roles WHERE rolname=current_user)))
      OR EXISTS(SELECT 1 FROM pg_class i JOIN pg_index ix ON ix.indexrelid=i.oid JOIN pg_class t ON t.oid=ix.indrelid WHERE i.relnamespace=target_oid
        AND NOT(EXISTS(SELECT 1 FROM (VALUES ${indexValues}) expected(name,table_name) WHERE expected.name=i.relname AND expected.table_name=t.relname AND t.relnamespace=target_oid)
          OR EXISTS(SELECT 1 FROM pg_constraint co WHERE co.conindid=i.oid AND co.conrelid=t.oid AND t.relnamespace=target_oid AND t.relname IN (${tableList}))))
      OR EXISTS(SELECT 1 FROM pg_proc WHERE pronamespace=target_oid)
      OR EXISTS(SELECT 1 FROM pg_type WHERE typnamespace=target_oid AND typrelid=0 AND typtype IN ('c','d','e','r','m')) THEN
      RAISE EXCEPTION 'KARUU target schema collision: unexpected objects';
    END IF;
    IF NOT EXISTS(SELECT 1 FROM pg_class WHERE relnamespace=target_oid AND relname='commerce_schema' AND relkind='r') THEN
      RAISE EXCEPTION 'KARUU target schema collision: missing version marker';
    END IF;
    IF (SELECT count(*) FROM pg_class WHERE relnamespace=target_oid AND relkind='r')<>22 THEN RAISE EXCEPTION 'KARUU target schema collision: incomplete table manifest'; END IF;
    EXECUTE 'SELECT count(*)=1 AND min(version)=1 FROM "${schema}".commerce_schema' INTO marker_present;
    IF NOT marker_present THEN RAISE EXCEPTION 'KARUU target schema collision: missing version 1'; END IF;
  ELSE
    CREATE SCHEMA "${schema}";
    COMMENT ON SCHEMA "${schema}" IS ${literal(sentinel)};
  END IF;
  -- Per-schema default revokes cannot cancel explicit global defaults. Refuse
  -- unsafe explicit defaults instead of changing another application's grants.
  IF EXISTS(
    SELECT 1 FROM pg_default_acl d CROSS JOIN LATERAL aclexplode(d.defaclacl) a
    LEFT JOIN pg_roles grantee_role ON grantee_role.oid=a.grantee
    WHERE d.defaclnamespace=0 AND d.defaclrole=(SELECT oid FROM pg_roles WHERE rolname=current_user)
      AND (a.grantee=0 OR grantee_role.rolname IN ('anon','authenticated'))
  ) THEN RAISE EXCEPTION 'KARUU unsafe global default grants require separate operator review'; END IF;
END;
$karuu_guard$;
-- Explicit pg_temp placement prevents implicit temporary-relation shadowing.
SET LOCAL search_path TO "${schema}", pg_catalog, pg_temp;
${body}
REVOKE ALL PRIVILEGES ON SCHEMA "${schema}" FROM PUBLIC;
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA "${schema}" FROM PUBLIC;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA "${schema}" FROM PUBLIC;
REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA "${schema}" FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA "${schema}" REVOKE ALL PRIVILEGES ON TABLES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA "${schema}" REVOKE ALL PRIVILEGES ON SEQUENCES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA "${schema}" REVOKE ALL PRIVILEGES ON FUNCTIONS FROM PUBLIC;
DO $karuu_revoke$
DECLARE denied_role name;
BEGIN
  FOR denied_role IN SELECT rolname FROM pg_roles WHERE rolname IN ('anon','authenticated') LOOP
    EXECUTE format('REVOKE ALL PRIVILEGES ON SCHEMA %I FROM %I',${literal(schema)},denied_role);
    EXECUTE format('REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA %I FROM %I',${literal(schema)},denied_role);
    EXECUTE format('REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA %I FROM %I',${literal(schema)},denied_role);
    EXECUTE format('REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA %I FROM %I',${literal(schema)},denied_role);
    EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I REVOKE ALL PRIVILEGES ON TABLES FROM %I',${literal(schema)},denied_role);
    EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I REVOKE ALL PRIVILEGES ON SEQUENCES FROM %I',${literal(schema)},denied_role);
    EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I REVOKE ALL PRIVILEGES ON FUNCTIONS FROM %I',${literal(schema)},denied_role);
  END LOOP;
END;
$karuu_revoke$;
${rls}
SET LOCAL search_path TO pg_catalog, pg_temp;
DO $karuu_fingerprint$
DECLARE actual_fingerprint text;
BEGIN
  ${catalogFingerprint} INTO actual_fingerprint;
  EXECUTE format('COMMENT ON SCHEMA %I IS %L',${literal(schema)},${literal(sentinel+'; catalog md5=')}||actual_fingerprint);
END;
$karuu_fingerprint$;
COMMIT;
`;
  return {sql,schema,baseSha256,sentinel,tables,indexes,catalogFingerprint};
}
