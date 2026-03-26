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

interface Collectible {
  id: string;
  slug: string;
  name: string;
  description: string;
  image_url: string;
  rarity: string;
}

const COLLECTIBLE_ICONS = ["🦄", "🐉", "🧸", "🎠", "🏰", "⚔️", "🛡️", "🧙", "🧚", "🐲", "🦋", "🌺", "🍄", "🌙", "☄️", "🔮"];

export default function AdminCollectiblesPage() {
  const [items, setItems] = useState<Collectible[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState("🦄");

  function load() {
    fetch("/api/admin/collectibles")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setItems(data); })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormLoading(true);
    const form = new FormData(e.currentTarget);
    const name = form.get("name") as string;

    const res = await fetch("/api/admin/collectibles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        slug: name.toLowerCase().replace(/\s+/g, "-"),
        description: form.get("description"),
        imageUrl: selectedIcon,
        rarity: form.get("rarity"),
        unlockCondition: {},
      }),
    });

    if (res.ok) {
      toast.success("Collectible created");
      setShowForm(false);
      load();
    } else {
      toast.error("Failed to create collectible");
    }
    setFormLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Collectible Management</h1>
        <Button onClick={() => setShowForm(true)}>+ New Collectible</Button>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Collectible</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-2">
                {COLLECTIBLE_ICONS.map(icon => (
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
              <Input name="name" placeholder="Golden Piggy" required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input name="description" placeholder="A rare golden piggy bank" required />
            </div>
            <div className="space-y-2">
              <Label>Rarity</Label>
              <Select name="rarity" required>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="common">Common</SelectItem>
                  <SelectItem value="uncommon">Uncommon</SelectItem>
                  <SelectItem value="rare">Rare</SelectItem>
                  <SelectItem value="epic">Epic</SelectItem>
                  <SelectItem value="legendary">Legendary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={formLoading}>
              {formLoading ? "Creating..." : "Create Collectible"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : items.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <span className="text-4xl mb-3 block">✨</span>
            <p className="text-muted-foreground">No collectibles defined yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <Card key={item.id}>
              <CardContent className="py-4 text-center">
                <span className="text-4xl block mb-2">{item.image_url}</span>
                <p className="font-semibold">{item.name}</p>
                <Badge className="mt-1 text-xs">{item.rarity}</Badge>
                <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
