"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/components/providers";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Collectible {
  id: string;
  name: string;
  description: string;
  image_url: string;
  rarity: string;
}

interface EarnedCollectible {
  collectible_id: string;
  earned_at: string;
}

const RARITY_COLORS: Record<string, string> = {
  common: "bg-muted text-muted-foreground",
  uncommon: "bg-green-100 text-green-700",
  rare: "bg-blue-100 text-blue-700",
  epic: "bg-purple-100 text-purple-700",
  legendary: "bg-amber-100 text-amber-700",
};

const RARITY_BORDERS: Record<string, string> = {
  common: "border-muted",
  uncommon: "border-green-300",
  rare: "border-blue-400",
  epic: "border-purple-400",
  legendary: "border-amber-400",
};

export default function CollectiblesPage() {
  const { user } = useApp();
  const [collectibles, setCollectibles] = useState<Collectible[]>([]);
  const [earned, setEarned] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/collectibles").then(r => r.json()).catch(() => []),
      fetch(`/api/kids/${user?.id}/collectibles`).then(r => r.json()).catch(() => []),
    ]).then(([all, myCollectibles]) => {
      if (Array.isArray(all)) setCollectibles(all);
      if (Array.isArray(myCollectibles)) {
        setEarned(new Set(myCollectibles.map((c: EarnedCollectible) => c.collectible_id)));
      }
    }).finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-mode="kid">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-fredoka)" }}>
          My Collection
        </h1>
        <p className="text-sm text-muted-foreground">
          {earned.size} of {collectibles.length} collected
        </p>
      </div>

      {collectibles.length === 0 ? (
        <Card className="card-playful">
          <CardContent className="py-12 text-center">
            <span className="text-4xl mb-3 block">✨</span>
            <p className="text-muted-foreground">No collectibles yet. Keep going!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {collectibles.map(item => {
            const isEarned = earned.has(item.id);
            return (
              <Card
                key={item.id}
                className={`card-playful border-2 ${RARITY_BORDERS[item.rarity] || ""} transition-all ${
                  !isEarned ? "opacity-30 grayscale" : ""
                }`}
              >
                <CardContent className="py-5 text-center">
                  <span className={`text-4xl block mb-2 ${isEarned ? "animate-bounce-in" : ""}`}>
                    {item.image_url}
                  </span>
                  <p className="font-semibold text-sm" style={{ fontFamily: "var(--font-fredoka)" }}>
                    {item.name}
                  </p>
                  <Badge className={`mt-1 text-[10px] ${RARITY_COLORS[item.rarity] || ""}`}>
                    {item.rarity}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
