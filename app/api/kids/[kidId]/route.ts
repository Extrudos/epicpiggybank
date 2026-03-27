import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";
import { requireRole } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ kidId: string }> }
) {
  try {
    const user = await requireRole("parent", "kid");
    const { kidId } = await params;
    const supabase = createServiceRoleClient();

    const { data: kid, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", kidId)
      .eq("tenant_id", user.tenantId)
      .eq("role", "kid")
      .single();

    if (error || !kid) {
      return NextResponse.json({ error: "Kid not found" }, { status: 404 });
    }

    // Get balance
    const { data: balance } = await supabase
      .from("kid_balances")
      .select("balance, spendable_balance, goal_savings")
      .eq("kid_id", kidId)
      .single();

    return NextResponse.json({
      ...kid,
      pin_hash: undefined,
      balance: balance ? Number(balance.balance) : 0,
      spendable_balance: balance ? Number(balance.spendable_balance) : 0,
      goal_savings: balance ? Number(balance.goal_savings) : 0,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ kidId: string }> }
) {
  try {
    const user = await requireRole("parent");
    const { kidId } = await params;
    const body = await request.json();
    const supabase = createServiceRoleClient();

    // Only allow updating specific fields
    const allowed = ["display_name", "avatar_url", "email", "is_active"];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    const { data: oldKid } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", kidId)
      .eq("tenant_id", user.tenantId)
      .single();

    const { data: kid, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", kidId)
      .eq("tenant_id", user.tenantId)
      .select()
      .single();

    if (error || !kid) {
      return NextResponse.json({ error: "Failed to update kid" }, { status: 400 });
    }

    await writeAuditLog({
      tenant_id: user.tenantId,
      user_id: user.id,
      action: "UPDATE",
      table_name: "profiles",
      record_id: kidId,
      old_value: oldKid as Record<string, unknown>,
      new_value: updates,
    });

    return NextResponse.json({ ...kid, pin_hash: undefined });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ kidId: string }> }
) {
  try {
    const user = await requireRole("parent");
    const { kidId } = await params;
    const supabase = createServiceRoleClient();

    // Soft delete — mark as inactive
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: false })
      .eq("id", kidId)
      .eq("tenant_id", user.tenantId);

    if (error) throw error;

    await writeAuditLog({
      tenant_id: user.tenantId,
      user_id: user.id,
      action: "DELETE",
      table_name: "profiles",
      record_id: kidId,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
