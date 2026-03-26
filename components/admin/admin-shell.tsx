"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import type { SessionUser } from "@/types/database";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/admin/tenants", label: "Tenants", icon: "👨‍👩‍👧‍👦" },
  { href: "/admin/users", label: "Users", icon: "👤" },
  { href: "/admin/billing", label: "Pricing", icon: "💳" },
  { href: "/admin/billing/coupons", label: "Coupons", icon: "🎟️" },
  { href: "/admin/badges", label: "Badges", icon: "🏆" },
  { href: "/admin/collectibles", label: "Collectibles", icon: "✨" },
];

export function AdminShell({ children, user }: { children: React.ReactNode; user: SessionUser }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 border-r border-border bg-card flex flex-col shrink-0">
        <div className="h-16 flex items-center px-4 border-b border-border">
          <span className="text-lg font-bold">🐷 EPB Admin</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-4">
          <p className="text-sm font-medium">{user.displayName}</p>
          <p className="text-xs text-muted-foreground mb-2">Super Admin</p>
          <Button variant="ghost" size="sm" className="w-full" onClick={handleLogout}>
            Log Out
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-6 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
