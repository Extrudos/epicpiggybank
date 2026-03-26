import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";

export async function POST(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();

  // Find all due schedules
  const { data: schedules, error } = await supabase
    .from("allowance_schedules")
    .select("*")
    .eq("is_active", true)
    .lte("next_run_at", new Date().toISOString());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let processed = 0;

  for (const schedule of schedules || []) {
    // Find a parent in the tenant to set as initiator
    const { data: parent } = await supabase
      .from("profiles")
      .select("id")
      .eq("tenant_id", schedule.tenant_id)
      .eq("role", "parent")
      .limit(1)
      .single();

    if (!parent) continue;

    // Create approved allowance transaction
    await supabase.from("transactions").insert({
      tenant_id: schedule.tenant_id,
      kid_id: schedule.kid_id,
      type: "allowance",
      amount: schedule.amount,
      description: `Scheduled ${schedule.frequency} allowance`,
      status: "approved",
      initiated_by: parent.id,
      approved_by: parent.id,
      approved_at: new Date().toISOString(),
    });

    // Calculate next run
    const nextRun = new Date(schedule.next_run_at);
    switch (schedule.frequency) {
      case "daily":
        nextRun.setDate(nextRun.getDate() + 1);
        break;
      case "weekly":
        nextRun.setDate(nextRun.getDate() + 7);
        break;
      case "biweekly":
        nextRun.setDate(nextRun.getDate() + 14);
        break;
      case "monthly":
        nextRun.setMonth(nextRun.getMonth() + 1);
        break;
    }

    await supabase
      .from("allowance_schedules")
      .update({ next_run_at: nextRun.toISOString() })
      .eq("id", schedule.id);

    processed++;
  }

  return NextResponse.json({ processed });
}
