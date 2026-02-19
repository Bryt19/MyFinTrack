-- =============================================================================
-- MoneyGrid – Full database schema + RLS (Supabase)
-- Run this entire file in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- =============================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. USER SETTINGS (gross income, currency)
-- =============================================================================
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gross_income numeric(12,2) CHECK (gross_income IS NULL OR gross_income >= 0),
  red_line_amount numeric(12,2) CHECK (red_line_amount IS NULL OR red_line_amount >= 0),
  currency text NOT NULL DEFAULT 'USD',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- If you already have user_settings, add the column:
-- ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS red_line_amount numeric(12,2) CHECK (red_line_amount IS NULL OR red_line_amount >= 0);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_settings_select_own"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_settings_insert_own"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_settings_update_own"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_settings_delete_own"
  ON user_settings FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- 2. CATEGORIES (income/expense categories, optional budget limit per category)
-- =============================================================================
CREATE TABLE IF NOT EXISTS categories (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name varchar(100) NOT NULL,
  type varchar(10) NOT NULL CHECK (type IN ('income', 'expense')),
  budget_limit numeric(12,2) CHECK (budget_limit IS NULL OR budget_limit >= 0),
  color varchar(7) DEFAULT '#3B82F6',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(user_id, type);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_select_own"
  ON categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "categories_insert_own"
  ON categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "categories_update_own"
  ON categories FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "categories_delete_own"
  ON categories FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- 3. TRANSACTIONS (income/expense entries, optional receipt)
-- =============================================================================
CREATE TABLE IF NOT EXISTS transactions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  type varchar(10) NOT NULL CHECK (type IN ('income', 'expense')),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  date date NOT NULL DEFAULT current_date,
  description text,
  receipt_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions_select_own"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "transactions_insert_own"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transactions_update_own"
  ON transactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transactions_delete_own"
  ON transactions FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- 4. BUDGETS (period-based budget per category)
-- =============================================================================
CREATE TABLE IF NOT EXISTS budgets (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  period varchar(20) NOT NULL DEFAULT 'monthly',
  start_date date NOT NULL,
  end_date date NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budgets_select_own"
  ON budgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "budgets_insert_own"
  ON budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "budgets_update_own"
  ON budgets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "budgets_delete_own"
  ON budgets FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- 5. SAVINGS GOALS (target amount, current amount, deadline)
-- =============================================================================
CREATE TABLE IF NOT EXISTS savings_goals (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name varchar(200) NOT NULL,
  target_amount numeric(12,2) NOT NULL CHECK (target_amount > 0),
  current_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  deadline date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_savings_goals_user_id ON savings_goals(user_id);

ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "savings_goals_select_own"
  ON savings_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "savings_goals_insert_own"
  ON savings_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "savings_goals_update_own"
  ON savings_goals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "savings_goals_delete_own"
  ON savings_goals FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- 6. SAVINGS CONTRIBUTIONS (optional audit trail for goal deposits)
-- =============================================================================
CREATE TABLE IF NOT EXISTS savings_contributions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  goal_id uuid NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  contributed_at timestamptz DEFAULT now(),
  note text
);

CREATE INDEX IF NOT EXISTS idx_savings_contributions_goal_id ON savings_contributions(goal_id);

ALTER TABLE savings_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "savings_contributions_select_own"
  ON savings_contributions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM savings_goals sg
      WHERE sg.id = savings_contributions.goal_id AND sg.user_id = auth.uid()
    )
  );

CREATE POLICY "savings_contributions_insert_own"
  ON savings_contributions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM savings_goals sg
      WHERE sg.id = goal_id AND sg.user_id = auth.uid()
    )
  );

CREATE POLICY "savings_contributions_update_own"
  ON savings_contributions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM savings_goals sg
      WHERE sg.id = savings_contributions.goal_id AND sg.user_id = auth.uid()
    )
  );

CREATE POLICY "savings_contributions_delete_own"
  ON savings_contributions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM savings_goals sg
      WHERE sg.id = savings_contributions.goal_id AND sg.user_id = auth.uid()
    )
  );

-- =============================================================================
-- 7. STORAGE: receipts bucket (PNG, JPG, PDF)
-- =============================================================================
-- First create the bucket in Supabase Dashboard: Storage → New bucket → name "receipts", set to Private.
-- Then run the policies below. If the bucket already exists, skip the insert.

INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own folder: {user_id}/filename
DROP POLICY IF EXISTS "receipts_upload_own" ON storage.objects;
CREATE POLICY "receipts_upload_own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "receipts_select_own" ON storage.objects;
CREATE POLICY "receipts_select_own"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "receipts_delete_own" ON storage.objects;
CREATE POLICY "receipts_delete_own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- =============================================================================
-- 8. HELPER: update updated_at on user_settings
-- =============================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_settings_updated_at ON user_settings;
CREATE TRIGGER user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS transactions_updated_at ON transactions;
CREATE TRIGGER transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS savings_goals_updated_at ON savings_goals;
CREATE TRIGGER savings_goals_updated_at
  BEFORE UPDATE ON savings_goals
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- =============================================================================
-- 9. MIGRATION: add red_line_amount if table already existed without it
-- =============================================================================
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS red_line_amount numeric(12,2) CHECK (red_line_amount IS NULL OR red_line_amount >= 0);

-- =============================================================================
-- 11. MIGRATION: add description to budgets
-- =============================================================================
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS description text;
