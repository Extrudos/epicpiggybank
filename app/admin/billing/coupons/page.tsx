"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Coupon {
  id: string;
  code: string;
  type: string;
  value: number;
  max_uses: number | null;
  times_used: number;
  expires_at: string | null;
  is_active: boolean;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  function load() {
    fetch("/api/admin/coupons")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setCoupons(data); })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormLoading(true);
    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: (form.get("code") as string).toUpperCase(),
        type: form.get("type"),
        value: parseFloat(form.get("value") as string),
        maxUses: form.get("maxUses") ? parseInt(form.get("maxUses") as string) : null,
        expiresAt: form.get("expiresAt") || null,
      }),
    });

    if (res.ok) {
      toast.success("Coupon created");
      setShowForm(false);
      load();
    } else {
      toast.error("Failed to create coupon");
    }
    setFormLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Coupons</h1>
        <Button onClick={() => setShowForm(true)}>+ New Coupon</Button>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Coupon</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input name="code" placeholder="FAMILY20" required className="uppercase" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select name="type" required>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percentage Off</SelectItem>
                    <SelectItem value="fixed">Fixed Amount Off</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Value</Label>
                <Input name="value" type="number" step="0.01" min="0.01" placeholder="20" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max Uses (optional)</Label>
                <Input name="maxUses" type="number" min="1" placeholder="100" />
              </div>
              <div className="space-y-2">
                <Label>Expires (optional)</Label>
                <Input name="expiresAt" type="date" />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={formLoading}>
              {formLoading ? "Creating..." : "Create Coupon"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-16" />)}</div>
      ) : coupons.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <span className="text-4xl mb-3 block">🎟️</span>
            <p className="text-muted-foreground">No coupons yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {coupons.map(c => (
            <Card key={c.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <code className="font-bold">{c.code}</code>
                    <Badge variant={c.is_active ? "default" : "secondary"}>
                      {c.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {c.type === "percent" ? `${c.value}% off` : `$${c.value} off`}
                    {c.max_uses && ` • ${c.times_used}/${c.max_uses} used`}
                    {c.expires_at && ` • Expires ${new Date(c.expires_at).toLocaleDateString()}`}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
