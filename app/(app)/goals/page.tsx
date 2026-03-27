"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/components/providers";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  icon: string | null;
  is_completed: boolean;
}

const GOAL_ICONS = ["🎮", "🚲", "📱", "🎸", "⚽", "🎨", "📚", "🏖️", "🎯", "💎", "🧸", "🎧"];

export default function GoalsPage() {
  const { user } = useApp();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState("🎯");
  const [showAllocate, setShowAllocate] = useState<Goal | null>(null);
  const [allocLoading, setAllocLoading] = useState(false);
  const [celebratingGoal, setCelebratingGoal] = useState<string | null>(null);

  const isKid = user?.role === "kid";

  function load() {
    fetch("/api/goals")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setGoals(data); })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormLoading(true);
    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        targetAmount: parseFloat(form.get("targetAmount") as string),
        icon: selectedIcon,
        kidId: user?.id,
      }),
    });

    if (res.ok) {
      toast.success("Goal created!");
      setShowForm(false);
      load();
    } else {
      toast.error("Failed to create goal");
    }
    setFormLoading(false);
  }

  async function handleAllocate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!showAllocate) return;
    setAllocLoading(true);
    const form = new FormData(e.currentTarget);
    const amount = parseFloat(form.get("allocAmount") as string);

    const res = await fetch("/api/goals/allocate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        goalId: showAllocate.id,
        amount,
        kidId: user?.id,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.goalCompleted) {
        setCelebratingGoal(showAllocate.id);
        toast.success(`🎉 You reached your ${showAllocate.name} goal!`);
        setTimeout(() => setCelebratingGoal(null), 3000);
      } else {
        toast.success(`$${amount.toFixed(2)} saved to ${showAllocate.name}!`);
      }
      setShowAllocate(null);
      load();
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to allocate");
    }
    setAllocLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this goal?")) return;
    await fetch(`/api/goals/${id}`, { method: "DELETE" });
    load();
  }

  const active = goals.filter(g => !g.is_completed);
  const completed = goals.filter(g => g.is_completed);

  if (isKid) {
    return (
      <div className="space-y-6" data-mode="kid">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-fredoka)" }}>
              My Savings Goals 🎯
            </h1>
            <p className="text-xs opacity-50" style={{ fontFamily: "var(--font-fredoka)" }}>
              Save up for something awesome!
            </p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="rounded-xl"
            style={{
              fontFamily: "var(--font-fredoka)",
              background: "linear-gradient(135deg, var(--kid-sky), var(--kid-mint))",
            }}
          >
            + New Goal
          </Button>
        </div>

        {/* Create Goal Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent data-mode="kid">
            <DialogHeader>
              <DialogTitle style={{ fontFamily: "var(--font-fredoka)" }}>New Savings Goal</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label style={{ fontFamily: "var(--font-fredoka)" }}>Pick an icon</Label>
                <div className="flex flex-wrap gap-2">
                  {GOAL_ICONS.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setSelectedIcon(icon)}
                      className={`w-11 h-11 rounded-xl text-xl flex items-center justify-center transition-all ${
                        selectedIcon === icon
                          ? "bg-kid-sky/20 ring-2 ring-kid-sky shadow-md scale-110"
                          : "bg-muted hover:bg-kid-sky/10"
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label style={{ fontFamily: "var(--font-fredoka)" }}>What are you saving for?</Label>
                <Input name="name" placeholder="New bike" required className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label style={{ fontFamily: "var(--font-fredoka)" }}>Target amount ($)</Label>
                <Input name="targetAmount" type="number" step="0.01" min="1" placeholder="50.00" required className="rounded-xl text-lg font-bold text-center" style={{ fontFamily: "var(--font-fredoka)" }} />
              </div>
              <Button
                type="submit"
                className="w-full rounded-xl h-11"
                disabled={formLoading}
                style={{ fontFamily: "var(--font-fredoka)", background: "linear-gradient(135deg, var(--kid-sky), var(--kid-mint))" }}
              >
                {formLoading ? "Creating..." : "Create Goal"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Allocate to Goal Dialog */}
        <Dialog open={!!showAllocate} onOpenChange={() => setShowAllocate(null)}>
          <DialogContent data-mode="kid">
            <DialogHeader>
              <DialogTitle style={{ fontFamily: "var(--font-fredoka)" }}>
                Save to {showAllocate?.icon} {showAllocate?.name}
              </DialogTitle>
            </DialogHeader>
            {showAllocate && (
              <form onSubmit={handleAllocate} className="space-y-4">
                <div className="card-sky p-3 text-center">
                  <p className="text-xs opacity-50" style={{ fontFamily: "var(--font-fredoka)" }}>Still needed</p>
                  <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-fredoka)", color: "var(--kid-sky)" }}>
                    ${(showAllocate.target_amount - showAllocate.current_amount).toFixed(2)}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label style={{ fontFamily: "var(--font-fredoka)" }}>How much to save?</Label>
                  <Input
                    name="allocAmount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={showAllocate.target_amount - showAllocate.current_amount}
                    placeholder={(showAllocate.target_amount - showAllocate.current_amount).toFixed(2)}
                    required
                    className="rounded-xl text-2xl font-bold text-center h-14"
                    style={{ fontFamily: "var(--font-fredoka)" }}
                  />
                  <p className="text-[11px] opacity-40 text-center" style={{ fontFamily: "var(--font-fredoka)" }}>
                    This will move money from your spendable balance into this goal pot 🐷
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full rounded-xl h-11"
                  disabled={allocLoading}
                  style={{ fontFamily: "var(--font-fredoka)", background: "linear-gradient(135deg, var(--kid-sky), var(--kid-mint))" }}
                >
                  {allocLoading ? "Saving..." : "Save It!"}
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Goal Cards */}
        {loading ? (
          <div className="space-y-4">{[1,2].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
        ) : active.length === 0 && completed.length === 0 ? (
          <div className="card-sky p-10 text-center" style={{ borderStyle: "dashed" }}>
            <span className="text-5xl mb-3 block">🎯</span>
            <p className="font-semibold opacity-60 mb-4" style={{ fontFamily: "var(--font-fredoka)" }}>
              No goals yet. What do you want to save for?
            </p>
            <Button
              onClick={() => setShowForm(true)}
              className="rounded-xl"
              style={{ fontFamily: "var(--font-fredoka)", background: "linear-gradient(135deg, var(--kid-sky), var(--kid-mint))" }}
            >
              Create My First Goal
            </Button>
          </div>
        ) : (
          <>
            {/* Active Goals */}
            {active.length > 0 && (
              <div className="space-y-4">
                {active.map(goal => {
                  const pct = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
                  const remaining = goal.target_amount - goal.current_amount;
                  const isCelebrating = celebratingGoal === goal.id;
                  return (
                    <div
                      key={goal.id}
                      className={`card-gold p-5 ${isCelebrating ? "animate-celebrate" : ""}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{goal.icon || "🎯"}</span>
                          <div>
                            <p className="font-bold text-base" style={{ fontFamily: "var(--font-fredoka)" }}>{goal.name}</p>
                            <p className="text-xs opacity-50">${remaining.toFixed(2)} still needed</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold" style={{ fontFamily: "var(--font-fredoka)", color: "var(--kid-sky)" }}>
                            ${goal.current_amount.toFixed(2)}
                          </p>
                          <p className="text-[10px] opacity-40">of ${goal.target_amount.toFixed(2)}</p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="goal-progress-bar h-5 mb-3">
                        <div
                          className="goal-progress-fill h-full flex items-center justify-end pr-2"
                          style={{ width: `${Math.max(pct, 4)}%` }}
                        >
                          {pct >= 12 && (
                            <span className="text-[10px] font-bold text-white">{pct.toFixed(0)}%</span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 rounded-xl text-xs h-9"
                          onClick={() => setShowAllocate(goal)}
                          style={{
                            fontFamily: "var(--font-fredoka)",
                            background: "linear-gradient(135deg, var(--kid-sky), var(--kid-mint))",
                          }}
                        >
                          🐷 Save Money Here
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs text-destructive/60 hover:text-destructive"
                          onClick={() => handleDelete(goal.id)}
                          style={{ fontFamily: "var(--font-fredoka)" }}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Completed Goals */}
            {completed.length > 0 && (
              <div>
                <h2 className="text-lg font-bold mb-3" style={{ fontFamily: "var(--font-fredoka)" }}>
                  Completed 🎉
                </h2>
                <div className="space-y-2">
                  {completed.map(goal => (
                    <div key={goal.id} className="card-mint p-4 flex items-center justify-between opacity-80">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{goal.icon || "✅"}</span>
                        <span className="font-bold" style={{ fontFamily: "var(--font-fredoka)" }}>{goal.name}</span>
                      </div>
                      <span className="font-bold" style={{ fontFamily: "var(--font-fredoka)", color: "var(--kid-mint)" }}>
                        ${goal.target_amount.toFixed(2)} ✅
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // ─── Parent View (simplified) ───
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Savings Goals</h1>
          <p className="text-sm text-muted-foreground">Manage your kids&apos; savings goals</p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ New Goal</Button>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Savings Goal</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Pick an icon</Label>
              <div className="flex flex-wrap gap-2">
                {GOAL_ICONS.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setSelectedIcon(icon)}
                    className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                      selectedIcon === icon ? "bg-primary/20 ring-2 ring-primary" : "bg-muted"
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>What are you saving for?</Label>
              <Input name="name" placeholder="New bike" required />
            </div>
            <div className="space-y-2">
              <Label>Target amount ($)</Label>
              <Input name="targetAmount" type="number" step="0.01" min="1" placeholder="50.00" required />
            </div>
            <Button type="submit" className="w-full" disabled={formLoading}>
              {formLoading ? "Creating..." : "Create Goal"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-24" />)}</div>
      ) : active.length === 0 && completed.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <span className="text-4xl mb-3 block">🎯</span>
            <p className="text-muted-foreground mb-3">No goals yet.</p>
            <Button onClick={() => setShowForm(true)}>Create First Goal</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {active.length > 0 && (
            <div className="space-y-3">
              {active.map(goal => {
                const pct = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
                return (
                  <Card key={goal.id}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{goal.icon || "🎯"}</span>
                          <span className="font-semibold">{goal.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            ${goal.current_amount.toFixed(2)} / ${goal.target_amount.toFixed(2)}
                          </span>
                          <Button variant="ghost" size="sm" className="text-xs text-destructive" onClick={() => handleDelete(goal.id)}>
                            Remove
                          </Button>
                        </div>
                      </div>
                      <div className="h-3 rounded-full overflow-hidden bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {pct.toFixed(0)}% — ${(goal.target_amount - goal.current_amount).toFixed(2)} to go
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {completed.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Completed</h2>
              <div className="space-y-2">
                {completed.map(goal => (
                  <Card key={goal.id} className="opacity-75">
                    <CardContent className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{goal.icon || "✅"}</span>
                        <span className="font-medium">{goal.name}</span>
                      </div>
                      <span className="text-sm font-medium text-success">${goal.target_amount.toFixed(2)}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
