"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface KidFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AVATAR_OPTIONS = ["🧒", "👧", "👦", "🧒🏽", "👧🏻", "👦🏿", "🦸", "🧙", "🐱", "🐶", "🦊", "🐼"];

export function KidForm({ open, onClose, onSuccess }: KidFormProps) {
  const [loading, setLoading] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState("🧒");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/kids", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: form.get("displayName"),
        pin: form.get("pin"),
        avatarUrl: selectedAvatar,
      }),
    });

    if (res.ok) {
      toast.success("Kid added!");
      onSuccess();
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to add kid");
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a Kid</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar picker */}
          <div className="space-y-2">
            <Label>Avatar</Label>
            <div className="flex flex-wrap gap-2">
              {AVATAR_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedAvatar(emoji)}
                  className={`w-12 h-12 rounded-full text-2xl flex items-center justify-center transition-all ${
                    selectedAvatar === emoji
                      ? "bg-primary/20 ring-2 ring-primary scale-110"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Kid&apos;s Name</Label>
            <Input
              id="displayName"
              name="displayName"
              placeholder="Emma"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pin">PIN (4 digits)</Label>
            <Input
              id="pin"
              name="pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]{4}"
              placeholder="••••"
              minLength={4}
              maxLength={4}
              required
            />
            <p className="text-xs text-muted-foreground">
              Your kid will use this 4-digit PIN to log in.
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Adding..." : "Add Kid"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
