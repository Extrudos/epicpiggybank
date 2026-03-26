import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";
import { requireRole } from "@/lib/auth";

export async function GET() {
  try {
    await requireRole("super_admin");
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from("tenants")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
