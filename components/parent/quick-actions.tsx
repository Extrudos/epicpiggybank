"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { TransactionType } from "@/types/database";

interface KidOption {
  id: string;
  display_name: string;
}

const TRANSACTION_TYPES: { value: TransactionType; label: string }[] = [
  { value: "parent_deposit", label: "Deposit" },
  { value: "parent_withdrawal", label: "Withdrawal" },
  { value: "allowance", label: "Allowance" },
  { value: "gift", label: "Gift" },
  { value: "chore", label: "Chore Reward" },
  { value: "good_grades", label: "Good Grades Bonus" },
];

export function QuickActions({
  kids,
  onRefresh,
}: {
  kids: KidOption[];
  onRefresh: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const body = {
      kidId: form.get("kidId"),
      type: form.get("type"),
      amount: parseFloat(form.get("amount") as string),
      description: form.get("description") || undefined,
    };

    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      toast.success("Transaction created");
      setOpen(false);
      onRefresh();
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to create transaction");
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button>+ Add Transaction</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Kid</Label>
            <Select name="kidId" required>
              <SelectTrigger>
                <SelectValue placeholder="Select a kid" />
              </SelectTrigger>
              <SelectContent>
                {kids.map((kid) => (
                  <SelectItem key={kid.id} value={kid.id}>
                    {kid.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select name="type" required>
              <SelectTrigger>
                <SelectValue placeholder="Transaction type" />
              </SelectTrigger>
              <SelectContent>
                {TRANSACTION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ($)</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="5.00"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="What's this for?"
              rows={2}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create Transaction"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
