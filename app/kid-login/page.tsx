"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PinPad } from "@/components/kid/pin-pad";

interface Kid {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

type Step = "family" | "pick-kid" | "pin";

export default function PublicKidLoginPage() {
  const [step, setStep] = useState<Step>("family");
  const [familyCode, setFamilyCode] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [kids, setKids] = useState<Kid[]>([]);
  const [selectedKid, setSelectedKid] = useState<Kid | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFamilyLookup(e: React.FormEvent) {
    e.preventDefault();
    setLookupLoading(true);
    setError(null);

    const res = await fetch(
      `/api/auth/family-lookup?code=${encodeURIComponent(familyCode)}`
    );
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Family not found");
      setLookupLoading(false);
      return;
    }

    setFamilyName(data.familyName);
    setKids(data.kids);
    setStep("pick-kid");
    setLookupLoading(false);
  }

  function handleSelectKid(kid: Kid) {
    setSelectedKid(kid);
    setError(null);
    setStep("pin");
  }

  function handleBack() {
    if (step === "pin") {
      setSelectedKid(null);
      setError(null);
      setStep("pick-kid");
    } else if (step === "pick-kid") {
      setKids([]);
      setFamilyName("");
      setStep("family");
    }
  }

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

  return (
    <div className="min-h-screen flex flex-col" data-mode="kid">
      {/* Header */}
      <nav className="h-14 flex items-center justify-between px-4 border-b border-border/50">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl">🐷</span>
          <span
            className="text-lg font-bold"
            style={{ fontFamily: "var(--font-fredoka)" }}
          >
            EpicPiggyBank
          </span>
        </Link>
        <Link
          href="/login"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Parent login
        </Link>
      </nav>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          {/* ─── Step 1: Family Code ─── */}
          {step === "family" && (
            <div className="text-center">
              <span className="text-5xl block mb-4">🐷</span>
              <h1
                className="text-3xl font-bold mb-2"
                style={{ fontFamily: "var(--font-fredoka)" }}
              >
                Kid Login
              </h1>
              <p className="text-sm text-muted-foreground mb-8">
                Enter your family code to get started
              </p>

              <form onSubmit={handleFamilyLookup} className="space-y-4">
                <Input
                  value={familyCode}
                  onChange={(e) =>
                    setFamilyCode(e.target.value.toUpperCase().slice(0, 6))
                  }
                  placeholder="ABC123"
                  className="text-center text-2xl tracking-[0.3em] font-bold h-14 rounded-xl uppercase"
                  style={{ fontFamily: "var(--font-fredoka)" }}
                  maxLength={6}
                  autoFocus
                />

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 text-base rounded-xl"
                  style={{ fontFamily: "var(--font-fredoka)" }}
                  disabled={lookupLoading || familyCode.length < 4}
                >
                  {lookupLoading ? "Looking up..." : "Find My Family"}
                </Button>
              </form>

              <p className="text-xs text-muted-foreground mt-6">
                Ask a parent for your family code.
                <br />
                Parents can find it in Settings.
              </p>
            </div>
          )}

          {/* ─── Step 2: Pick Kid ─── */}
          {step === "pick-kid" && (
            <div className="text-center">
              <h1
                className="text-2xl font-bold mb-1"
                style={{ fontFamily: "var(--font-fredoka)" }}
              >
                {familyName}
              </h1>
              <p className="text-sm text-muted-foreground mb-8">
                Who&apos;s logging in?
              </p>

              {kids.length === 0 ? (
                <Card className="card-playful">
                  <CardContent className="py-10 text-center">
                    <span className="text-4xl mb-3 block">👧</span>
                    <p className="text-sm text-muted-foreground">
                      No kids in this family yet.
                      <br />
                      Ask a parent to add you!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {kids.map((kid) => (
                    <button
                      key={kid.id}
                      onClick={() => handleSelectKid(kid)}
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

              <button
                onClick={handleBack}
                className="mt-6 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Different family?
              </button>
            </div>
          )}

          {/* ─── Step 3: PIN Entry ─── */}
          {step === "pin" && selectedKid && (
            <div className="text-center">
              <button
                onClick={handleBack}
                className="group mb-6 inline-block"
              >
                <div className="w-20 h-20 rounded-full bg-kid-coral/20 flex items-center justify-center text-3xl mx-auto group-hover:ring-4 group-hover:ring-primary/20 transition-all">
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
              <p className="text-sm text-muted-foreground mb-8">
                Enter your PIN
              </p>

              <PinPad
                onSubmit={handlePinSubmit}
                loading={loginLoading}
                error={error}
              />

              <button
                onClick={handleBack}
                className="mt-6 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Not {selectedKid.display_name}?
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
