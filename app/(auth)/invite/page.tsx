"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function InvitePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // The invite link includes a token that Supabase auto-processes
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setReady(true);
      }
    });
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const password = form.get("password") as string;
    const displayName = form.get("displayName") as string;

    const supabase = createBrowserSupabaseClient();

    // Set password for the invited user
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    // Get the user's metadata to create the profile
    const { data: { user } } = await supabase.auth.getUser();

    if (user?.user_metadata?.tenant_id) {
      // Create profile via service route
      await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          tenantId: user.user_metadata.tenant_id,
          displayName,
          email: user.email,
          isInvite: true,
        }),
      });
    }

    router.push("/dashboard");
    router.refresh();
  }

  if (!ready) {
    return (
      <Card className="border-border/50 shadow-lg">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Processing your invite...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl" style={{ fontFamily: "var(--font-fredoka)" }}>
          Welcome to the Family!
        </CardTitle>
        <CardDescription>
          Set up your account to start co-managing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Your Name</Label>
            <Input id="displayName" name="displayName" placeholder="Jordan Johnson" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Set a Password</Label>
            <Input id="password" name="password" type="password" minLength={8} required />
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Setting up..." : "Join Family"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
