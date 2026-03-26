"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/providers";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface TenantInfo {
  name: string;
  family_code: string;
  plan: string;
}

export default function SettingsPage() {
  const { user } = useApp();
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile editing
  const [displayName, setDisplayName] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  // Invite parent
  const [showInvite, setShowInvite] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);

  useEffect(() => {
    fetch("/api/tenant")
      .then((r) => r.json())
      .then((data) => {
        if (data.family_code) setTenant(data);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user?.displayName) setDisplayName(user.displayName);
  }, [user]);

  function copyCode() {
    if (tenant?.family_code) {
      navigator.clipboard.writeText(tenant.family_code);
      toast.success("Family code copied!");
    }
  }

  async function handleProfileSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    setProfileSaving(true);

    const res = await fetch(`/api/settings/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName }),
    });

    if (res.ok) {
      toast.success("Profile updated");
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to update profile");
    }
    setProfileSaving(false);
  }

  async function handlePasswordReset() {
    const supabase = createBrowserSupabaseClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser?.email) {
      toast.error("No email found");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(authUser.email, {
      redirectTo: `${window.location.origin}/callback?next=/reset-password`,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password reset email sent. Check your inbox.");
    }
  }

  async function handleInviteParent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setInviteLoading(true);

    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;

    const res = await fetch("/api/auth/invite-parent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (res.ok) {
      toast.success(`Invite sent to ${email}`);
      setShowInvite(false);
    } else {
      toast.error(data.error || "Failed to send invite");
    }
    setInviteLoading(false);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* My Profile */}
      <Card>
        <CardHeader><CardTitle>My Profile</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-semibold text-primary shrink-0">
                {user?.avatarUrl || user?.displayName?.charAt(0).toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{user?.displayName}</p>
                <p className="text-sm text-muted-foreground">Parent</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" size="sm" disabled={profileSaving}>
                {profileSaving ? "Saving..." : "Save Name"}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handlePasswordReset}>
                Reset Password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Family Code */}
      <Card>
        <CardHeader><CardTitle>Kid Login Code</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Share this code with your kids so they can log in on their own device at{" "}
            <span className="font-medium text-foreground">/kid-login</span>.
          </p>
          {loading ? (
            <Skeleton className="h-14 w-40" />
          ) : (
            <div className="flex items-center gap-3">
              <div className="bg-muted rounded-xl px-5 py-3 text-2xl font-bold tracking-[0.2em] font-mono">
                {tenant?.family_code || "------"}
              </div>
              <Button variant="outline" size="sm" onClick={copyCode}>
                Copy
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Family Members */}
      <Card>
        <CardHeader><CardTitle>Family Members</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Manage kids and invite a second parent to co-manage.
          </p>
          <div className="flex gap-2">
            <Link href="/kids">
              <Button variant="outline">Manage Kids</Button>
            </Link>
            <Button variant="outline" onClick={() => setShowInvite(true)}>
              Invite Parent
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invite Parent Dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Second Parent</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            They&apos;ll get an email with a link to join your family account.
            Maximum 2 parents per family.
          </p>
          <form onSubmit={handleInviteParent} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inviteEmail">Their Email</Label>
              <Input
                id="inviteEmail"
                name="email"
                type="email"
                placeholder="partner@email.com"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={inviteLoading}>
              {inviteLoading ? "Sending..." : "Send Invite"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Billing */}
      <Card>
        <CardHeader><CardTitle>Billing & Subscription</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Manage your subscription, upgrade to Premium, or update payment details.
          </p>
          <Link href="/settings/billing">
            <Button variant="outline">Manage Billing</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
