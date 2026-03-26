"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface PlanInfo {
  plan: string;
  plan_status: string;
}

export default function BillingPage() {
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponValid, setCouponValid] = useState<{ valid: boolean; stripeCouponId?: string; type?: string; value?: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // We'll get the tenant info from a lightweight endpoint
    fetch("/api/kids").then(r => {
      // This is a proxy way to know the user is authenticated
      // In a real app, we'd have a /api/tenant endpoint
      setPlanInfo({ plan: "free", plan_status: "active" });
    });
  }, []);

  async function handleUpgrade() {
    setLoading(true);

    // Get available plans
    const plansRes = await fetch("/api/billing/plans");
    const plans = await plansRes.json();

    const premiumPlan = Array.isArray(plans) ? plans.find((p: { slug: string }) => p.slug === "premium") : null;

    if (!premiumPlan) {
      toast.error("Premium plan not configured yet. Contact support.");
      setLoading(false);
      return;
    }

    const body: Record<string, string> = { priceId: premiumPlan.stripe_price_id };
    if (couponValid?.valid && couponValid.stripeCouponId) {
      body.couponId = couponValid.stripeCouponId;
    }

    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      toast.error(data.error || "Failed to start checkout");
    }
    setLoading(false);
  }

  async function handleManage() {
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      toast.error("Failed to open billing portal");
    }
  }

  async function validateCoupon() {
    const res = await fetch("/api/billing/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: couponCode }),
    });
    const data = await res.json();
    setCouponValid(data);
    if (data.valid) {
      toast.success(`Coupon valid! ${data.type === "percent" ? `${data.value}% off` : `$${data.value} off`}`);
    } else {
      toast.error(data.error || "Invalid coupon");
    }
  }

  const isPremium = planInfo?.plan === "premium";

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-sm text-muted-foreground">Manage your subscription</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Current Plan</CardTitle>
            <Badge variant={isPremium ? "default" : "secondary"}>
              {isPremium ? "Premium" : "Free"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isPremium ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You&apos;re on the Premium plan with unlimited kids, investments, and notifications.
              </p>
              <Button variant="outline" onClick={handleManage}>
                Manage Subscription
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You&apos;re on the Free plan (up to 2 kids). Upgrade for unlimited kids, investments, and more.
              </p>

              <div className="flex gap-2">
                <Input
                  placeholder="Coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="max-w-[180px]"
                />
                <Button variant="outline" onClick={validateCoupon} disabled={!couponCode}>
                  Apply
                </Button>
              </div>

              <Button onClick={handleUpgrade} disabled={loading}>
                {loading ? "Redirecting..." : "Upgrade to Premium — $5/mo"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
