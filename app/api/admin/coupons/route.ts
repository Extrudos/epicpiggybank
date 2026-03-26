import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";
import { requireRole } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

export async function GET() {
  try {
    await requireRole("super_admin");
    const supabase = createServiceRoleClient();

    const { data } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    return NextResponse.json(data || []);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireRole("super_admin");
    const { code, type, value, maxUses, expiresAt } = await request.json();

    // Create Stripe coupon
    const couponParams: Record<string, unknown> = {
      id: code.toLowerCase(),
    };

    if (type === "percent") {
      couponParams.percent_off = value;
    } else {
      couponParams.amount_off = Math.round(value * 100);
      couponParams.currency = "usd";
    }

    if (maxUses) couponParams.max_redemptions = maxUses;
    if (expiresAt) couponParams.redeem_by = Math.floor(new Date(expiresAt).getTime() / 1000);

    const stripeCoupon = await stripe.coupons.create(
      couponParams as Parameters<typeof stripe.coupons.create>[0]
    );

    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from("coupons")
      .insert({
        stripe_coupon_id: stripeCoupon.id,
        code: code.toUpperCase(),
        type,
        value,
        max_uses: maxUses || null,
        expires_at: expiresAt || null,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
