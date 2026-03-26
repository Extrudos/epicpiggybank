"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";

interface KidDetail {
  id: string;
  display_name: string;
  avatar_url: string | null;
  email: string | null;
  level: number;
  xp: number;
  streak_days: number;
  balance: number;
  created_at: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  status: string;
  created_at: string;
}

const TYPE_LABELS: Record<string, string> = {
  allowance: "Allowance", gift: "Gift", chore: "Chore",
  good_grades: "Good Grades", spending: "Spending", withdrawal: "Withdrawal",
  investment: "Investment", parent_deposit: "Deposit", parent_withdrawal: "Withdrawal",
};

export default function KidDetailPage() {
  const params = useParams();
  const router = useRouter();
  const kidId = params.kidId as string;
  const [kid, setKid] = useState<KidDetail | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/kids/${kidId}`).then(r => r.json()),
      fetch(`/api/transactions?kidId=${kidId}&limit=20`).then(r => r.json()),
    ]).then(([kidData, txns]) => {
      setKid(kidData);
      if (Array.isArray(txns)) setTransactions(txns);
    }).finally(() => setLoading(false));
  }, [kidId]);

  async function handleDeactivate() {
    if (!confirm("Are you sure you want to remove this kid?")) return;
    const res = await fetch(`/api/kids/${kidId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Kid removed");
      router.push("/kids");
    }
  }

  if (loading) {
    return <div className="space-y-6"><Skeleton className="h-48" /><Skeleton className="h-64" /></div>;
  }

  if (!kid) {
    return <p className="text-muted-foreground">Kid not found.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>← Back</Button>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-kid-coral/20 flex items-center justify-center text-4xl shrink-0">
              {kid.avatar_url || kid.display_name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{kid.display_name}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                <span>Level {kid.level}</span>
                <span>{kid.xp} XP</span>
                {kid.streak_days > 0 && <span>🔥 {kid.streak_days}d streak</span>}
              </div>
              {kid.email && <p className="text-sm text-muted-foreground mt-1">{kid.email}</p>}
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Balance</p>
              <p className="text-3xl font-bold">${kid.balance.toFixed(2)}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Link href={`/kids/${kidId}/edit`}>
              <Button variant="outline" size="sm">Edit Profile</Button>
            </Link>
            <Button variant="outline" size="sm" className="text-destructive" onClick={handleDeactivate}>
              Remove
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No transactions yet.</p>
          ) : (
            <div className="space-y-2">
              {transactions.map((txn) => (
                <div key={txn.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{TYPE_LABELS[txn.type] || txn.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(txn.created_at).toLocaleDateString()} — {txn.description || ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${
                      ["spending","withdrawal","parent_withdrawal"].includes(txn.type) ? "text-destructive" : "text-success"
                    }`}>
                      {["spending","withdrawal","parent_withdrawal"].includes(txn.type) ? "-" : "+"}${txn.amount.toFixed(2)}
                    </p>
                    <Badge variant={txn.status === "approved" ? "default" : txn.status === "rejected" ? "destructive" : "secondary"} className="text-[10px]">
                      {txn.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
