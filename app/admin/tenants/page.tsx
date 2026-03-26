"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Tenant {
  id: string;
  name: string;
  plan: string;
  plan_status: string;
  max_kids: number;
  created_at: string;
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/tenants")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setTenants(data); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tenant Management</h1>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20" />)}</div>
      ) : (
        <div className="space-y-3">
          {tenants.map(tenant => (
            <Link key={tenant.id} href={`/admin/tenants/${tenant.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-semibold">{tenant.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(tenant.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={tenant.plan === "premium" ? "default" : "secondary"}>
                      {tenant.plan}
                    </Badge>
                    <Badge variant={tenant.plan_status === "active" ? "default" : "destructive"}>
                      {tenant.plan_status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
