"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { KidForm } from "@/components/parent/kid-form";

interface Kid {
  id: string;
  display_name: string;
  avatar_url: string | null;
  balance: number;
  level: number;
  streak_days: number;
  is_active: boolean;
  created_at: string;
}

export default function KidsPage() {
  const [kids, setKids] = useState<Kid[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  function loadKids() {
    fetch("/api/kids")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setKids(data);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadKids(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kids</h1>
          <p className="text-sm text-muted-foreground">Manage your family&apos;s profiles</p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ Add Kid</Button>
      </div>

      <KidForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={() => { setShowForm(false); loadKids(); }}
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2].map((i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : kids.filter(k => k.is_active).length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-14">
            <span className="text-5xl mb-4">👧</span>
            <p className="text-muted-foreground mb-4">No kids yet. Add your first one!</p>
            <Button onClick={() => setShowForm(true)}>Add Kid</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {kids.filter(k => k.is_active).map((kid) => (
            <Link key={kid.id} href={`/kids/${kid.id}`}>
              <Card className="hover:shadow-md transition-all cursor-pointer h-full">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 rounded-full bg-kid-coral/20 flex items-center justify-center text-2xl shrink-0">
                      {kid.avatar_url || kid.display_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{kid.display_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Level {kid.level}
                        {kid.streak_days > 0 && ` • 🔥 ${kid.streak_days}d`}
                      </p>
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Balance</p>
                    <p className="text-2xl font-bold">${kid.balance.toFixed(2)}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
