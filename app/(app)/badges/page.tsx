"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/components/providers";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  criteria_type: string;
  criteria_value: number;
}

interface EarnedBadge {
  badge_id: string;
  earned_at: string;
}

export default function BadgesPage() {
  const { user } = useApp();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [earned, setEarned] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/badges").then(r => r.json()).catch(() => []),
      fetch(`/api/kids/${user?.id}/badges`).then(r => r.json()).catch(() => []),
    ]).then(([allBadges, earnedBadges]) => {
      if (Array.isArray(allBadges)) setBadges(allBadges);
      if (Array.isArray(earnedBadges)) {
        setEarned(new Set(earnedBadges.map((b: EarnedBadge) => b.badge_id)));
      }
    }).finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-mode="kid">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-fredoka)" }}>
          My Badges
        </h1>
        <p className="text-sm text-muted-foreground">
          {earned.size} of {badges.length} earned
        </p>
      </div>

      {badges.length === 0 ? (
        <Card className="card-playful">
          <CardContent className="py-12 text-center">
            <span className="text-4xl mb-3 block">🏆</span>
            <p className="text-muted-foreground">No badges available yet. Keep saving!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {badges.map(badge => {
            const isEarned = earned.has(badge.id);
            return (
              <Card
                key={badge.id}
                className={`card-playful text-center transition-all ${
                  isEarned ? "badge-glow" : "opacity-40 grayscale"
                }`}
              >
                <CardContent className="py-6">
                  <span className={`text-4xl block mb-2 ${isEarned ? "animate-bounce-in" : ""}`}>
                    {badge.icon_url}
                  </span>
                  <p className="font-semibold text-sm" style={{ fontFamily: "var(--font-fredoka)" }}>
                    {badge.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
