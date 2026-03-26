import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";
import { requireRole } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export async function GET() {
  try {
    const user = await requireRole("parent");
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from("allowance_schedules")
      .select("*, kid:profiles!kid_id(display_name, avatar_url)")
      .eq("tenant_id", user.tenantId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole("parent");
    const body = await request.json();
    const supabase = createServiceRoleClient();

    const { kidId, amount, frequency, dayOfWeek, dayOfMonth } = body;

    if (!kidId || !amount || !frequency) {
      return NextResponse.json({ error: "Kid, amount, and frequency required" }, { status: 400 });
    }

    // Calculate next_run_at based on frequency
    const now = new Date();
    let nextRun = new Date(now);

    switch (frequency) {
      case "daily":
        nextRun.setDate(nextRun.getDate() + 1);
        nextRun.setHours(6, 0, 0, 0);
        break;
      case "weekly":
        nextRun.setDate(nextRun.getDate() + ((7 + (dayOfWeek || 0) - nextRun.getDay()) % 7 || 7));
        nextRun.setHours(6, 0, 0, 0);
        break;
      case "biweekly":
        nextRun.setDate(nextRun.getDate() + 14);
        nextRun.setHours(6, 0, 0, 0);
        break;
      case "monthly":
        nextRun.setMonth(nextRun.getMonth() + 1);
        nextRun.setDate(dayOfMonth || 1);
        nextRun.setHours(6, 0, 0, 0);
        break;
    }

    const { data, error } = await supabase
      .from("allowance_schedules")
      .insert({
        tenant_id: user.tenantId,
        kid_id: kidId,
        amount,
        frequency,
        day_of_week: dayOfWeek ?? null,
        day_of_month: dayOfMonth ?? null,
        next_run_at: nextRun.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    await writeAuditLog({
      tenant_id: user.tenantId,
      user_id: user.id,
      action: "INSERT",
      table_name: "allowance_schedules",
      record_id: data.id,
      new_value: { kid_id: kidId, amount, frequency },
    });

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
