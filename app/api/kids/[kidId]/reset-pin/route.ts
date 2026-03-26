import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createServiceRoleClient } from "@/lib/supabase";
import { requireRole } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ kidId: string }> }
) {
  try {
    const user = await requireRole("parent");
    const { kidId } = await params;
    const { pin } = await request.json();

    if (!pin || pin.length < 4 || pin.length > 6) {
      return NextResponse.json(
        { error: "PIN must be 4-6 digits" },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();
    const pinHash = await bcrypt.hash(pin, 10);

    const { error } = await supabase
      .from("profiles")
      .update({ pin_hash: pinHash })
      .eq("id", kidId)
      .eq("tenant_id", user.tenantId)
      .eq("role", "kid");

    if (error) throw error;

    await writeAuditLog({
      tenant_id: user.tenantId,
      user_id: user.id,
      action: "UPDATE",
      table_name: "profiles",
      record_id: kidId,
      new_value: { pin_reset: true },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
