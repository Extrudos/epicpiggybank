import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServiceRoleClient } from "@/lib/supabase";
import { writeAuditLog } from "@/lib/audit";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const tenantId = session.metadata?.tenant_id;

      if (tenantId && session.subscription) {
        await supabase
          .from("tenants")
          .update({
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            plan: "premium",
            plan_status: "active",
            max_kids: 999,
          })
          .eq("id", tenantId);

        await writeAuditLog({
          tenant_id: tenantId,
          user_id: "system",
          action: "UPGRADE",
          table_name: "tenants",
          record_id: tenantId,
          new_value: { plan: "premium" },
        });
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const { data: tenant } = await supabase
        .from("tenants")
        .select("id")
        .eq("stripe_subscription_id", subscription.id)
        .single();

      if (tenant) {
        const status = subscription.status === "active" ? "active" : "past_due";
        await supabase
          .from("tenants")
          .update({ plan_status: status })
          .eq("id", tenant.id);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const { data: tenant } = await supabase
        .from("tenants")
        .select("id")
        .eq("stripe_subscription_id", subscription.id)
        .single();

      if (tenant) {
        await supabase
          .from("tenants")
          .update({
            plan: "free",
            plan_status: "canceled",
            max_kids: 2,
            stripe_subscription_id: null,
          })
          .eq("id", tenant.id);

        await writeAuditLog({
          tenant_id: tenant.id,
          user_id: "system",
          action: "DOWNGRADE",
          table_name: "tenants",
          record_id: tenant.id,
          new_value: { plan: "free" },
        });
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const invoiceSub = (invoice as unknown as Record<string, unknown>).subscription as string | null;
      if (invoiceSub) {
        const { data: tenant } = await supabase
          .from("tenants")
          .select("id")
          .eq("stripe_subscription_id", invoiceSub)
          .single();

        if (tenant) {
          await supabase
            .from("tenants")
            .update({ plan_status: "past_due" })
            .eq("id", tenant.id);
        }
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
