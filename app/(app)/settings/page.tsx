"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Settings</h1>

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

      <Card>
        <CardHeader><CardTitle>Family Members</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Manage kids and invite a second parent.
          </p>
          <div className="flex gap-2">
            <Link href="/kids">
              <Button variant="outline">Manage Kids</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
