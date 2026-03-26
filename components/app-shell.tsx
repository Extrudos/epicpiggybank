"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "./providers";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { useState } from "react";

const PARENT_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/kids", label: "Kids", icon: "👧" },
  { href: "/transactions", label: "Transactions", icon: "💰" },
  { href: "/approvals", label: "Approvals", icon: "✅" },
  { href: "/allowances", label: "Allowances", icon: "📅" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

const KID_NAV = [
  { href: "/dashboard", label: "My Piggy Bank", icon: "🐷" },
  { href: "/transactions", label: "My Money", icon: "💰" },
  { href: "/goals", label: "Goals", icon: "🎯" },
  { href: "/badges", label: "Badges", icon: "🏆" },
  { href: "/collectibles", label: "Collection", icon: "✨" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isKidMode } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = user?.role === "kid" || isKidMode ? KID_NAV : PARENT_NAV;

  async function handleLogout() {
    if (user?.role === "kid") {
      await fetch("/api/auth/kid-logout", { method: "POST" });
    } else {
      const supabase = createBrowserSupabaseClient();
      await supabase.auth.signOut();
    }
    router.push("/login");
    router.refresh();
  }

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-border/50">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl">🐷</span>
          <span
            className="text-lg font-bold"
            style={{ fontFamily: isKidMode || user?.role === "kid" ? "var(--font-fredoka)" : "var(--font-dm-sans)" }}
          >
            EpicPiggyBank
          </span>
        </Link>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-border/50 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
            {user?.displayName?.charAt(0).toUpperCase() || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.displayName}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
          </div>
        </div>
        {user?.role === "parent" && (
          <Link href="/kid-login" onClick={() => setMobileOpen(false)}>
            <Button variant="outline" size="sm" className="w-full mb-2">
              🔄 Switch to Kid
            </Button>
          </Link>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground"
          onClick={handleLogout}
        >
          Log Out
        </Button>
      </div>
    </div>
  );

  return (
    <div
      className="min-h-screen flex"
      data-mode={user?.role === "kid" || isKidMode ? "kid" : "parent"}
    >
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-border/50 bg-sidebar flex-col shrink-0">
        <NavContent />
      </aside>

      {/* Mobile header + sheet */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden h-14 flex items-center justify-between px-4 border-b border-border/50 bg-background">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger>
              <Button variant="ghost" size="sm" className="p-2" onClick={() => setMobileOpen(true)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <NavContent />
            </SheetContent>
          </Sheet>
          <span className="text-lg">🐷</span>
          <div className="w-8" />
        </header>

        <main className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
