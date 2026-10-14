-- Apply explicitly to a backed-up PostgreSQL database. No catalogue or prices are seeded.
BEGIN;
CREATE TABLE IF NOT EXISTS commerce_schema (version integer PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS commerce_users (
 id uuid PRIMARY KEY, email text NOT NULL UNIQUE, display_name text NOT NULL,
 password_hash text NOT NULL, verified_at timestamptz, role text NOT NULL DEFAULT 'customer' CHECK(role IN ('customer','admin')),
 brands text[] NOT NULL DEFAULT ARRAY['karuu']::text[], created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS commerce_sessions (token_hash text PRIMARY KEY, user_id uuid NOT NULL REFERENCES commerce_users(id), expires_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS commerce_verifications (token_hash text PRIMARY KEY, user_id uuid NOT NULL REFERENCES commerce_users(id), expires_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS commerce_password_resets (token_hash text PRIMARY KEY, user_id uuid NOT NULL REFERENCES commerce_users(id), expires_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS commerce_rate_limits (key text PRIMARY KEY, window_start timestamptz NOT NULL, count integer NOT NULL);
CREATE TABLE IF NOT EXISTS commerce_assets (
 id text PRIMARY KEY, work_slug text NOT NULL, title text NOT NULL, format text NOT NULL, language text NOT NULL,
 object_key text NOT NULL, rights_verified boolean NOT NULL DEFAULT false, delivery_verified boolean NOT NULL DEFAULT false,
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE commerce_assets ADD COLUMN IF NOT EXISTS edition_version text NOT NULL DEFAULT '1';
ALTER TABLE commerce_assets ADD COLUMN IF NOT EXISTS content_sha256 text CHECK(content_sha256 ~ '^[a-f0-9]{64}$');
CREATE TABLE IF NOT EXISTS commerce_skus (
 id text PRIMARY KEY, slug text NOT NULL, title text NOT NULL, kind text NOT NULL CHECK(kind IN ('ebook','audiobook','bundle','music','game')),
 status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','active','archived')), currency text NOT NULL,
 price_minor integer CHECK(price_minor > 0), rights_verified boolean NOT NULL DEFAULT false, markets text[] NOT NULL DEFAULT '{}',
 components jsonb NOT NULL DEFAULT '[]', tax_by_market jsonb NOT NULL DEFAULT '{}', upgrade_prices jsonb NOT NULL DEFAULT '{}',
 sale_start timestamptz, sale_end timestamptz, updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE commerce_skus ADD COLUMN IF NOT EXISTS promotion_price_minor integer CHECK(promotion_price_minor > 0);
ALTER TABLE commerce_skus ADD COLUMN IF NOT EXISTS promotion_start timestamptz;
ALTER TABLE commerce_skus ADD COLUMN IF NOT EXISTS promotion_end timestamptz;
CREATE TABLE IF NOT EXISTS commerce_creations (
 slug text PRIMARY KEY, publication_status text NOT NULL CHECK(publication_status IN ('draft','published','archived')),
 data jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS commerce_costs (sku_id text PRIMARY KEY REFERENCES commerce_skus(id), inputs jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS commerce_orders (
 id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES commerce_users(id), idempotency_key text NOT NULL,
 request_hash text NOT NULL, status text NOT NULL CHECK(status IN ('pending','paid','failed','cancelled','refund_pending','refunded','review')),
 currency text NOT NULL, total_minor integer NOT NULL CHECK(total_minor > 0), market text NOT NULL,
 snapshot jsonb NOT NULL, consent_version text NOT NULL, consent_at timestamptz NOT NULL,
 stripe_session_id text UNIQUE, stripe_payment_intent text UNIQUE, checkout_url text,
 refunded_minor integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(user_id,idempotency_key)
);
CREATE TABLE IF NOT EXISTS commerce_payment_events (id text PRIMARY KEY, type text NOT NULL, object_id text NOT NULL, processed_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS commerce_entitlements (
 user_id uuid NOT NULL REFERENCES commerce_users(id), asset_id text NOT NULL REFERENCES commerce_assets(id),
 order_id uuid NOT NULL REFERENCES commerce_orders(id), status text NOT NULL CHECK(status IN ('active','revoked')),
 granted_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,asset_id,order_id)
);
CREATE TABLE IF NOT EXISTS commerce_inquiries (
 id uuid PRIMARY KEY, reference text NOT NULL UNIQUE, brand text NOT NULL CHECK(brand IN ('karuu','jkj-plus')),
 idempotency_key text NOT NULL, request_hash text NOT NULL, data jsonb NOT NULL,
 status text NOT NULL DEFAULT 'received' CHECK(status IN ('received','in_progress','closed')),
 notification_status text NOT NULL DEFAULT 'not_configured', created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(brand,idempotency_key)
);
CREATE TABLE IF NOT EXISTS commerce_outbox (
 id uuid PRIMARY KEY, brand text NOT NULL, kind text NOT NULL, reference_id uuid NOT NULL, recipient text NOT NULL,
 state text NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','sending','sent','failed')), attempts integer NOT NULL DEFAULT 0,
 leased_until timestamptz, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(kind,reference_id)
);
CREATE TABLE IF NOT EXISTS commerce_audit (
 id uuid PRIMARY KEY, actor_id uuid REFERENCES commerce_users(id), action text NOT NULL, target text NOT NULL,
 reason text NOT NULL, detail jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
-- Internal points, fiat receipts and content licenses are deliberately separate.
CREATE TABLE IF NOT EXISTS commerce_point_ledger (
 id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES commerce_users(id), game_id text NOT NULL,
 source text NOT NULL CHECK(source IN ('paid','gift')), units bigint NOT NULL, event_key text NOT NULL UNIQUE,
 order_id uuid REFERENCES commerce_orders(id), expires_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE commerce_point_ledger ADD COLUMN IF NOT EXISTS lot_id uuid REFERENCES commerce_point_ledger(id);
ALTER TABLE commerce_point_ledger ADD COLUMN IF NOT EXISTS funding_source_id text;
ALTER TABLE commerce_point_ledger ADD COLUMN IF NOT EXISTS rules_version text;
CREATE TABLE IF NOT EXISTS commerce_point_operations (
 event_key text PRIMARY KEY, request_hash text NOT NULL, result jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
-- Funding records can only originate from a verified future game-payment adapter.
-- Content purchases do not implicitly create game funding or cash balances.
CREATE TABLE IF NOT EXISTS commerce_game_funding (
 id text PRIMARY KEY, user_id uuid NOT NULL REFERENCES commerce_users(id), game_id text NOT NULL,
 original_funding_id text NOT NULL UNIQUE, units bigint NOT NULL CHECK(units>0), rules_version text NOT NULL,
 status text NOT NULL CHECK(status IN ('confirmed','reversed')), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS commerce_game_campaigns (
 id text PRIMARY KEY, game_id text NOT NULL, active boolean NOT NULL DEFAULT false, rules_version text NOT NULL,
 reward_units bigint NOT NULL CHECK(reward_units>0), budget_units bigint NOT NULL CHECK(budget_units>=0),
 used_units bigint NOT NULL DEFAULT 0 CHECK(used_units>=0 AND used_units<=budget_units)
);
CREATE TABLE IF NOT EXISTS commerce_game_reward_claims (
 campaign_id text NOT NULL REFERENCES commerce_game_campaigns(id), user_id uuid NOT NULL REFERENCES commerce_users(id),
 original_funding_id text NOT NULL, credit_id uuid NOT NULL REFERENCES commerce_point_ledger(id),
 PRIMARY KEY(campaign_id,user_id), UNIQUE(campaign_id,original_funding_id)
);
CREATE TABLE IF NOT EXISTS commerce_kru_records (
 id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES commerce_users(id), order_id uuid REFERENCES commerce_orders(id),
 state text NOT NULL DEFAULT 'eligibility_pending' CHECK(state IN ('eligibility_pending','pending','processing','confirmed','retry','cancelled')),
 network text, mint text, wallet text, units numeric(38,0), transaction_signature text UNIQUE, eligibility jsonb NOT NULL DEFAULT '{}',
 event_key text NOT NULL UNIQUE, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS commerce_entitlements_user_active ON commerce_entitlements(user_id,status);
CREATE INDEX IF NOT EXISTS commerce_orders_user_date ON commerce_orders(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS commerce_inquiries_brand_date ON commerce_inquiries(brand,created_at DESC);
CREATE INDEX IF NOT EXISTS commerce_outbox_ready ON commerce_outbox(state,leased_until);
INSERT INTO commerce_schema(version) VALUES(1) ON CONFLICT DO NOTHING;
COMMIT;
