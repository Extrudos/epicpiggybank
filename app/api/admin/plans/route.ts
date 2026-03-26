import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";
import { requireRole } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

export async function GET() {
  try {
    await requireRole("super_admin");
    const supabase = createServiceRoleClient();

    const { data } = await supabase
      .from("pricing_plans")
      .select("*")
      .order("sort_order");

    return NextResponse.json(data || []);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireRole("super_admin");
    const { name, slug, priceCents, interval, maxKids, features } = await request.json();

    // Create Stripe product + price
    const product = await stripe.products.create({ name: `EpicPiggyBank - ${name}` });
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: priceCents,
      currency: "usd",
      recurring: { interval },
    });

    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from("pricing_plans")
      .insert({
        stripe_price_id: price.id,
        name,
        slug,
        price_cents: priceCents,
        interval,
        max_kids: maxKids,
        features: features || [],
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
