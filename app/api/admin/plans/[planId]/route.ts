import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";
import { requireRole } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    await requireRole("super_admin");
    const { planId } = await params;
    const body = await request.json();
    const supabase = createServiceRoleClient();

    const allowed = ["name", "is_active", "features", "sort_order", "max_kids"];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    const { data, error } = await supabase
      .from("pricing_plans")
      .update(updates)
      .eq("id", planId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
