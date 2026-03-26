"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface TenantDetail {
  tenant: {
    id: string;
    name: string;
    plan: string;
    plan_status: string;
    max_kids: number;
    stripe_customer_id: string | null;
    created_at: string;
  };
  profiles: Array<{
    id: string;
    display_name: string;
    role: string;
    email: string | null;
    is_active: boolean;
    level: number;
  }>;
}

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.tenantId as string;
  const [data, setData] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/tenants/${tenantId}`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [tenantId]);

  if (loading) return <div className="space-y-4"><Skeleton className="h-48" /><Skeleton className="h-64" /></div>;
  if (!data?.tenant) return <p>Tenant not found.</p>;

  const { tenant, profiles } = data;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>← Back</Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{tenant.name}</CardTitle>
            <div className="flex gap-2">
              <Badge variant={tenant.plan === "premium" ? "default" : "secondary"}>{tenant.plan}</Badge>
              <Badge variant={tenant.plan_status === "active" ? "default" : "destructive"}>{tenant.plan_status}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><span className="text-muted-foreground">ID:</span> {tenant.id}</p>
          <p><span className="text-muted-foreground">Max Kids:</span> {tenant.max_kids}</p>
          <p><span className="text-muted-foreground">Stripe ID:</span> {tenant.stripe_customer_id || "None"}</p>
          <p><span className="text-muted-foreground">Created:</span> {new Date(tenant.created_at).toLocaleString()}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Members ({profiles.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {profiles.map(p => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div>
                  <p className="font-medium">{p.display_name}</p>
                  <p className="text-xs text-muted-foreground">{p.email || "No email"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{p.role}</Badge>
                  {p.role === "kid" && <span className="text-xs text-muted-foreground">Lvl {p.level}</span>}
                  {!p.is_active && <Badge variant="destructive">Inactive</Badge>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
