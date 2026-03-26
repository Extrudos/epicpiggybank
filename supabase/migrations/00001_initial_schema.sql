-- ============================================================
-- EpicPiggyBank — Full Database Schema
-- ============================================================

-- No extension needed — using gen_random_uuid() which is built-in

-- ─── TENANTS ─────────────────────────────────────────────────
CREATE TABLE tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  stripe_customer_id text UNIQUE,
  stripe_subscription_id text,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'premium')),
  plan_status text NOT NULL DEFAULT 'active' CHECK (plan_status IN ('active', 'past_due', 'canceled', 'trialing')),
  max_kids int NOT NULL DEFAULT 2,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select_own" ON tenants
  FOR SELECT USING (
    id::text = ((auth.jwt()->'app_metadata'->>'tenant_id'))
    OR ((auth.jwt()->'app_metadata'->>'role') = 'super_admin')
  );

CREATE POLICY "tenant_update_own" ON tenants
  FOR UPDATE USING (
    id::text = ((auth.jwt()->'app_metadata'->>'tenant_id'))
    OR ((auth.jwt()->'app_metadata'->>'role') = 'super_admin')
  );

CREATE POLICY "super_admin_insert_tenant" ON tenants
  FOR INSERT WITH CHECK (
    (auth.jwt()->'app_metadata'->>'role') = 'super_admin'
  );

-- ─── PROFILES ────────────────────────────────────────────────
CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('super_admin', 'parent', 'kid')),
  display_name text NOT NULL,
  email text,
  avatar_url text,
  pin_hash text,
  level int NOT NULL DEFAULT 1,
  xp int NOT NULL DEFAULT 0,
  streak_days int NOT NULL DEFAULT 0,
  streak_last_date date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_tenant" ON profiles
  FOR SELECT USING (
    tenant_id::text = ((auth.jwt()->'app_metadata'->>'tenant_id'))
    OR ((auth.jwt()->'app_metadata'->>'role') = 'super_admin')
  );

CREATE POLICY "profiles_insert_tenant" ON profiles
  FOR INSERT WITH CHECK (
    tenant_id::text = ((auth.jwt()->'app_metadata'->>'tenant_id'))
    OR ((auth.jwt()->'app_metadata'->>'role') = 'super_admin')
  );

CREATE POLICY "profiles_update_tenant" ON profiles
  FOR UPDATE USING (
    tenant_id::text = ((auth.jwt()->'app_metadata'->>'tenant_id'))
    OR ((auth.jwt()->'app_metadata'->>'role') = 'super_admin')
  );

CREATE POLICY "profiles_delete_tenant" ON profiles
  FOR DELETE USING (
    tenant_id::text = ((auth.jwt()->'app_metadata'->>'tenant_id'))
    OR ((auth.jwt()->'app_metadata'->>'role') = 'super_admin')
  );

CREATE INDEX idx_profiles_tenant ON profiles(tenant_id);
CREATE INDEX idx_profiles_role ON profiles(tenant_id, role);

-- ─── TRANSACTIONS ────────────────────────────────────────────
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  kid_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN (
    'allowance', 'gift', 'chore', 'good_grades',
    'spending', 'withdrawal', 'investment',
    'parent_deposit', 'parent_withdrawal'
  )),
  amount numeric(12, 2) NOT NULL CHECK (amount > 0),
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  initiated_by uuid NOT NULL REFERENCES profiles(id),
  approved_by uuid REFERENCES profiles(id),
  approved_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions_select_tenant" ON transactions
  FOR SELECT USING (
    tenant_id::text = ((auth.jwt()->'app_metadata'->>'tenant_id'))
    OR ((auth.jwt()->'app_metadata'->>'role') = 'super_admin')
  );

CREATE POLICY "transactions_insert_tenant" ON transactions
  FOR INSERT WITH CHECK (
    tenant_id::text = ((auth.jwt()->'app_metadata'->>'tenant_id'))
    OR ((auth.jwt()->'app_metadata'->>'role') = 'super_admin')
  );

CREATE POLICY "transactions_update_tenant" ON transactions
  FOR UPDATE USING (
    tenant_id::text = ((auth.jwt()->'app_metadata'->>'tenant_id'))
    OR ((auth.jwt()->'app_metadata'->>'role') = 'super_admin')
  );

