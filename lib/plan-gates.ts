import { createServiceRoleClient } from "./supabase";

export class PlanLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlanLimitError";
  }
}

export async function getTenant(tenantId: string) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .eq("id", tenantId)
    .single();

  if (error || !data) throw new Error("Tenant not found");
  return data;
}

export async function assertPremium(tenantId: string): Promise<void> {
  const tenant = await getTenant(tenantId);
  if (tenant.plan !== "premium") {
    throw new PlanLimitError(
      "This feature requires a Premium subscription. Please upgrade to continue."
    );
  }
}

export async function assertKidLimit(tenantId: string): Promise<void> {
  const supabase = createServiceRoleClient();
  const tenant = await getTenant(tenantId);

  const { count } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("role", "kid")
    .eq("is_active", true);

  if ((count ?? 0) >= tenant.max_kids) {
    throw new PlanLimitError(
      `You've reached the maximum of ${tenant.max_kids} kids on your current plan. Upgrade to Premium for unlimited kids.`
    );
  }
}
