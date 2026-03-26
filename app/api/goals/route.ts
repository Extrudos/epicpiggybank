import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    const user = await requireSession();
    const supabase = createServiceRoleClient();
    const kidId = request.nextUrl.searchParams.get("kidId");

    let query = supabase
      .from("savings_goals")
      .select("*")
      .eq("tenant_id", user.tenantId)
      .order("created_at", { ascending: false });

    if (user.role === "kid") {
      query = query.eq("kid_id", user.id);
    } else if (kidId) {
      query = query.eq("kid_id", kidId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSession();
    const { name, targetAmount, icon, kidId } = await request.json();

    const actualKidId = user.role === "kid" ? user.id : kidId;

    if (!name || !targetAmount || !actualKidId) {
      return NextResponse.json({ error: "Name, target amount, and kid required" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from("savings_goals")
      .insert({
        tenant_id: user.tenantId,
        kid_id: actualKidId,
        name,
        target_amount: targetAmount,
        icon: icon || null,
      })
      .select()
      .single();

    if (error) throw error;

    await writeAuditLog({
      tenant_id: user.tenantId,
      user_id: user.id,
      action: "INSERT",
      table_name: "savings_goals",
      record_id: data.id,
      new_value: { name, target_amount: targetAmount, kid_id: actualKidId },
    });

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
