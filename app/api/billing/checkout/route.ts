import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServiceRoleClient } from "@/lib/supabase";
import { requireRole } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await requireRole("parent");
    const { priceId, couponId } = await request.json();
    const supabase = createServiceRoleClient();

    // Get or create Stripe customer
    const { data: tenant } = await supabase
      .from("tenants")
      .select("id, stripe_customer_id, name")
      .eq("id", user.tenantId)
      .single();

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    let customerId = tenant.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { tenant_id: tenant.id },
        name: tenant.name,
      });
      customerId = customer.id;

      await supabase
        .from("tenants")
        .update({ stripe_customer_id: customerId })
        .eq("id", tenant.id);
    }

    const sessionParams: Record<string, unknown> = {
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${request.headers.get("origin")}/settings/billing?success=true`,
      cancel_url: `${request.headers.get("origin")}/settings/billing?canceled=true`,
      metadata: { tenant_id: tenant.id },
    };

    if (couponId) {
      sessionParams.discounts = [{ coupon: couponId }];
    }

    const session = await stripe.checkout.sessions.create(
      sessionParams as Parameters<typeof stripe.checkout.sessions.create>[0]
    );

    return NextResponse.json({ url: session.url });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
