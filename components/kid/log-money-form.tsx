"use client";

import { useState } from "react";
import { useApp } from "@/components/providers";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { TransactionType } from "@/types/database";

interface LogMoneyFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const KID_TYPES: { value: TransactionType; label: string; icon: string }[] = [
  { value: "chore", label: "Chore", icon: "🧹" },
  { value: "gift", label: "Gift", icon: "🎁" },
  { value: "good_grades", label: "Good Grades", icon: "📚" },
  { value: "spending", label: "Spending", icon: "🛍️" },
];

export function LogMoneyForm({ open, onClose, onSuccess }: LogMoneyFormProps) {
  const { user } = useApp();
  const [selectedType, setSelectedType] = useState<TransactionType | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedType || !user) return;
    setLoading(true);

    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kidId: user.id,
        type: selectedType,
        amount: parseFloat(form.get("amount") as string),
        description: form.get("description") || undefined,
      }),
    });

    if (res.ok) {
      toast.success("Money logged! Waiting for parent approval.");
      setSelectedType(null);
      onSuccess();
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to log money");
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "var(--font-fredoka)" }}>Log Money</DialogTitle>
        </DialogHeader>

        {/* Type selection */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {KID_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setSelectedType(t.value)}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                selectedType === t.value
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <span className="text-2xl block mb-1">{t.icon}</span>
              <span className="text-sm font-medium">{t.label}</span>
            </button>
          ))}
        </div>

        {selectedType && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">How much? ($)</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="5.00"
                required
                className="text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">What for?</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Cleaned my room"
                rows={2}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              A parent will need to approve this before it counts.
            </p>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging..." : "Log It!"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
