import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";

export async function GET() {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("pricing_plans")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}