CREATE INDEX idx_transactions_tenant ON transactions(tenant_id);
CREATE INDEX idx_transactions_kid ON transactions(kid_id);
CREATE INDEX idx_transactions_status ON transactions(tenant_id, status);

-- ─── ALLOWANCE SCHEDULES ────────────────────────────────────
CREATE TABLE allowance_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  kid_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount numeric(12, 2) NOT NULL CHECK (amount > 0),
  frequency text NOT NULL CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly')),
  day_of_week int CHECK (day_of_week >= 0 AND day_of_week <= 6),
  day_of_month int CHECK (day_of_month >= 1 AND day_of_month <= 28),
  is_active boolean NOT NULL DEFAULT true,
  next_run_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE allowance_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allowance_schedules_select_tenant" ON allowance_schedules
  FOR SELECT USING (
    tenant_id::text = ((auth.jwt()->'app_metadata'->>'tenant_id'))
    OR ((auth.jwt()->'app_metadata'->>'role') = 'super_admin')
  );

CREATE POLICY "allowance_schedules_insert_tenant" ON allowance_schedules
  FOR INSERT WITH CHECK (
    tenant_id::text = ((auth.jwt()->'app_metadata'->>'tenant_id'))
    OR ((auth.jwt()->'app_metadata'->>'role') = 'super_admin')
  );

CREATE POLICY "allowance_schedules_update_tenant" ON allowance_schedules
  FOR UPDATE USING (
    tenant_id::text = ((auth.jwt()->'app_metadata'->>'tenant_id'))
    OR ((auth.jwt()->'app_metadata'->>'role') = 'super_admin')
  );

CREATE POLICY "allowance_schedules_delete_tenant" ON allowance_schedules
  FOR DELETE USING (
    tenant_id::text = ((auth.jwt()->'app_metadata'->>'tenant_id'))
    OR ((auth.jwt()->'app_metadata'->>'role') = 'super_admin')
  );

CREATE INDEX idx_allowance_schedules_next ON allowance_schedules(next_run_at) WHERE is_active = true;

-- ─── SAVINGS GOALS ───────────────────────────────────────────
CREATE TABLE savings_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  kid_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  target_amount numeric(12, 2) NOT NULL CHECK (target_amount > 0),
  current_amount numeric(12, 2) NOT NULL DEFAULT 0,
  icon text,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "savings_goals_select_tenant" ON savings_goals
  FOR SELECT USING (
    tenant_id::text = ((auth.jwt()->'app_metadata'->>'tenant_id'))
    OR ((auth.jwt()->'app_metadata'->>'role') = 'super_admin')
  );

CREATE POLICY "savings_goals_insert_tenant" ON savings_goals
  FOR INSERT WITH CHECK (
    tenant_id::text = ((auth.jwt()->'app_metadata'->>'tenant_id'))
    OR ((auth.jwt()->'app_metadata'->>'role') = 'super_admin')
  );

CREATE POLICY "savings_goals_update_tenant" ON savings_goals
  FOR UPDATE USING (
    tenant_id::text = ((auth.jwt()->'app_metadata'->>'tenant_id'))
    OR ((auth.jwt()->'app_metadata'->>'role') = 'super_admin')
  );

CREATE POLICY "savings_goals_delete_tenant" ON savings_goals
  FOR DELETE USING (
    tenant_id::text = ((auth.jwt()->'app_metadata'->>'tenant_id'))
    OR ((auth.jwt()->'app_metadata'->>'role') = 'super_admin')
  );

CREATE INDEX idx_savings_goals_kid ON savings_goals(kid_id);

-- ─── BADGES (global) ────────────────────────────────────────
CREATE TABLE badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  icon_url text NOT NULL,
  criteria_type text NOT NULL,
  criteria_value int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "badges_select_all" ON badges
  FOR SELECT USING (true);

CREATE POLICY "badges_manage_admin" ON badges
  FOR ALL USING ((auth.jwt()->'app_metadata'->>'role') = 'super_admin');

