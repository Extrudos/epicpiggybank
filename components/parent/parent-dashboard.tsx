"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApprovalQueue } from "./approval-queue";
import { QuickActions } from "./quick-actions";

interface KidSummary {
  id: string;
  display_name: string;
  avatar_url: string | null;
  balance: number;
  spendable_balance: number;
  goal_savings: number;
  level: number;
  streak_days: number;
  is_active: boolean;
}

export function ParentDashboard() {
  const [kids, setKids] = useState<KidSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/kids")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setKids(data.filter((k: KidSummary) => k.is_active));
      })
      .finally(() => setLoading(false));
  }, []);

  const totalBalance = kids.reduce((sum, k) => sum + k.balance, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Family Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Overview of your family&apos;s finances
          </p>
        </div>
        <QuickActions kids={kids} onRefresh={() => window.location.reload()} />
      </div>

      {/* Family Total */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-6">
          <p className="text-sm font-medium text-muted-foreground mb-1">Family Total</p>
          <p className="text-4xl font-bold tracking-tight">
            ${totalBalance.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Across {kids.length} kid{kids.length !== 1 ? "s" : ""}
          </p>
        </CardContent>
      </Card>

      {/* Kid Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Kids</h2>
          <Link href="/kids">
            <Button variant="ghost" size="sm">View All</Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-36 rounded-xl" />
            ))}
          </div>
        ) : kids.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-10">
              <span className="text-4xl mb-3">👧</span>
              <p className="text-sm text-muted-foreground mb-3">No kids yet</p>
              <Link href="/kids">
                <Button size="sm">Add Your First Kid</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {kids.map((kid) => (
              <Link key={kid.id} href={`/kids/${kid.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-kid-coral/20 flex items-center justify-center text-xl shrink-0">
                        {kid.avatar_url || kid.display_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{kid.display_name}</p>
                        <p className="text-2xl font-bold tracking-tight">
                          ${kid.spendable_balance.toFixed(2)}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>Lvl {kid.level}</span>
                          {kid.streak_days > 0 && (
                            <span>🔥 {kid.streak_days}d streak</span>
                          )}
                          {kid.goal_savings > 0 && (
                            <span>🐷 ${kid.goal_savings.toFixed(0)} saved</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Approval Queue */}
      <ApprovalQueue />
    </div>
  );
}
