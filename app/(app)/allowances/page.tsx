"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Schedule {
  id: string;
  kid_id: string;
  amount: number;
  frequency: string;
  day_of_week: number | null;
  day_of_month: number | null;
  is_active: boolean;
  next_run_at: string;
  kid: { display_name: string };
}

interface Kid { id: string; display_name: string }

type FormMode = null | "pick" | "one-time" | "recurring";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FREQ_LABELS: Record<string, string> = {
  daily: "Daily", weekly: "Weekly", biweekly: "Every 2 Weeks", monthly: "Monthly",
};

export default function AllowancesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [kids, setKids] = useState<Kid[]>([]);
  const [loading, setLoading] = useState(true);
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [formLoading, setFormLoading] = useState(false);

  function load() {
    Promise.all([
      fetch("/api/allowances").then(r => r.json()),
      fetch("/api/kids").then(r => r.json()),
    ]).then(([s, k]) => {
      if (Array.isArray(s)) setSchedules(s);
      if (Array.isArray(k)) setKids(k);
    }).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function closeForm() {
    setFormMode(null);
  }

  async function handleOneTime(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormLoading(true);
    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kidId: form.get("kidId"),
        type: "allowance",
        amount: parseFloat(form.get("amount") as string),
        description: form.get("description") || "One-time allowance",
      }),
    });

    if (res.ok) {
      toast.success("Allowance sent!");
      closeForm();
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to send allowance");
    }
    setFormLoading(false);
  }

  async function handleRecurring(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormLoading(true);
    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/allowances", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kidId: form.get("kidId"),
        amount: parseFloat(form.get("amount") as string),
        frequency: form.get("frequency"),
        dayOfWeek: form.get("dayOfWeek") ? parseInt(form.get("dayOfWeek") as string) : undefined,
        dayOfMonth: form.get("dayOfMonth") ? parseInt(form.get("dayOfMonth") as string) : undefined,
      }),
    });

    if (res.ok) {
      toast.success("Recurring schedule created");
      closeForm();
      load();
    } else {
      toast.error("Failed to create schedule");
    }
    setFormLoading(false);
  }

  async function toggleActive(id: string, isActive: boolean) {
    await fetch(`/api/allowances/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !isActive }),
    });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this allowance schedule?")) return;
    await fetch(`/api/allowances/${id}`, { method: "DELETE" });
    toast.success("Schedule deleted");
    load();
  }

  const KidSelect = () => (
    <div className="space-y-2">
      <Label>Kid</Label>
      <Select name="kidId" required>
        <SelectTrigger><SelectValue placeholder="Select kid" /></SelectTrigger>
        <SelectContent>
          {kids.map(k => <SelectItem key={k.id} value={k.id}>{k.display_name}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Allowances</h1>
          <p className="text-sm text-muted-foreground">Send one-time or set up recurring allowances</p>
        </div>
        <Button onClick={() => setFormMode("pick")}>+ Add Allowance</Button>
      </div>

      {/* Picker: one-time vs recurring */}
      <Dialog open={formMode === "pick"} onOpenChange={(open) => { if (!open) closeForm(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Allowance</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => setFormMode("one-time")}
              className="flex items-center gap-3 rounded-xl border-2 border-border p-4 text-left hover:border-primary/50 hover:bg-primary/5 transition-all"
            >
              <span className="text-2xl">💵</span>
              <div>
                <p className="font-semibold text-sm">One-time allowance</p>
                <p className="text-xs text-muted-foreground">Send money right now</p>
              </div>
            </button>
            <button
              onClick={() => setFormMode("recurring")}
              className="flex items-center gap-3 rounded-xl border-2 border-border p-4 text-left hover:border-primary/50 hover:bg-primary/5 transition-all"
            >
              <span className="text-2xl">📅</span>
              <div>
                <p className="font-semibold text-sm">Recurring schedule</p>
                <p className="text-xs text-muted-foreground">Daily, weekly, or monthly</p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* One-time form */}
      <Dialog open={formMode === "one-time"} onOpenChange={(open) => { if (!open) closeForm(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>One-Time Allowance</DialogTitle></DialogHeader>
          <form onSubmit={handleOneTime} className="space-y-4">
            <KidSelect />
            <div className="space-y-2">
              <Label>Amount ($)</Label>
              <Input name="amount" type="number" step="0.01" min="0.01" placeholder="10.00" required />
            </div>
            <div className="space-y-2">
              <Label>Note (optional)</Label>
              <Textarea name="description" placeholder="Great week!" rows={2} />
            </div>
            <Button type="submit" className="w-full" disabled={formLoading}>
              {formLoading ? "Sending..." : "Send Allowance"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Recurring form */}
      <Dialog open={formMode === "recurring"} onOpenChange={(open) => { if (!open) closeForm(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Recurring Allowance Schedule</DialogTitle></DialogHeader>
          <form onSubmit={handleRecurring} className="space-y-4">
            <KidSelect />
            <div className="space-y-2">
              <Label>Amount ($)</Label>
              <Input name="amount" type="number" step="0.01" min="0.01" placeholder="10.00" required />
            </div>
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select name="frequency" required>
                <SelectTrigger><SelectValue placeholder="How often" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Every 2 Weeks</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={formLoading}>
              {formLoading ? "Creating..." : "Create Schedule"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Schedules list */}
      {loading ? (
        <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-20" />)}</div>
      ) : schedules.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <span className="text-4xl mb-3 block">📅</span>
            <p className="text-muted-foreground mb-1">No recurring schedules yet.</p>
            <p className="text-xs text-muted-foreground">You can also send one-time allowances above.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recurring Schedules</h2>
          <div className="space-y-3">
            {schedules.map(s => (
              <Card key={s.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <Switch checked={s.is_active} onCheckedChange={() => toggleActive(s.id, s.is_active)} />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{s.kid?.display_name}</p>
                        <Badge variant="secondary" className="text-xs">{FREQ_LABELS[s.frequency]}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Next: {new Date(s.next_run_at).toLocaleDateString()}
                        {s.day_of_week !== null && ` (${DAYS[s.day_of_week]})`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-bold">${s.amount.toFixed(2)}</p>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(s.id)}>
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
