"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function EditKidPage() {
  const params = useParams();
  const router = useRouter();
  const kidId = params.kidId as string;
  const [loading, setLoading] = useState(false);
  const [kid, setKid] = useState<{ display_name: string; email: string | null; avatar_url: string | null } | null>(null);

  useEffect(() => {
    fetch(`/api/kids/${kidId}`).then(r => r.json()).then(setKid);
  }, [kidId]);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);

    const res = await fetch(`/api/kids/${kidId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        display_name: form.get("displayName"),
        email: form.get("email") || null,
      }),
    });

    if (res.ok) {
      toast.success("Profile updated");
      router.push(`/kids/${kidId}`);
    } else {
      toast.error("Failed to update");
    }
    setLoading(false);
  }

  async function handleResetPin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const pin = form.get("pin") as string;

    const res = await fetch(`/api/kids/${kidId}/reset-pin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });

    if (res.ok) {
      toast.success("PIN reset successfully");
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to reset PIN");
    }
  }

  if (!kid) return null;

  return (
    <div className="space-y-6 max-w-lg">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>← Back</Button>

      <Card>
        <CardHeader><CardTitle>Edit Profile</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Name</Label>
              <Input id="displayName" name="displayName" defaultValue={kid.display_name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (optional)</Label>
              <Input id="email" name="email" type="email" defaultValue={kid.email || ""} placeholder="For notifications" />
            </div>
            <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Changes"}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Reset PIN</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleResetPin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pin">New PIN (4 digits)</Label>
              <Input id="pin" name="pin" type="password" inputMode="numeric" pattern="[0-9]{4}" minLength={4} maxLength={4} required />
            </div>
            <Button type="submit" variant="outline">Reset PIN</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