-- ─── KID BADGES ──────────────────────────────────────────────
CREATE TABLE kid_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  kid_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(kid_id, badge_id)
);

ALTER TABLE kid_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kid_badges_select_tenant" ON kid_badges
  FOR SELECT USING (
    tenant_id::text = ((auth.jwt()->'app_metadata'->>'tenant_id'))
    OR ((auth.jwt()->'app_metadata'->>'role') = 'super_admin')
  );

CREATE INDEX idx_kid_badges_kid ON kid_badges(kid_id);

-- ─── COLLECTIBLES (global) ──────────────────────────────────
CREATE TABLE collectibles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  image_url text NOT NULL,
  rarity text NOT NULL CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  unlock_condition jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE collectibles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "collectibles_select_all" ON collectibles
  FOR SELECT USING (true);

CREATE POLICY "collectibles_manage_admin" ON collectibles
  FOR ALL USING ((auth.jwt()->'app_metadata'->>'role') = 'super_admin');

-- ─── KID COLLECTIBLES ───────────────────────────────────────
CREATE TABLE kid_collectibles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  kid_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  collectible_id uuid NOT NULL REFERENCES collectibles(id) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(kid_id, collectible_id)
);

ALTER TABLE kid_collectibles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kid_collectibles_select_tenant" ON kid_collectibles
  FOR SELECT USING (
    tenant_id::text = ((auth.jwt()->'app_metadata'->>'tenant_id'))
    OR ((auth.jwt()->'app_metadata'->>'role') = 'super_admin')
  );

CREATE INDEX idx_kid_collectibles_kid ON kid_collectibles(kid_id);

-- ─── AUDIT LOG ───────────────────────────────────────────────
CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL,
  user_id uuid NOT NULL,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_value jsonb,
  new_value jsonb,
  ip_address inet,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Append-only: insert for authenticated users, select for super admin only
CREATE POLICY "audit_log_insert" ON audit_log
  FOR INSERT WITH CHECK (true);

CREATE POLICY "audit_log_select_admin" ON audit_log
  FOR SELECT USING ((auth.jwt()->'app_metadata'->>'role') = 'super_admin');

-- No UPDATE or DELETE policies — append only

CREATE INDEX idx_audit_log_tenant ON audit_log(tenant_id);
CREATE INDEX idx_audit_log_timestamp ON audit_log(created_at DESC);

-- ─── PRICING PLANS ───────────────────────────────────────────
CREATE TABLE pricing_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_price_id text UNIQUE NOT NULL,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  price_cents int NOT NULL,
  interval text NOT NULL CHECK (interval IN ('month', 'year')),
  features jsonb NOT NULL DEFAULT '[]',
  max_kids int NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;

-- Public can read active plans (for pricing page)
CREATE POLICY "pricing_plans_select_all" ON pricing_plans
  FOR SELECT USING (true);

CREATE POLICY "pricing_plans_manage_admin" ON pricing_plans
  FOR ALL USING ((auth.jwt()->'app_metadata'->>'role') = 'super_admin');

-- ─── COUPONS ─────────────────────────────────────────────────
CREATE TABLE coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_coupon_id text UNIQUE NOT NULL,
  code text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('percent', 'fixed')),
  value numeric(10, 2) NOT NULL,
  max_uses int,
  times_used int NOT NULL DEFAULT 0,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coupons_manage_admin" ON coupons
  FOR ALL USING ((auth.jwt()->'app_metadata'->>'role') = 'super_admin');

-- ─── HELPER: Auto-update updated_at ─────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── HELPER: Balance view ────────────────────────────────────
CREATE OR REPLACE VIEW kid_balances AS
SELECT
  kid_id,
  tenant_id,
  COALESCE(
    SUM(CASE
      WHEN type IN ('allowance', 'gift', 'chore', 'good_grades', 'investment', 'parent_deposit')
      THEN amount
      ELSE 0
    END),
    0
  ) -
  COALESCE(
    SUM(CASE
      WHEN type IN ('spending', 'withdrawal', 'parent_withdrawal')
      THEN amount
      ELSE 0
    END),
    0
  ) AS balance
FROM transactions
WHERE status = 'approved'
GROUP BY kid_id, tenant_id;
