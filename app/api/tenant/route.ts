import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";
import { requireRole } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireRole("parent");
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from("tenants")
      .select("id, name, family_code, plan, plan_status, max_kids")
      .eq("id", user.tenantId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
