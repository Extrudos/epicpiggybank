"use client";

import { useEffect, useState } from "react";
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

interface GoalOption {
  id: string;
  name: string;
  icon: string | null;
  target_amount: number;
  current_amount: number;
}

const INCOME_TYPES: { value: TransactionType; label: string; icon: string; desc: string }[] = [
  { value: "chore", label: "Chore", icon: "🧹", desc: "Earned doing chores" },
  { value: "gift", label: "Gift", icon: "🎁", desc: "Birthday, holiday, etc." },
  { value: "good_grades", label: "Good Grades", icon: "📚", desc: "School reward" },
];

const SPENDING_TYPE = { value: "spending" as TransactionType, label: "I Spent Money", icon: "🛍️", desc: "Bought something" };

export function LogMoneyForm({ open, onClose, onSuccess }: LogMoneyFormProps) {
  const { user } = useApp();
  const [selectedType, setSelectedType] = useState<TransactionType | null>(null);
  const [loading, setLoading] = useState(false);
  const [goals, setGoals] = useState<GoalOption[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [step, setStep] = useState<"type" | "form">("type");

  // Load active goals for allocation option
  useEffect(() => {
    if (open && user) {
      fetch(`/api/goals?kidId=${user.id}`)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setGoals(data.filter((g: GoalOption & { is_completed: boolean }) => !g.is_completed));
          }
        });
    }
  }, [open, user]);

  function resetForm() {
    setSelectedType(null);
    setSelectedGoalId(null);
    setStep("type");
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  const isDeposit = selectedType && !["spending", "withdrawal"].includes(selectedType);

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
        goalId: selectedGoalId || undefined,
      }),
    });

    if (res.ok) {
      const verb = selectedType === "spending" ? "Spending logged" : "Money logged";
      toast.success(`${verb}! Waiting for parent approval.`);
      resetForm();
      onSuccess();
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to log money");
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" data-mode="kid">
        <DialogHeader>
          <DialogTitle
            className="text-xl"
            style={{ fontFamily: "var(--font-fredoka)" }}
          >
            {step === "type" ? "What happened?" : selectedType === "spending" ? "🛍️ I Spent Money" : "💰 Log Money"}
          </DialogTitle>
        </DialogHeader>

        {step === "type" && (
          <div className="space-y-3">
            {/* Income section */}
            <p className="text-xs font-semibold opacity-50 uppercase tracking-wider" style={{ fontFamily: "var(--font-fredoka)" }}>
              Money I received
            </p>
            <div className="grid grid-cols-3 gap-2">
              {INCOME_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => { setSelectedType(t.value); setStep("form"); }}
                  className="p-3 rounded-2xl border-2 border-kid-mint/30 bg-kid-mint/5 text-center transition-all hover:border-kid-mint hover:shadow-md hover:-translate-y-0.5 active:scale-[0.97]"
                >
                  <span className="text-2xl block mb-1">{t.icon}</span>
                  <span className="text-xs font-semibold block" style={{ fontFamily: "var(--font-fredoka)" }}>{t.label}</span>
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] font-semibold opacity-40 uppercase" style={{ fontFamily: "var(--font-fredoka)" }}>or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Spending section */}
            <p className="text-xs font-semibold opacity-50 uppercase tracking-wider" style={{ fontFamily: "var(--font-fredoka)" }}>
              Money I spent
            </p>
            <button
              type="button"
              onClick={() => { setSelectedType(SPENDING_TYPE.value); setStep("form"); }}
              className="w-full p-4 rounded-2xl border-2 border-kid-coral/30 bg-kid-coral/5 text-center transition-all hover:border-kid-coral hover:shadow-md hover:-translate-y-0.5 active:scale-[0.97]"
            >
              <span className="text-3xl block mb-1">{SPENDING_TYPE.icon}</span>
              <span className="text-sm font-semibold block" style={{ fontFamily: "var(--font-fredoka)" }}>{SPENDING_TYPE.label}</span>
              <span className="text-[11px] opacity-50 block mt-0.5">{SPENDING_TYPE.desc}</span>
            </button>
          </div>
        )}

        {step === "form" && selectedType && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <button
              type="button"
              onClick={() => setStep("type")}
              className="text-xs font-semibold opacity-50 hover:opacity-80 flex items-center gap-1"
              style={{ fontFamily: "var(--font-fredoka)" }}
            >
              ← Change type
            </button>

            <div className="space-y-2">
              <Label style={{ fontFamily: "var(--font-fredoka)" }}>
                How much? ($)
              </Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="5.00"
                required
                className="text-2xl font-bold h-14 text-center rounded-xl"
                style={{ fontFamily: "var(--font-fredoka)" }}
              />
            </div>

            <div className="space-y-2">
              <Label style={{ fontFamily: "var(--font-fredoka)" }}>
                {selectedType === "spending" ? "What did you buy?" : "What for?"}
              </Label>
              <Textarea
                id="description"
                name="description"
                placeholder={selectedType === "spending" ? "New toy, snack, etc." : "Cleaned my room"}
                rows={2}
                className="rounded-xl"
              />
            </div>

            {/* Goal allocation option - only for deposits */}
            {isDeposit && goals.length > 0 && (
              <div className="space-y-2">
                <Label style={{ fontFamily: "var(--font-fredoka)" }}>
                  Save towards a goal? (optional)
                </Label>
                <div className="grid grid-cols-1 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedGoalId(null)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all text-left text-sm ${
                      !selectedGoalId
                        ? "border-kid-mint bg-kid-mint/10"
                        : "border-border/50 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <span>💵</span>
                    <span className="font-medium" style={{ fontFamily: "var(--font-fredoka)" }}>No, add to spendable</span>
                  </button>
                  {goals.map((goal) => {
                    const remaining = goal.target_amount - goal.current_amount;
                    return (
                      <button
                        key={goal.id}
                        type="button"
                        onClick={() => setSelectedGoalId(goal.id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border-2 transition-all text-left text-sm ${
                          selectedGoalId === goal.id
                            ? "border-kid-sky bg-kid-sky/10"
                            : "border-border/50 opacity-60 hover:opacity-100"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{goal.icon || "🎯"}</span>
                          <span className="font-medium" style={{ fontFamily: "var(--font-fredoka)" }}>{goal.name}</span>
                        </div>
                        <span className="text-[11px] opacity-60">${remaining.toFixed(0)} left</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <p className="text-xs opacity-50 text-center" style={{ fontFamily: "var(--font-fredoka)" }}>
              A parent will need to approve this 👆
            </p>

            <Button
              type="submit"
              className="w-full h-12 text-base rounded-xl"
              disabled={loading}
              style={{
                fontFamily: "var(--font-fredoka)",
                background: selectedType === "spending"
                  ? "var(--kid-coral)"
                  : "linear-gradient(135deg, var(--kid-mint), var(--kid-sky))",
              }}
            >
              {loading ? "Logging..." : selectedType === "spending" ? "Log Spending" : "Log It!"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
