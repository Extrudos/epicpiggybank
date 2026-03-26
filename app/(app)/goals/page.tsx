"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/components/providers";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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

  async function handleDelete(id: string) {
    if (!confirm("Remove this goal?")) return;
    await fetch(`/api/goals/${id}`, { method: "DELETE" });
    load();
  }

  const active = goals.filter(g => !g.is_completed);
  const completed = goals.filter(g => g.is_completed);

  const isKid = user?.role === "kid";

  return (
    <div className="space-y-6" data-mode={isKid ? "kid" : undefined}>
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold"
            style={isKid ? { fontFamily: "var(--font-fredoka)" } : undefined}
          >
            {isKid ? "My Savings Goals" : "Savings Goals"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isKid ? "Save up for something awesome!" : "Manage your kids' savings goals"}
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ New Goal</Button>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle style={isKid ? { fontFamily: "var(--font-fredoka)" } : undefined}>New Savings Goal</DialogTitle></DialogHeader>
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
        <Card className={isKid ? "card-playful border-dashed" : "border-dashed"}>
          <CardContent className="py-12 text-center">
            <span className="text-4xl mb-3 block">🎯</span>
            <p className="text-muted-foreground mb-3">No goals yet. What do you want to save for?</p>
            <Button onClick={() => setShowForm(true)}>Create My First Goal</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {active.length > 0 && (
            <div className="space-y-3">
              {active.map(goal => {
                const pct = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
                return (
                  <Card key={goal.id} className={isKid ? "card-playful" : ""}>
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
                      <Progress value={pct} className="h-3" />
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
