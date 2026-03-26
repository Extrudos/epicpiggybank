import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";
import { requireRole } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  try {
    const user = await requireRole("parent");
    const { scheduleId } = await params;
    const body = await request.json();
    const supabase = createServiceRoleClient();

    const allowed = ["amount", "frequency", "day_of_week", "day_of_month", "is_active"];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    const { data, error } = await supabase
      .from("allowance_schedules")
      .update(updates)
      .eq("id", scheduleId)
      .eq("tenant_id", user.tenantId)
      .select()
      .single();

    if (error) throw error;

    await writeAuditLog({
      tenant_id: user.tenantId,
      user_id: user.id,
      action: "UPDATE",
      table_name: "allowance_schedules",
      record_id: scheduleId,
      new_value: updates,
    });

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  try {
    const user = await requireRole("parent");
    const { scheduleId } = await params;
    const supabase = createServiceRoleClient();

    const { error } = await supabase
      .from("allowance_schedules")
      .delete()
      .eq("id", scheduleId)
      .eq("tenant_id", user.tenantId);

    if (error) throw error;

    await writeAuditLog({
      tenant_id: user.tenantId,
      user_id: user.id,
      action: "DELETE",
      table_name: "allowance_schedules",
      record_id: scheduleId,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
