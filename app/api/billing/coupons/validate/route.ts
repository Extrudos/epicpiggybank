import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: "Code required" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    const { data: coupon } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", code.toUpperCase())
      .eq("is_active", true)
      .single();

    if (!coupon) {
      return NextResponse.json({ valid: false, error: "Invalid coupon code" });
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, error: "Coupon has expired" });
    }

    if (coupon.max_uses && coupon.times_used >= coupon.max_uses) {
      return NextResponse.json({ valid: false, error: "Coupon usage limit reached" });
    }

    return NextResponse.json({
      valid: true,
      type: coupon.type,
      value: coupon.value,
      stripeCouponId: coupon.stripe_coupon_id,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
