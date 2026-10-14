-- Prepared only: this file is not applied by the build or normal application.
-- Run explicitly as the schema owner after backing up and reviewing the exact
-- karuu_commerce target. It records preparation; it enables no payment mode,
-- product, Stripe registration, tax service, jurisdiction or environment flag.
BEGIN;
ALTER TABLE karuu_commerce.commerce_skus
  ADD COLUMN IF NOT EXISTS tax_mode text NOT NULL DEFAULT 'manual_verified'
    CHECK (tax_mode IN ('manual_verified','stripe_automatic')),
  ADD COLUMN IF NOT EXISTS automatic_tax_config jsonb NOT NULL DEFAULT '{}'
    CHECK (jsonb_typeof(automatic_tax_config)='object');
ALTER TABLE karuu_commerce.commerce_orders
  ADD COLUMN IF NOT EXISTS tax_mode text NOT NULL DEFAULT 'manual_verified'
    CHECK (tax_mode IN ('manual_verified','stripe_automatic')),
  ADD COLUMN IF NOT EXISTS tax_quote jsonb
    CHECK (tax_quote IS NULL OR jsonb_typeof(tax_quote)='object'),
  ADD COLUMN IF NOT EXISTS tax_receipt jsonb
    CHECK (tax_receipt IS NULL OR jsonb_typeof(tax_receipt)='object');
-- Keep the original preparation quote separate from the later actual receipt.
-- A first receipt may be recorded once; subsequent rewrites need a separately
-- reviewed repair migration, never an ordinary application UPDATE.
CREATE OR REPLACE FUNCTION karuu_commerce.keep_original_tax_receipt()
RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,pg_temp AS $function$
BEGIN
  IF NEW.tax_mode IS DISTINCT FROM OLD.tax_mode
    OR (OLD.tax_quote IS NOT NULL AND NEW.tax_quote IS DISTINCT FROM OLD.tax_quote)
    OR (OLD.tax_receipt IS NOT NULL AND NEW.tax_receipt IS DISTINCT FROM OLD.tax_receipt)
  THEN
    RAISE EXCEPTION 'Original tax mode, quote and recorded receipt are immutable'
      USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$function$;
DROP TRIGGER IF EXISTS commerce_original_tax_receipt ON karuu_commerce.commerce_orders;
CREATE TRIGGER commerce_original_tax_receipt
BEFORE UPDATE OF tax_mode,tax_quote,tax_receipt ON karuu_commerce.commerce_orders
FOR EACH ROW EXECUTE FUNCTION karuu_commerce.keep_original_tax_receipt();
-- Existing table privileges/RLS remain in force. No roles, grants, policies,
-- existing snapshots, tax rates, catalog entries or accounting values change.
INSERT INTO karuu_commerce.commerce_schema(version) VALUES(3)
  ON CONFLICT (version) DO NOTHING;
COMMIT;
