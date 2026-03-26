import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";
import { requireRole } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export async function PATCH(request: Request) {
  try {
    const user = await requireRole("parent", "super_admin");
    const { displayName } = await request.json();
    const supabase = createServiceRoleClient();

    const updates: Record<string, unknown> = {};
    if (displayName) updates.display_name = displayName;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select("id, display_name, avatar_url")
      .single();

    if (error) throw error;

    await writeAuditLog({
      tenant_id: user.tenantId,
      user_id: user.id,
      action: "UPDATE",
      table_name: "profiles",
      record_id: user.id,
      new_value: updates,
    });

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
