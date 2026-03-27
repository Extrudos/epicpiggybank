-- ─── Add goal_id column to transactions ─────────────────────────
-- Allows linking a transaction to a savings goal (goal allocation)
ALTER TABLE transactions
  ADD COLUMN goal_id UUID REFERENCES savings_goals(id) ON DELETE SET NULL;

CREATE INDEX idx_transactions_goal_id ON transactions(goal_id) WHERE goal_id IS NOT NULL;

-- ─── Add goal_allocation to transaction type enum ───────────────
-- goal_allocation represents money moved from spendable balance into a goal pot
ALTER TABLE transactions
  DROP CONSTRAINT IF EXISTS transactions_type_check;

ALTER TABLE transactions
  ADD CONSTRAINT transactions_type_check CHECK (
    type IN (
      'allowance', 'gift', 'chore', 'good_grades',
      'spending', 'withdrawal', 'investment',
      'parent_deposit', 'parent_withdrawal',
      'goal_allocation'
    )
  );

-- ─── Update kid_balances view to include spendable balance ──────
-- total_balance = all credits - all debits (including goal_allocations)
-- spendable_balance = total_balance - money locked in goal pots
-- goal_savings = total currently allocated to goals
CREATE OR REPLACE VIEW kid_balances AS
SELECT
  kid_id,
  tenant_id,
  -- Total balance (all approved credits minus all approved debits, excluding goal_allocation which is internal)
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
  ) AS balance,
  -- Spendable = total minus goal allocations
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
  ) -
  COALESCE(
    SUM(CASE
      WHEN type = 'goal_allocation'
      THEN amount
      ELSE 0
    END),
    0
  ) AS spendable_balance,
  -- Total saved in goal pots
  COALESCE(
    SUM(CASE
      WHEN type = 'goal_allocation'
      THEN amount
      ELSE 0
    END),
    0
  ) AS goal_savings
FROM transactions
WHERE status = 'approved'
GROUP BY kid_id, tenant_id;
