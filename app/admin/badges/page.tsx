"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Badge {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon_url: string;
  criteria_type: string;
  criteria_value: number;
}

const BADGE_ICONS = ["⭐", "🌟", "💪", "🎖️", "🥇", "🥈", "🥉", "🏅", "🎯", "🔥", "💎", "👑", "🦸", "🚀", "🌈", "🎪"];

export default function AdminBadgesPage() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState("⭐");

  function load() {
    fetch("/api/admin/badges")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setBadges(data); })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormLoading(true);
    const form = new FormData(e.currentTarget);
    const name = form.get("name") as string;

    const res = await fetch("/api/admin/badges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        slug: name.toLowerCase().replace(/\s+/g, "-"),
        description: form.get("description"),
        iconUrl: selectedIcon,
        criteriaType: form.get("criteriaType"),
        criteriaValue: parseInt(form.get("criteriaValue") as string),
      }),
    });

    if (res.ok) {
      toast.success("Badge created");
      setShowForm(false);
      load();
    } else {
      toast.error("Failed to create badge");
    }
    setFormLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this badge?")) return;
    await fetch(`/api/admin/badges/${id}`, { method: "DELETE" });
    toast.success("Badge deleted");
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Badge Management</h1>
        <Button onClick={() => setShowForm(true)}>+ New Badge</Button>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Badge</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-2">
                {BADGE_ICONS.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setSelectedIcon(icon)}
                    className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center ${
                      selectedIcon === icon ? "bg-primary/20 ring-2 ring-primary" : "bg-muted"
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input name="name" placeholder="First Saver" required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input name="description" placeholder="Complete your first transaction" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Criteria Type</Label>
                <Select name="criteriaType" required>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="level">Level</SelectItem>
                    <SelectItem value="streak">Streak Days</SelectItem>
                    <SelectItem value="transaction_count">Transaction Count</SelectItem>
                    <SelectItem value="savings_goal">Goals Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Criteria Value</Label>
                <Input name="criteriaValue" type="number" min="1" placeholder="1" required />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={formLoading}>
              {formLoading ? "Creating..." : "Create Badge"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : badges.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <span className="text-4xl mb-3 block">🏆</span>
            <p className="text-muted-foreground">No badges defined yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {badges.map(badge => (
            <Card key={badge.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{badge.icon_url}</span>
                    <div>
                      <p className="font-semibold">{badge.name}</p>
                      <p className="text-xs text-muted-foreground">{badge.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {badge.criteria_type} ≥ {badge.criteria_value}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-destructive text-xs" onClick={() => handleDelete(badge.id)}>
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
