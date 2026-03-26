import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";
import { requireRole } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ kidId: string }> }
) {
  try {
    const user = await requireRole("parent", "kid");
    const { kidId } = await params;

    // Kids can only see their own balance
    if (user.role === "kid" && user.id !== kidId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from("kid_balances")
      .select("balance")
      .eq("kid_id", kidId)
      .eq("tenant_id", user.tenantId)
      .single();

    if (error) {
      // No transactions yet = $0 balance
      return NextResponse.json({ balance: 0 });
    }

    return NextResponse.json({ balance: Number(data.balance) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
