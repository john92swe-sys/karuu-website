-- One new review-only login; preserves the existing NOLOGIN permission role.
-- The password is generated on the database server and temporarily encrypted
-- by the existing Supabase Vault. No credential value is in migration text.
BEGIN;
SET LOCAL search_path TO pg_catalog,pg_temp;
DO $guard$
BEGIN
 IF current_database()<>'postgres' OR current_setting('server_version_num')::int NOT BETWEEN 170000 AND 179999 THEN RAISE EXCEPTION 'Unexpected database/version'; END IF;
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='karuu_worker_login') THEN RAISE EXCEPTION 'Login role collision'; END IF;
 IF EXISTS(SELECT 1 FROM vault.secrets WHERE name='karuu_review_hyperdrive_bootstrap') THEN RAISE EXCEPTION 'Bootstrap secret collision'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='karuu_web' AND NOT rolcanlogin AND NOT rolsuper AND NOT rolcreatedb AND NOT rolcreaterole AND NOT rolreplication AND NOT rolbypassrls AND NOT rolinherit AND rolconnlimit=10) THEN RAISE EXCEPTION 'Runtime role drift'; END IF;
 IF EXISTS(SELECT 1 FROM pg_auth_members WHERE member=(SELECT oid FROM pg_roles WHERE rolname='karuu_web')) THEN RAISE EXCEPTION 'Runtime outbound membership drift'; END IF;
 IF (SELECT count(*) FROM pg_policies WHERE schemaname='karuu_commerce')<>56 OR EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='karuu_commerce' AND roles<>ARRAY['karuu_web']::name[]) THEN RAISE EXCEPTION 'Runtime policy drift'; END IF;
 PERFORM set_config('createrole_self_grant','',true);
 PERFORM set_config('password_encryption','scram-sha-256',true);
END $guard$;
CREATE ROLE karuu_worker_login NOLOGIN PASSWORD NULL NOSUPERUSER NOCREATEDB NOCREATEROLE INHERIT NOREPLICATION NOBYPASSRLS CONNECTION LIMIT 10;
GRANT karuu_web TO karuu_worker_login WITH ADMIN FALSE, INHERIT TRUE, SET FALSE;
ALTER ROLE karuu_worker_login SET search_path TO karuu_commerce,pg_catalog,pg_temp;
ALTER ROLE karuu_worker_login SET row_security=on;
ALTER ROLE karuu_worker_login SET statement_timeout='30s';
ALTER ROLE karuu_worker_login SET lock_timeout='5s';
ALTER ROLE karuu_worker_login SET idle_in_transaction_session_timeout='30s';
DO $credential$
DECLARE generated_password text;
BEGIN
 generated_password:=encode(extensions.gen_random_bytes(32),'hex');
 PERFORM vault.create_secret(generated_password,'karuu_review_hyperdrive_bootstrap','Temporary restricted KARUU review Hyperdrive handoff; delete this exact bootstrap after connection verification.');
 EXECUTE format('ALTER ROLE karuu_worker_login PASSWORD %L',generated_password);
 generated_password:=NULL;
 IF (SELECT count(*) FROM pg_auth_members WHERE member=(SELECT oid FROM pg_roles WHERE rolname='karuu_worker_login'))<>1 OR NOT EXISTS(SELECT 1 FROM pg_auth_members WHERE member=(SELECT oid FROM pg_roles WHERE rolname='karuu_worker_login') AND roleid=(SELECT oid FROM pg_roles WHERE rolname='karuu_web') AND inherit_option AND NOT set_option AND NOT admin_option) THEN RAISE EXCEPTION 'Login membership drift'; END IF;
 IF has_schema_privilege('karuu_worker_login','vault','USAGE') THEN RAISE EXCEPTION 'Unexpected Vault access'; END IF;
END $credential$;
ALTER ROLE karuu_worker_login LOGIN;
COMMIT;
