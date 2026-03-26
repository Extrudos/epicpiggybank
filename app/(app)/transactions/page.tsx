"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/components/providers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  kid?: { display_name: string };
  initiator?: { display_name: string };
}

const TYPE_LABELS: Record<string, string> = {
  allowance: "Allowance", gift: "Gift", chore: "Chore",
  good_grades: "Good Grades", spending: "Spending", withdrawal: "Withdrawal",
  investment: "Investment", parent_deposit: "Deposit", parent_withdrawal: "Withdrawal",
};

const DEBIT_TYPES = ["spending", "withdrawal", "parent_withdrawal"];

export default function TransactionsPage() {
  const { user } = useApp();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showLogForm, setShowLogForm] = useState(false);

  function loadTransactions() {
    const params = new URLSearchParams({ limit: "100" });
    if (filter !== "all") params.set("status", filter);

    fetch(`/api/transactions?${params}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setTransactions(data); })
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadTransactions(); }, [filter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {user?.role === "kid" ? "My Money" : "Transactions"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {user?.role === "kid" ? "Your earnings and spending" : "All family transactions"}
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={filter} onValueChange={(v) => { if (v) setFilter(v); }}>
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
          {user?.role === "kid" && (
            <Button onClick={() => setShowLogForm(true)}>+ Log Money</Button>
          )}
        </div>
      </div>

      {user?.role === "kid" && (
        <LogMoneyForm
          open={showLogForm}
          onClose={() => setShowLogForm(false)}
          onSuccess={() => { setShowLogForm(false); loadTransactions(); }}
        />
      )}

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
                  <p className={`text-sm font-bold ${DEBIT_TYPES.includes(txn.type) ? "text-destructive" : "text-success"}`}>
                    {DEBIT_TYPES.includes(txn.type) ? "-" : "+"}${txn.amount.toFixed(2)}
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
