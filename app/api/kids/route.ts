import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createServiceRoleClient } from "@/lib/supabase";
import { requireRole } from "@/lib/auth";
import { assertKidLimit } from "@/lib/plan-gates";
import { writeAuditLog } from "@/lib/audit";

export async function GET() {
  try {
    const user = await requireRole("parent");
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("id, tenant_id, display_name, avatar_url, level, xp, streak_days, streak_last_date, is_active, created_at")
      .eq("tenant_id", user.tenantId)
      .eq("role", "kid")
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Get balances for each kid
    const { data: balances } = await supabase
      .from("kid_balances")
      .select("kid_id, balance")
      .eq("tenant_id", user.tenantId);

    const balanceMap = new Map(
      (balances || []).map((b) => [b.kid_id, Number(b.balance)])
    );

    const kids = (data || []).map((kid) => ({
      ...kid,
      balance: balanceMap.get(kid.id) ?? 0,
    }));

    return NextResponse.json(kids);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole("parent");

    await assertKidLimit(user.tenantId);

    const { displayName, pin, avatarUrl } = await request.json();

    if (!displayName || !pin) {
      return NextResponse.json(
        { error: "Name and PIN are required" },
        { status: 400 }
      );
    }

    if (pin.length < 4 || pin.length > 6) {
      return NextResponse.json(
        { error: "PIN must be 4-6 digits" },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();
    const pinHash = await bcrypt.hash(pin, 10);

    const { data: kid, error } = await supabase
      .from("profiles")
      .insert({
        tenant_id: user.tenantId,
        role: "kid",
        display_name: displayName,
        avatar_url: avatarUrl || null,
        pin_hash: pinHash,
      })
      .select()
      .single();

    if (error) throw error;

    await writeAuditLog({
      tenant_id: user.tenantId,
      user_id: user.id,
      action: "INSERT",
      table_name: "profiles",
      record_id: kid.id,
      new_value: { display_name: displayName, role: "kid" },
    });

    return NextResponse.json(kid, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    const status = err instanceof Error && err.name === "PlanLimitError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
