"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/components/providers";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface KidData {
  balance: number;
  level: number;
  xp: number;
  streak_days: number;
  display_name: string;
}

interface SavingsGoalData {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  icon: string | null;
  is_completed: boolean;
}

interface RecentTransaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  status: string;
  created_at: string;
}

const TYPE_ICONS: Record<string, string> = {
  allowance: "💵",
  gift: "🎁",
  chore: "🧹",
  good_grades: "📚",
  spending: "🛍️",
  withdrawal: "💸",
  investment: "📈",
  parent_deposit: "💰",
  parent_withdrawal: "💸",
};

const XP_PER_LEVEL = 100;

export function KidDashboard() {
  const { user } = useApp();
  const [kidData, setKidData] = useState<KidData | null>(null);
  const [goals, setGoals] = useState<SavingsGoalData[]>([]);
  const [recent, setRecent] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    Promise.all([
      fetch(`/api/kids/${user.id}`).then((r) => r.json()),
      fetch(`/api/goals?kidId=${user.id}`).then((r) => r.json()),
      fetch(`/api/transactions?limit=5`).then((r) => r.json()),
    ])
      .then(([kid, goalsData, txns]) => {
        setKidData(kid);
        if (Array.isArray(goalsData)) setGoals(goalsData.filter((g: SavingsGoalData) => !g.is_completed));
        if (Array.isArray(txns)) setRecent(txns);
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  const xpProgress = kidData ? ((kidData.xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100 : 0;

  return (
    <div className="space-y-6" data-mode="kid">
      {/* Big Balance */}
      <Card className="card-playful overflow-hidden bg-gradient-to-br from-white to-kid-gold/5">
        <CardContent className="pt-8 pb-6 text-center">
          <p className="text-sm font-medium text-muted-foreground mb-2" style={{ fontFamily: "var(--font-fredoka)" }}>
            My Piggy Bank
          </p>
          <p
            className="text-6xl sm:text-7xl font-bold tracking-tight balance-amount animate-bounce-in"
            style={{ fontFamily: "var(--font-fredoka)" }}
          >
            ${kidData?.balance.toFixed(2) ?? "0.00"}
          </p>

          {/* Level + Streak */}
          <div className="flex items-center justify-center gap-6 mt-6">
            <div className="text-center">
              <div
                className="w-14 h-14 rounded-full bg-kid-purple/20 flex items-center justify-center text-xl font-bold mx-auto mb-1"
                style={{ fontFamily: "var(--font-fredoka)", color: "var(--kid-purple)" }}
              >
                {kidData?.level ?? 1}
              </div>
              <p className="text-xs text-muted-foreground">Level</p>
            </div>
            {(kidData?.streak_days ?? 0) > 0 && (
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-kid-coral/20 flex items-center justify-center text-2xl mx-auto mb-1 animate-streak-flame">
                  🔥
                </div>
                <p className="text-xs text-muted-foreground">{kidData?.streak_days}d streak</p>
              </div>
            )}
          </div>

          {/* XP Bar */}
          <div className="max-w-xs mx-auto mt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>XP</span>
              <span>{kidData?.xp ?? 0} / {(kidData?.level ?? 1) * XP_PER_LEVEL}</span>
            </div>
            <Progress value={xpProgress} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Quick Log */}
      <div className="flex gap-3">
        <Link href="/transactions" className="flex-1">
          <Button variant="outline" className="w-full card-playful h-auto py-3" style={{ fontFamily: "var(--font-fredoka)" }}>
            <span className="text-xl mr-2">💰</span> Log Money
          </Button>
        </Link>
        <Link href="/goals" className="flex-1">
          <Button variant="outline" className="w-full card-playful h-auto py-3" style={{ fontFamily: "var(--font-fredoka)" }}>
            <span className="text-xl mr-2">🎯</span> My Goals
          </Button>
        </Link>
      </div>

      {/* Savings Goals */}
      {goals.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3" style={{ fontFamily: "var(--font-fredoka)" }}>
            Savings Goals
          </h2>
          <div className="space-y-3">
            {goals.slice(0, 3).map((goal) => {
              const pct = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
              return (
                <Card key={goal.id} className="card-playful">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{goal.icon || "🎯"}</span>
                        <span className="font-semibold text-sm">{goal.name}</span>
                      </div>
                      <span className="text-sm font-medium">
                        ${goal.current_amount.toFixed(0)} / ${goal.target_amount.toFixed(0)}
                      </span>
                    </div>
                    <Progress value={pct} className="h-3" />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-bold mb-3" style={{ fontFamily: "var(--font-fredoka)" }}>
          Recent Activity
        </h2>
        {recent.length === 0 ? (
          <Card className="card-playful">
            <CardContent className="py-8 text-center">
              <span className="text-3xl mb-2 block">🪙</span>
              <p className="text-sm text-muted-foreground">No transactions yet. Start logging!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recent.map((txn) => (
              <Card key={txn.id} className="card-playful">
                <CardContent className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{TYPE_ICONS[txn.type] || "💵"}</span>
                    <div>
                      <p className="text-sm font-medium capitalize">
                        {txn.type.replace("_", " ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {txn.description || new Date(txn.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${
                      ["spending", "withdrawal", "parent_withdrawal"].includes(txn.type)
                        ? "text-destructive"
                        : "text-success"
                    }`}>
                      {["spending", "withdrawal", "parent_withdrawal"].includes(txn.type) ? "-" : "+"}
                      ${txn.amount.toFixed(2)}
                    </p>
                    {txn.status === "pending" && (
                      <span className="text-[10px] text-warning font-medium">Pending</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
