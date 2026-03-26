"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Stats {
  totalTenants: number;
  totalUsers: number;
  totalKids: number;
  premiumTenants: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(r => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: "Total Families", value: stats?.totalTenants, icon: "👨‍👩‍👧‍👦" },
    { label: "Total Users", value: stats?.totalUsers, icon: "👤" },
    { label: "Total Kids", value: stats?.totalKids, icon: "👧" },
    { label: "Premium Families", value: stats?.premiumTenants, icon: "💎" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
              <span className="text-xl">{card.icon}</span>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-3xl font-bold">{card.value ?? 0}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
