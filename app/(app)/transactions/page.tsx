"use client";

import { useEffect, useState, useMemo } from "react";
import { useApp } from "@/components/providers";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { LogMoneyForm } from "@/components/kid/log-money-form";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  status: string;
  created_at: string;
  goal_id: string | null;
  kid?: { display_name: string };
  initiator?: { display_name: string };
}

const TYPE_LABELS: Record<string, string> = {
  allowance: "Allowance", gift: "Gift", chore: "Chore",
  good_grades: "Good Grades", spending: "Spending", withdrawal: "Withdrawal",
  investment: "Investment", parent_deposit: "Deposit", parent_withdrawal: "Withdrawal",
  goal_allocation: "Saved to Goal",
};

const TYPE_ICONS: Record<string, string> = {
  allowance: "💵", gift: "🎁", chore: "🧹", good_grades: "📚",
  spending: "🛍️", withdrawal: "💸", investment: "📈",
  parent_deposit: "💰", parent_withdrawal: "💸", goal_allocation: "🐷",
};

const DEBIT_TYPES = ["spending", "withdrawal", "parent_withdrawal"];
const CREDIT_TYPES = ["allowance", "gift", "chore", "good_grades", "investment", "parent_deposit"];

type DateFilter = "all" | "week" | "month" | "year";

