"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface TenantInfo {
  name: string;
  family_code: string;
  plan: string;
}

export default function SettingsPage() {
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tenant")
      .then((r) => r.json())
      .then((data) => {
        if (data.family_code) setTenant(data);
      })
      .finally(() => setLoading(false));
  }, []);

  function copyCode() {
    if (tenant?.family_code) {
      navigator.clipboard.writeText(tenant.family_code);
      toast.success("Family code copied!");
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Family Code */}
      <Card>
        <CardHeader><CardTitle>Kid Login Code</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Share this code with your kids so they can log in on their own device at{" "}
            <span className="font-medium text-foreground">/kid-login</span>.
          </p>
          {loading ? (
            <Skeleton className="h-14 w-40" />
          ) : (
            <div className="flex items-center gap-3">
              <div className="bg-muted rounded-xl px-5 py-3 text-2xl font-bold tracking-[0.2em] font-mono">
                {tenant?.family_code || "------"}
              </div>
              <Button variant="outline" size="sm" onClick={copyCode}>
                Copy
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Billing & Subscription</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Manage your subscription, upgrade to Premium, or update payment details.
          </p>
          <Link href="/settings/billing">
            <Button variant="outline">Manage Billing</Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Family Members</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Manage kids and invite a second parent.
          </p>
          <Link href="/kids">
            <Button variant="outline">Manage Kids</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
