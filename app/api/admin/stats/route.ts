import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";
import { requireRole } from "@/lib/auth";

export async function GET() {
  try {
    await requireRole("super_admin");
    const supabase = createServiceRoleClient();

    const [tenants, users, kids, premium] = await Promise.all([
      supabase.from("tenants").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "kid"),
      supabase.from("tenants").select("*", { count: "exact", head: true }).eq("plan", "premium"),
    ]);

    return NextResponse.json({
      totalTenants: tenants.count ?? 0,
      totalUsers: users.count ?? 0,
      totalKids: kids.count ?? 0,
      premiumTenants: premium.count ?? 0,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
