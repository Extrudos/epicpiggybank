import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const user = await requireSession();
    const { goalId, amount, kidId } = await request.json();

    const actualKidId = user.role === "kid" ? user.id : kidId;

    if (!goalId || !amount || amount <= 0 || !actualKidId) {
      return NextResponse.json(
        { error: "Goal ID, kid ID, and a positive amount are required" },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Verify goal belongs to this kid and tenant
    const { data: goal, error: goalErr } = await supabase
      .from("savings_goals")
      .select("*")
      .eq("id", goalId)
      .eq("kid_id", actualKidId)
      .eq("tenant_id", user.tenantId)
      .single();

    if (goalErr || !goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    if (goal.is_completed) {
      return NextResponse.json({ error: "Goal is already completed" }, { status: 400 });
    }

    // Check spendable balance
    const { data: balData } = await supabase
      .from("kid_balances")
      .select("spendable_balance")
      .eq("kid_id", actualKidId)
      .eq("tenant_id", user.tenantId)
      .single();

    const spendable = balData ? Number(balData.spendable_balance) : 0;
    if (amount > spendable) {
      return NextResponse.json(
        { error: "Not enough spendable balance" },
        { status: 400 }
      );
    }

    // Cap allocation at remaining goal amount
    const remaining = goal.target_amount - goal.current_amount;
    const allocAmount = Math.min(amount, remaining);

    // Create goal_allocation transaction (auto-approved)
    const { data: txn, error: txnErr } = await supabase
      .from("transactions")
      .insert({
        tenant_id: user.tenantId,
        kid_id: actualKidId,
        type: "goal_allocation",
        amount: allocAmount,
        description: `Saved to ${goal.name}`,
        goal_id: goalId,
        status: "approved",
        initiated_by: user.id,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (txnErr) throw txnErr;

    // Update goal current_amount
    const newAmount = goal.current_amount + allocAmount;
    const isCompleted = newAmount >= goal.target_amount;

    const { error: updateErr } = await supabase
      .from("savings_goals")
      .update({
        current_amount: newAmount,
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
      })
      .eq("id", goalId);

    if (updateErr) throw updateErr;

    await writeAuditLog({
      tenant_id: user.tenantId,
      user_id: user.id,
      action: "GOAL_ALLOCATION",
      table_name: "transactions",
      record_id: txn.id,
      new_value: { goal_id: goalId, amount: allocAmount, goal_completed: isCompleted },
    });

    return NextResponse.json({
      transaction: txn,
      goalCompleted: isCompleted,
      newGoalAmount: newAmount,
      goalTarget: goal.target_amount,
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
