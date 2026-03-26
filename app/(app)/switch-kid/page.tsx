"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PinPad } from "@/components/kid/pin-pad";
import { Skeleton } from "@/components/ui/skeleton";

interface Kid {
  id: string;
  display_name: string;
  avatar_url: string | null;
  is_active: boolean;
}

export default function SwitchToKidPage() {
  const [kids, setKids] = useState<Kid[]>([]);
  const [selectedKid, setSelectedKid] = useState<Kid | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/kids")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data))
          setKids(data.filter((k: Kid) => k.is_active));
      })
      .finally(() => setLoading(false));
  }, []);

  async function handlePinSubmit(pin: string) {
    if (!selectedKid) return;
    setLoginLoading(true);
    setError(null);

    const res = await fetch("/api/auth/kid-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kidId: selectedKid.id, pin }),
    });

    const data = await res.json();

    if (res.ok) {
      window.location.href = "/dashboard";
    } else {
      setError(data.error || "Wrong PIN");
      setLoginLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-6 py-12">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-4 max-w-sm">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </div>
    );
  }

  // PIN entry
  if (selectedKid) {
    return (
      <div className="flex flex-col items-center py-12" data-mode="kid">
        <button
          onClick={() => {
            setSelectedKid(null);
            setError(null);
          }}
          className="group mb-6"
        >
          <div className="w-20 h-20 rounded-full bg-kid-coral/20 flex items-center justify-center text-3xl group-hover:ring-4 group-hover:ring-primary/20 transition-all">
            {selectedKid.avatar_url ||
              selectedKid.display_name.charAt(0).toUpperCase()}
          </div>
        </button>
        <h2
          className="text-2xl font-bold mb-1"
          style={{ fontFamily: "var(--font-fredoka)" }}
        >
          Hi, {selectedKid.display_name}!
        </h2>
        <p className="text-sm text-muted-foreground mb-8">Enter your PIN</p>

        <PinPad onSubmit={handlePinSubmit} loading={loginLoading} error={error} />

        <button
          onClick={() => {
            setSelectedKid(null);
            setError(null);
          }}
          className="mt-6 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Not {selectedKid.display_name}?
        </button>
      </div>
    );
  }

  // Kid selection
  return (
    <div className="flex flex-col items-center py-12" data-mode="kid">
      <h1
        className="text-3xl font-bold mb-2"
        style={{ fontFamily: "var(--font-fredoka)" }}
      >
        Who&apos;s logging in?
      </h1>
      <p className="text-sm text-muted-foreground mb-8">
        Pick your profile to get started
      </p>

      {kids.length === 0 ? (
        <Card className="card-playful max-w-sm">
          <CardContent className="py-10 text-center">
            <span className="text-4xl mb-3 block">👧</span>
            <p className="text-sm text-muted-foreground">
              No kids added yet. Add a kid from the Kids page first.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-lg">
          {kids.map((kid) => (
            <button
              key={kid.id}
              onClick={() => setSelectedKid(kid)}
              className="group"
            >
              <Card className="card-playful hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group-focus-visible:ring-2 group-focus-visible:ring-primary">
                <CardContent className="py-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-kid-coral/20 flex items-center justify-center text-2xl mx-auto mb-3 group-hover:scale-110 transition-transform">
                    {kid.avatar_url ||
                      kid.display_name.charAt(0).toUpperCase()}
                  </div>
                  <p
                    className="font-semibold text-sm"
                    style={{ fontFamily: "var(--font-fredoka)" }}
                  >
                    {kid.display_name}
                  </p>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
