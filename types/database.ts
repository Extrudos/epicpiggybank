export type Plan = "free" | "premium";
export type PlanStatus = "active" | "past_due" | "canceled" | "trialing";
export type UserRole = "super_admin" | "parent" | "kid";
export type TransactionType =
  | "allowance"
  | "gift"
  | "chore"
  | "good_grades"
  | "spending"
  | "withdrawal"
  | "investment"
  | "parent_deposit"
  | "parent_withdrawal";
export type TransactionStatus = "pending" | "approved" | "rejected";
export type AllowanceFrequency = "daily" | "weekly" | "biweekly" | "monthly";
export type CouponType = "percent" | "fixed";
export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";
export type PricingInterval = "month" | "year";

export interface Tenant {
  id: string;
  name: string;
  family_code: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: Plan;
  plan_status: PlanStatus;
  max_kids: number;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  tenant_id: string;
  role: UserRole;
  display_name: string;
  email: string | null;
  avatar_url: string | null;
  pin_hash: string | null;
  level: number;
  xp: number;
  streak_days: number;
  streak_last_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  tenant_id: string;
  kid_id: string;
  type: TransactionType;
  amount: number;
  description: string | null;
  status: TransactionStatus;
  initiated_by: string;
  approved_by: string | null;
  approved_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface AllowanceSchedule {
  id: string;
  tenant_id: string;
  kid_id: string;
  amount: number;
  frequency: AllowanceFrequency;
  day_of_week: number | null;
  day_of_month: number | null;
  is_active: boolean;
  next_run_at: string;
  created_at: string;
}

export interface SavingsGoal {
  id: string;
  tenant_id: string;
  kid_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  icon: string | null;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface Badge {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon_url: string;
  criteria_type: string;
  criteria_value: number;
  created_at: string;
}

export interface KidBadge {
  id: string;
  tenant_id: string;
  kid_id: string;
  badge_id: string;
  earned_at: string;
}

export interface Collectible {
  id: string;
  slug: string;
  name: string;
  description: string;
  image_url: string;
  rarity: Rarity;
  unlock_condition: Record<string, unknown>;
  created_at: string;
}

export interface KidCollectible {
  id: string;
  tenant_id: string;
  kid_id: string;
  collectible_id: string;
  earned_at: string;
}

export interface AuditLog {
  id: string;
  tenant_id: string | null;
  user_id: string;
  action: string;
  table_name: string;
  record_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface PricingPlan {
  id: string;
  stripe_price_id: string;
  name: string;
  slug: string;
  price_cents: number;
  interval: PricingInterval;
  features: string[];
  max_kids: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Coupon {
  id: string;
  stripe_coupon_id: string;
  code: string;
  type: CouponType;
  value: number;
  max_uses: number | null;
  times_used: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface SessionUser {
  id: string;
  tenantId: string;
  role: UserRole;
  displayName: string;
  avatarUrl: string | null;
}

export const CREDIT_TYPES: TransactionType[] = [
  "allowance",
  "gift",
  "chore",
  "good_grades",
  "investment",
  "parent_deposit",
];

export const DEBIT_TYPES: TransactionType[] = [
  "spending",
  "withdrawal",
  "parent_withdrawal",
];
