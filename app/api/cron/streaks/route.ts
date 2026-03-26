import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  // Get all kids
  const { data: kids } = await supabase
    .from("profiles")
    .select("id, tenant_id, streak_days, streak_last_date")
    .eq("role", "kid")
    .eq("is_active", true);

  let updated = 0;

  for (const kid of kids || []) {
    // Check if kid had an approved transaction yesterday
    const { count } = await supabase
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .eq("kid_id", kid.id)
      .eq("status", "approved")
      .gte("created_at", `${yesterday}T00:00:00`)
      .lt("created_at", `${today}T00:00:00`);

    if (count && count > 0) {
      // Had activity yesterday — increment or maintain streak
      if (kid.streak_last_date === yesterday) {
        // Already counted
        continue;
      }

      const newStreak =
        kid.streak_last_date === new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0]
          ? kid.streak_days + 1
          : kid.streak_last_date === yesterday
            ? kid.streak_days
            : 1;

      await supabase
        .from("profiles")
        .update({
          streak_days: newStreak,
          streak_last_date: yesterday,
        })
        .eq("id", kid.id);

      updated++;
    } else if (kid.streak_last_date && kid.streak_last_date < yesterday) {
      // No activity — reset streak
      await supabase
        .from("profiles")
        .update({ streak_days: 0 })
        .eq("id", kid.id);

      updated++;
    }
  }

  return NextResponse.json({ updated });
}
