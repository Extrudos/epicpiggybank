import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ goalId: string }> }
) {
  try {
    const user = await requireSession();
    const { goalId } = await params;
    const body = await request.json();
    const supabase = createServiceRoleClient();

    const allowed = ["name", "target_amount", "current_amount", "icon", "is_completed", "completed_at"];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    const { data, error } = await supabase
      .from("savings_goals")
      .update(updates)
      .eq("id", goalId)
      .eq("tenant_id", user.tenantId)
      .select()
      .single();

    if (error) throw error;

    await writeAuditLog({
      tenant_id: user.tenantId,
      user_id: user.id,
      action: "UPDATE",
      table_name: "savings_goals",
      record_id: goalId,
      new_value: updates,
    });

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ goalId: string }> }
) {
  try {
    const user = await requireSession();
    const { goalId } = await params;
    const supabase = createServiceRoleClient();

    const { error } = await supabase
      .from("savings_goals")
      .delete()
      .eq("id", goalId)
      .eq("tenant_id", user.tenantId);

    if (error) throw error;

    await writeAuditLog({
      tenant_id: user.tenantId,
      user_id: user.id,
      action: "DELETE",
      table_name: "savings_goals",
      record_id: goalId,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
