import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";
import { requireRole } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    await requireRole("super_admin");
    const { tenantId } = await params;
    const supabase = createServiceRoleClient();

    const { data: tenant } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", tenantId)
      .single();

    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("role");

    return NextResponse.json({ tenant, profiles: profiles || [] });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    await requireRole("super_admin");
    const { tenantId } = await params;
    const body = await request.json();
    const supabase = createServiceRoleClient();

    const allowed = ["name", "plan", "plan_status", "max_kids"];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    const { data, error } = await supabase
      .from("tenants")
      .update(updates)
      .eq("id", tenantId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
