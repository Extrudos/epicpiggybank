"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface PendingTransaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  created_at: string;
  kid: { display_name: string; avatar_url: string | null };
}

const TYPE_LABELS: Record<string, string> = {
  allowance: "Allowance",
  gift: "Gift",
  chore: "Chore",
  good_grades: "Good Grades",
  spending: "Spending",
  withdrawal: "Withdrawal",
  investment: "Investment",
  parent_deposit: "Deposit",
  parent_withdrawal: "Withdrawal",
  goal_allocation: "Goal Savings",
};

export function ApprovalQueue() {
  const [pending, setPending] = useState<PendingTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/transactions?status=pending")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setPending(data);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleAction(id: string, status: "approved" | "rejected") {
    const res = await fetch(`/api/transactions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (res.ok) {
      setPending((prev) => prev.filter((t) => t.id !== id));
      toast.success(`Transaction ${status}`);
    } else {
      toast.error("Failed to update transaction");
    }
  }

  if (loading) return null;
  if (pending.length === 0) return null;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">
        Pending Approvals
        <Badge variant="secondary" className="ml-2">{pending.length}</Badge>
      </h2>

      <div className="space-y-3">
        {pending.map((txn) => (
          <Card key={txn.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-kid-sky/20 flex items-center justify-center text-sm font-semibold">
                  {txn.kid?.display_name?.charAt(0) || "?"}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {txn.kid?.display_name} — {TYPE_LABELS[txn.type] || txn.type}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {txn.description || "No description"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold">${txn.amount.toFixed(2)}</span>
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={() => handleAction(txn.id, "rejected")}
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleAction(txn.id, "approved")}
                  >
                    Approve
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
