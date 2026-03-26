"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Plan {
  id: string;
  name: string;
  slug: string;
  price_cents: number;
  interval: string;
  max_kids: number;
  is_active: boolean;
  features: string[];
}

export default function AdminBillingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  function load() {
    fetch("/api/admin/plans")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setPlans(data); })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormLoading(true);
    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/admin/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        slug: (form.get("name") as string).toLowerCase().replace(/\s+/g, "-"),
        priceCents: Math.round(parseFloat(form.get("price") as string) * 100),
        interval: form.get("interval"),
        maxKids: parseInt(form.get("maxKids") as string),
        features: (form.get("features") as string).split(",").map(f => f.trim()).filter(Boolean),
      }),
    });

    if (res.ok) {
      toast.success("Plan created");
      setShowForm(false);
      load();
    } else {
      toast.error("Failed to create plan");
    }
    setFormLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pricing Plans</h1>
        <Button onClick={() => setShowForm(true)}>+ New Plan</Button>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Pricing Plan</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Plan Name</Label>
              <Input name="name" placeholder="Premium" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price ($)</Label>
                <Input name="price" type="number" step="0.01" min="0" placeholder="5.00" required />
              </div>
              <div className="space-y-2">
                <Label>Interval</Label>
                <Select name="interval" required>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Monthly</SelectItem>
                    <SelectItem value="year">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Max Kids</Label>
              <Input name="maxKids" type="number" min="1" placeholder="999" required />
            </div>
            <div className="space-y-2">
              <Label>Features (comma-separated)</Label>
              <Input name="features" placeholder="Unlimited kids, Investments, Email notifications" />
            </div>
            <Button type="submit" className="w-full" disabled={formLoading}>
              {formLoading ? "Creating..." : "Create Plan"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-24" />)}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map(plan => (
            <Card key={plan.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <Badge variant={plan.is_active ? "default" : "secondary"}>
                    {plan.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-2xl font-bold">${(plan.price_cents / 100).toFixed(2)}<span className="text-sm text-muted-foreground">/{plan.interval}</span></p>
                <p className="text-muted-foreground">Max {plan.max_kids} kids</p>
                {plan.features.length > 0 && (
                  <ul className="space-y-1">
                    {plan.features.map((f, i) => (
                      <li key={i} className="text-xs text-muted-foreground">• {f}</li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
