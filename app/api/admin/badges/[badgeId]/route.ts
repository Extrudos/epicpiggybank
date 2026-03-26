import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";
import { requireRole } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ badgeId: string }> }
) {
  try {
    await requireRole("super_admin");
    const { badgeId } = await params;
    const body = await request.json();
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from("badges")
      .update(body)
      .eq("id", badgeId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ badgeId: string }> }
) {
  try {
    await requireRole("super_admin");
    const { badgeId } = await params;
    const supabase = createServiceRoleClient();

    const { error } = await supabase.from("badges").delete().eq("id", badgeId);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
