import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";
import { requireRole } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  try {
    const user = await requireRole("parent", "kid");
    const { transactionId } = await params;
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from("transactions")
      .select("*, kid:profiles!kid_id(display_name, avatar_url)")
      .eq("id", transactionId)
      .eq("tenant_id", user.tenantId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // Kids can only see their own
    if (user.role === "kid" && data.kid_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  try {
    const user = await requireRole("parent");
    const { transactionId } = await params;
    const { status, notes } = await request.json();

    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Status must be 'approved' or 'rejected'" },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    const { data: old } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", transactionId)
      .eq("tenant_id", user.tenantId)
      .eq("status", "pending")
      .single();

    if (!old) {
      return NextResponse.json(
        { error: "Transaction not found or already processed" },
        { status: 404 }
      );
    }

    const updates = {
      status,
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      notes: notes || old.notes,
    };

    const { data: txn, error } = await supabase
      .from("transactions")
      .update(updates)
      .eq("id", transactionId)
      .select()
      .single();

    if (error) throw error;

    // If approving a deposit tagged to a goal, update goal progress
    if (status === "approved" && old.goal_id) {
      const { data: goal } = await supabase
        .from("savings_goals")
        .select("current_amount, target_amount")
        .eq("id", old.goal_id)
        .single();

      if (goal) {
        // Create auto-approved goal_allocation transaction
        await supabase.from("transactions").insert({
          tenant_id: user.tenantId,
          kid_id: old.kid_id,
          type: "goal_allocation",
          amount: old.amount,
          description: `Saved to goal`,
          goal_id: old.goal_id,
          status: "approved",
          initiated_by: old.kid_id,
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        });

        const newAmount = goal.current_amount + old.amount;
        const isCompleted = newAmount >= goal.target_amount;

        await supabase
          .from("savings_goals")
          .update({
            current_amount: newAmount,
            is_completed: isCompleted,
            completed_at: isCompleted ? new Date().toISOString() : null,
          })
          .eq("id", old.goal_id);
      }
    }

    await writeAuditLog({
      tenant_id: user.tenantId,
      user_id: user.id,
      action: status === "approved" ? "APPROVE" : "REJECT",
      table_name: "transactions",
      record_id: transactionId,
      old_value: { status: old.status },
      new_value: { status },
    });

    return NextResponse.json(txn);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