function getDateFilterStart(filter: DateFilter): Date | null {
  if (filter === "all") return null;
  const now = new Date();
  if (filter === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d;
  }
  if (filter === "month") {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  // year
  return new Date(now.getFullYear(), 0, 1);
}

export default function TransactionsPage() {
  const { user } = useApp();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [showLogForm, setShowLogForm] = useState(false);

  const isKid = user?.role === "kid";

  function loadTransactions() {
    const params = new URLSearchParams({ limit: "200" });
    if (statusFilter !== "all") params.set("status", statusFilter);

    fetch(`/api/transactions?${params}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setTransactions(data); })
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadTransactions(); }, [statusFilter]);

  // Filter by date range
  const filteredTransactions = useMemo(() => {
    const start = getDateFilterStart(dateFilter);
    if (!start) return transactions;
    return transactions.filter((t) => new Date(t.created_at) >= start);
  }, [transactions, dateFilter]);

  // Compute summary + running balance for kid view
  const { totalIn, totalSpent, rows } = useMemo(() => {
    let tIn = 0;
    let tOut = 0;

    // Only count approved transactions for running balance
    const approved = filteredTransactions.filter((t) => t.status === "approved");
    approved.forEach((t) => {
      if (CREDIT_TYPES.includes(t.type)) tIn += t.amount;
      else if (DEBIT_TYPES.includes(t.type)) tOut += t.amount;
      // goal_allocation is internal transfer, doesn't count as in/out
    });

    // Build rows with running balance (oldest first for balance calc, displayed newest first)
    const sorted = [...filteredTransactions].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    let runBal = 0;
    const withBal = sorted.map((t) => {
      if (t.status === "approved") {
        if (CREDIT_TYPES.includes(t.type)) runBal += t.amount;
        else if (DEBIT_TYPES.includes(t.type) || t.type === "goal_allocation") runBal -= t.amount;
      }
      return { ...t, runningBalance: t.status === "approved" ? runBal : null };
    });

    // Reverse for display (newest first)
    withBal.reverse();

    return { totalIn: tIn, totalSpent: tOut, rows: withBal };
  }, [filteredTransactions]);

  // Kid Balance Sheet View
  if (isKid) {
    return (
      <div className="space-y-5" data-mode="kid">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-fredoka)" }}>
              My Money 💰
            </h1>
            <p className="text-xs opacity-50" style={{ fontFamily: "var(--font-fredoka)" }}>
              Your earnings and spending
            </p>
          </div>
          <Button
            onClick={() => setShowLogForm(true)}
            className="rounded-xl h-10"
            style={{
              fontFamily: "var(--font-fredoka)",
              background: "linear-gradient(135deg, var(--kid-coral), var(--kid-gold))",
            }}
          >
            + Log Money
          </Button>
        </div>

        <LogMoneyForm
          open={showLogForm}
          onClose={() => setShowLogForm(false)}
          onSuccess={() => { setShowLogForm(false); loadTransactions(); }}
        />

        {/* Summary Cards */}
        {!loading && rows.length > 0 && (
          <div className="grid grid-cols-3 gap-2.5">
            <div className="card-mint p-3 text-center">
              <p className="text-[10px] font-semibold opacity-50 uppercase" style={{ fontFamily: "var(--font-fredoka)" }}>Total In</p>
              <p className="text-lg font-bold" style={{ fontFamily: "var(--font-fredoka)", color: "var(--kid-mint)" }}>
                +${totalIn.toFixed(2)}
              </p>
            </div>
            <div className="card-coral p-3 text-center">
              <p className="text-[10px] font-semibold opacity-50 uppercase" style={{ fontFamily: "var(--font-fredoka)" }}>Total Spent</p>
              <p className="text-lg font-bold" style={{ fontFamily: "var(--font-fredoka)", color: "var(--kid-coral)" }}>
                -${totalSpent.toFixed(2)}
              </p>
            </div>
            <div className="card-sky p-3 text-center">
              <p className="text-[10px] font-semibold opacity-50 uppercase" style={{ fontFamily: "var(--font-fredoka)" }}>Balance</p>
              <p className="text-lg font-bold" style={{ fontFamily: "var(--font-fredoka)", color: "var(--kid-sky)" }}>
                ${(totalIn - totalSpent).toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <div className="balance-toggle inline-flex">
            {(["all", "week", "month", "year"] as DateFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setDateFilter(f)}
                className={`px-3 py-1.5 text-xs font-semibold transition-all ${dateFilter === f ? "active" : "opacity-50"}`}
                style={{ fontFamily: "var(--font-fredoka)" }}
              >
                {f === "all" ? "All" : f === "week" ? "This Week" : f === "month" ? "This Month" : "This Year"}
              </button>
            ))}
          </div>
          <Select value={statusFilter} onValueChange={(v) => { if (v) setStatusFilter(v); }}>
            <SelectTrigger className="w-28 h-8 text-xs rounded-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Balance Sheet Table */}
        {loading ? (
          <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
        ) : rows.length === 0 ? (
          <div className="card-gold p-8 text-center">
            <span className="text-4xl mb-2 block">💰</span>
            <p className="font-semibold opacity-60" style={{ fontFamily: "var(--font-fredoka)" }}>
              No transactions yet
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-kid-gold/20 overflow-hidden">
            {/* Table header - desktop */}
            <div className="hidden sm:grid grid-cols-[1fr_2fr_auto_auto_auto] gap-2 px-4 py-2.5 balance-sheet-table" style={{ background: "oklch(0.96 0.04 85)" }}>
              <th className="text-left">Date</th>
              <th className="text-left">Description</th>
              <th className="text-right w-20">In (+)</th>
              <th className="text-right w-20">Out (-)</th>
              <th className="text-right w-24">Balance</th>
            </div>

            <div className="divide-y divide-kid-gold/10">
              {rows.map((txn) => {
                const isCredit = CREDIT_TYPES.includes(txn.type);
                const isDebit = DEBIT_TYPES.includes(txn.type);
                const isGoalAlloc = txn.type === "goal_allocation";
                const isPending = txn.status === "pending";
                const isRejected = txn.status === "rejected";

                const dateStr = new Date(txn.created_at).toLocaleDateString("en-US", {
                  month: "short", day: "numeric",
                });
                const desc = isGoalAlloc
                  ? txn.description || "Saved to goal"
                  : txn.description || TYPE_LABELS[txn.type] || txn.type;

                return (
                  <div
                    key={txn.id}
                    className={`px-4 py-3 transition-colors ${
                      isPending ? "pending-row bg-kid-gold/5" : isRejected ? "opacity-40 line-through" : "hover:bg-kid-gold/5"
                    }`}
                  >
                    {/* Mobile layout */}
                    <div className="sm:hidden flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="text-lg shrink-0">{TYPE_ICONS[txn.type] || "💵"}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ fontFamily: "var(--font-fredoka)" }}>
                            {desc}
                          </p>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] opacity-40">{dateStr}</span>
                            {isPending && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "var(--kid-gold)", color: "white" }}>
                                PENDING
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <p
                          className="text-sm font-bold"
                          style={{
                            fontFamily: "var(--font-fredoka)",
                            color: isGoalAlloc ? "var(--kid-sky)"
                              : isCredit ? "var(--kid-mint)"
                              : "var(--kid-coral)",
                          }}
                        >
                          {isCredit ? "+" : "-"}${txn.amount.toFixed(2)}
                        </p>
                        {txn.runningBalance !== null && !isPending && (
                          <p className="text-[10px] opacity-40">${txn.runningBalance.toFixed(2)}</p>
                        )}
                      </div>
                    </div>

                    {/* Desktop layout */}
                    <div className="hidden sm:grid grid-cols-[1fr_2fr_auto_auto_auto] gap-2 items-center balance-sheet-table">
                      <td className="text-xs opacity-60">{dateStr}</td>
                      <td className="flex items-center gap-2">
                        <span className="text-base">{TYPE_ICONS[txn.type] || "💵"}</span>
                        <span className="font-medium truncate" style={{ fontFamily: "var(--font-fredoka)" }}>{desc}</span>
                        {isPending && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{ background: "var(--kid-gold)", color: "white" }}>
                            PENDING
                          </span>
                        )}
                      </td>
                      <td className="text-right w-20 font-bold" style={{ fontFamily: "var(--font-fredoka)", color: isCredit ? "var(--kid-mint)" : "transparent" }}>
                        {isCredit ? `+$${txn.amount.toFixed(2)}` : ""}
                      </td>
                      <td className="text-right w-20 font-bold" style={{ fontFamily: "var(--font-fredoka)", color: (isDebit || isGoalAlloc) ? (isGoalAlloc ? "var(--kid-sky)" : "var(--kid-coral)") : "transparent" }}>
                        {(isDebit || isGoalAlloc) ? `-$${txn.amount.toFixed(2)}` : ""}
                      </td>
                      <td className="text-right w-24 font-semibold opacity-70" style={{ fontFamily: "var(--font-fredoka)" }}>
                        {txn.runningBalance !== null && !isPending ? `$${txn.runningBalance.toFixed(2)}` : "—"}
                      </td>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Parent View (unchanged layout) ───
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-sm text-muted-foreground">All family transactions</p>
        </div>
        <Select value={statusFilter} onValueChange={(v) => { if (v) setStatusFilter(v); }}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16" />)}</div>
      ) : transactions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <span className="text-4xl mb-3 block">💰</span>
            <p className="text-muted-foreground">No transactions yet.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {transactions.map((txn) => (
                <div key={txn.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{TYPE_LABELS[txn.type] || txn.type}</p>
                      <Badge variant={txn.status === "approved" ? "default" : txn.status === "rejected" ? "destructive" : "secondary"} className="text-[10px]">
                        {txn.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {txn.kid?.display_name ? `${txn.kid.display_name} • ` : ""}
                      {txn.description || new Date(txn.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <p className={`text-sm font-bold ${DEBIT_TYPES.includes(txn.type) || txn.type === "goal_allocation" ? "text-destructive" : "text-success"}`}>
                    {DEBIT_TYPES.includes(txn.type) || txn.type === "goal_allocation" ? "-" : "+"}${txn.amount.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
