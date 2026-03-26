import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";
import { requireRole } from "@/lib/auth";

export async function GET() {
  try {
    const supabase = createServiceRoleClient();
    const { data } = await supabase.from("collectibles").select("*").order("rarity");
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
      .from("collectibles")
      .insert({
        slug: body.slug,
        name: body.name,
        description: body.description,
        image_url: body.imageUrl,
        rarity: body.rarity,
        unlock_condition: body.unlockCondition || {},
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
