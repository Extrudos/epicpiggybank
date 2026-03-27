"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useApp } from "./providers";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
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
  { href: "/dashboard", label: "My Piggy Bank", icon: "🐷", color: "var(--kid-coral)" },
  { href: "/transactions", label: "My Money", icon: "💰", color: "var(--kid-gold)" },
  { href: "/goals", label: "Goals", icon: "🎯", color: "var(--kid-sky)" },
  { href: "/badges", label: "Badges", icon: "🏆", color: "var(--kid-purple)" },
  { href: "/collectibles", label: "Collection", icon: "✨", color: "var(--kid-mint)" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isKidMode } = useApp();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = user?.role === "kid" || isKidMode ? KID_NAV : PARENT_NAV;

  async function handleLogout() {
    if (user?.role === "kid") {
      await fetch("/api/auth/kid-logout", { method: "POST" });
    } else {
      const supabase = createBrowserSupabaseClient();
      await supabase.auth.signOut();
    }
    window.location.href = "/login";
  }

  const ProfilePopover = () => (
    <Popover>
      <PopoverTrigger>
        <button className="flex items-center gap-3 w-full rounded-lg px-2 py-2 hover:bg-muted transition-colors text-left">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
            {user?.avatarUrl || user?.displayName?.charAt(0).toUpperCase() || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.displayName}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground shrink-0">
            <path d="M7 15l5-5 5 5" />
          </svg>
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" sideOffset={8} className="w-56 p-1.5">
        {user?.role === "parent" && (
          <>
            <Link
              href="/settings"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm hover:bg-muted transition-colors"
            >
              <span className="text-base">👤</span>
              My Profile
            </Link>
            <Link
              href="/switch-kid"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm hover:bg-muted transition-colors"
            >
              <span className="text-base">🔄</span>
              Switch to Kid
            </Link>
            <Separator className="my-1" />
          </>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm hover:bg-muted transition-colors w-full text-left text-muted-foreground"
        >
          <span className="text-base">🚪</span>
          Log Out
        </button>
      </PopoverContent>
    </Popover>
  );

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`h-16 flex items-center px-4 ${
        isKidMode || user?.role === "kid"
          ? "border-b-2 border-kid-coral/20"
          : "border-b border-border/50"
      }`}>
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className={`text-2xl ${isKidMode || user?.role === "kid" ? "animate-piggy-float" : ""}`}>🐷</span>
          <span
            className="text-lg font-bold"
            style={{
              fontFamily: isKidMode || user?.role === "kid" ? "var(--font-fredoka)" : "var(--font-dm-sans)",
              ...(isKidMode || user?.role === "kid" ? {
                background: "linear-gradient(135deg, var(--kid-coral), var(--kid-gold))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              } : {}),
            }}
          >
            EpicPiggyBank
          </span>
        </Link>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-1.5">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const isKid = isKidMode || user?.role === "kid";
          const navColor = "color" in item ? (item as { color: string }).color : undefined;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all ${
                isKid ? "kid-nav-item" : "rounded-lg"
              } ${
                active
                  ? isKid
                    ? "kid-nav-item active"
                    : "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              style={isKid ? { fontFamily: "var(--font-fredoka)" } : undefined}
            >
              <span
                className="text-xl"
                style={isKid && !active && navColor ? {
                  filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.1))",
                } : undefined}
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Profile popover */}
      <div className="border-t border-border/50 p-3">
        <ProfilePopover />
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
