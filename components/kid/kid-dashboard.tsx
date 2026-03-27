"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/components/providers";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface KidData {
  balance: number;
  spendable_balance: number;
  goal_savings: number;
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
  goal_id: string | null;
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
  goal_allocation: "🐷",
};

const XP_PER_LEVEL = 100;

export function KidDashboard() {
  const { user } = useApp();
  const [kidData, setKidData] = useState<KidData | null>(null);
  const [goals, setGoals] = useState<SavingsGoalData[]>([]);
  const [recent, setRecent] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTotalBalance, setShowTotalBalance] = useState(false);

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
        <Skeleton className="h-56 rounded-3xl" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  const xpProgress = kidData ? ((kidData.xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100 : 0;
  const displayBalance = showTotalBalance
    ? (kidData?.balance ?? 0)
    : (kidData?.spendable_balance ?? kidData?.balance ?? 0);
  const goalSavings = kidData?.goal_savings ?? 0;

  return (
    <div className="space-y-5" data-mode="kid">
      {/* ─── Hero Balance Card ─── */}
      <div className="balance-hero p-6 pb-5">
        <div className="text-center">
          {/* Greeting */}
          <p
            className="text-sm font-semibold mb-1 opacity-70"
            style={{ fontFamily: "var(--font-fredoka)" }}
          >
            Hey {kidData?.display_name?.split(" ")[0] ?? "there"}! 👋
          </p>

          {/* Balance Toggle */}
          <div className="flex justify-center mb-3">
            <div className="balance-toggle inline-flex">
              <button
                onClick={() => setShowTotalBalance(false)}
                className={`px-3 py-1 text-xs font-semibold transition-all ${!showTotalBalance ? "active" : "opacity-60"}`}
                style={{ fontFamily: "var(--font-fredoka)" }}
              >
                Spendable
              </button>
              <button
                onClick={() => setShowTotalBalance(true)}
                className={`px-3 py-1 text-xs font-semibold transition-all ${showTotalBalance ? "active" : "opacity-60"}`}
                style={{ fontFamily: "var(--font-fredoka)" }}
              >
                Total
              </button>
            </div>
          </div>

          {/* Big Balance Number */}
          <p
            className="text-7xl sm:text-8xl font-bold tracking-tight balance-amount animate-bounce-in leading-none"
            style={{ fontFamily: "var(--font-fredoka)" }}
          >
            ${displayBalance.toFixed(2)}
          </p>

          {/* Savings indicator */}
          {goalSavings > 0 && !showTotalBalance && (
            <p className="text-xs mt-2 opacity-60" style={{ fontFamily: "var(--font-fredoka)" }}>
              + ${goalSavings.toFixed(2)} saved in goals 🐷
            </p>
          )}

          {/* Level + Streak Row */}
          <div className="flex items-center justify-center gap-5 mt-5">
            <div className="text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-1"
                style={{
                  fontFamily: "var(--font-fredoka)",
                  background: "linear-gradient(135deg, var(--kid-purple), oklch(0.7 0.2 310))",
                  color: "white",
                  boxShadow: "0 4px 12px oklch(0.65 0.2 300 / 0.3)",
                }}
              >
                {kidData?.level ?? 1}
              </div>
              <p className="text-[11px] font-semibold opacity-60" style={{ fontFamily: "var(--font-fredoka)" }}>Level</p>
            </div>

            {(kidData?.streak_days ?? 0) > 0 && (
              <div className="text-center">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-1 animate-streak-flame"
                  style={{
                    background: "linear-gradient(135deg, var(--kid-coral), oklch(0.75 0.16 40))",
                    boxShadow: "0 4px 12px oklch(0.7 0.18 25 / 0.3)",
                  }}
                >
                  🔥
                </div>
                <p className="text-[11px] font-semibold opacity-60" style={{ fontFamily: "var(--font-fredoka)" }}>{kidData?.streak_days}d streak</p>
              </div>
            )}

            {/* XP mini bar */}
            <div className="flex-1 max-w-[140px]">
              <div className="flex items-center justify-between text-[10px] font-semibold opacity-50 mb-1"
                style={{ fontFamily: "var(--font-fredoka)" }}>
                <span>XP</span>
                <span>{kidData?.xp ?? 0} / {(kidData?.level ?? 1) * XP_PER_LEVEL}</span>
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ background: "oklch(0.9 0.04 85)" }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${xpProgress}%`,
                    background: "linear-gradient(90deg, var(--kid-gold), var(--kid-coral))",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Quick Actions ─── */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/transactions">
          <button
            className="card-coral w-full p-4 text-center transition-all hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]"
            style={{ fontFamily: "var(--font-fredoka)" }}
          >
            <span className="text-3xl block mb-1">💰</span>
            <span className="text-sm font-semibold">Log Money</span>
          </button>
        </Link>
        <Link href="/goals">
          <button
            className="card-sky w-full p-4 text-center transition-all hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]"
            style={{ fontFamily: "var(--font-fredoka)" }}
          >
            <span className="text-3xl block mb-1">🎯</span>
            <span className="text-sm font-semibold">My Goals</span>
          </button>
        </Link>
      </div>

      {/* ─── Savings Goals ─── */}
      {goals.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-fredoka)" }}>
              Savings Goals 🎯
            </h2>
            <Link href="/goals" className="text-xs font-semibold text-kid-sky" style={{ fontFamily: "var(--font-fredoka)" }}>
              See all →
            </Link>
          </div>
          <div className="space-y-3">
            {goals.slice(0, 3).map((goal) => {
              const pct = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
              const remaining = goal.target_amount - goal.current_amount;
              return (
                <div key={goal.id} className="card-gold p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{goal.icon || "🎯"}</span>
                      <div>
                        <p className="font-bold text-sm" style={{ fontFamily: "var(--font-fredoka)" }}>{goal.name}</p>
                        <p className="text-[11px] opacity-60">${remaining.toFixed(0)} to go</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold" style={{ fontFamily: "var(--font-fredoka)", color: "var(--kid-sky)" }}>
                        ${goal.current_amount.toFixed(0)}
                      </p>
                      <p className="text-[10px] opacity-50">of ${goal.target_amount.toFixed(0)}</p>
                    </div>
                  </div>
                  <div className="goal-progress-bar h-4">
                    <div
                      className="goal-progress-fill h-full flex items-center justify-end pr-1.5"
                      style={{ width: `${Math.max(pct, 3)}%` }}
                    >
                      {pct >= 15 && (
                        <span className="text-[9px] font-bold text-white">{pct.toFixed(0)}%</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Recent Activity ─── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-fredoka)" }}>
            Recent Activity
          </h2>
          <Link href="/transactions" className="text-xs font-semibold text-kid-coral" style={{ fontFamily: "var(--font-fredoka)" }}>
            See all →
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="card-mint p-6 text-center">
            <span className="text-4xl mb-2 block">🪙</span>
            <p className="text-sm font-semibold opacity-60" style={{ fontFamily: "var(--font-fredoka)" }}>
              No transactions yet. Start logging!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map((txn) => {
              const isDebit = ["spending", "withdrawal", "parent_withdrawal"].includes(txn.type);
              const isGoalAlloc = txn.type === "goal_allocation";
              return (
                <div
                  key={txn.id}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all ${
                    isGoalAlloc
                      ? "border-kid-sky/30 bg-kid-sky/5"
                      : isDebit
                        ? "border-kid-coral/20 bg-kid-coral/5"
                        : "border-kid-mint/30 bg-kid-mint/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{TYPE_ICONS[txn.type] || "💵"}</span>
                    <div>
                      <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-fredoka)" }}>
                        {txn.type === "goal_allocation"
                          ? txn.description || "Saved to goal"
                          : txn.type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                      </p>
                      <p className="text-[11px] opacity-50">
                        {txn.description && txn.type !== "goal_allocation"
                          ? txn.description
                          : new Date(txn.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className="text-sm font-bold"
                      style={{
                        fontFamily: "var(--font-fredoka)",
                        color: isGoalAlloc
                          ? "var(--kid-sky)"
                          : isDebit
                            ? "var(--kid-coral)"
                            : "var(--kid-mint)",
                      }}
                    >
                      {isDebit || isGoalAlloc ? "-" : "+"}${txn.amount.toFixed(2)}
                    </p>
                    {txn.status === "pending" && (
                      <span
                        className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                        style={{
                          background: "var(--kid-gold)",
                          color: "white",
                          fontFamily: "var(--font-fredoka)",
                        }}
                      >
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
