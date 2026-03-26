import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";
import { requireRole } from "@/lib/auth";

export async function GET() {
  try {
    // Badges are readable by all authenticated users (for display)
    const supabase = createServiceRoleClient();
    const { data } = await supabase.from("badges").select("*").order("criteria_value");
    return NextResponse.json(data || []);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireRole("super_admin");
    const body = await request.json();
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from("badges")
      .insert({
        slug: body.slug,
        name: body.name,
        description: body.description,
        icon_url: body.iconUrl,
        criteria_type: body.criteriaType,
        criteria_value: body.criteriaValue,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
