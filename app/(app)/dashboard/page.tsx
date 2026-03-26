"use client";

import { useApp } from "@/components/providers";
import { ParentDashboard } from "@/components/parent/parent-dashboard";
import { KidDashboard } from "@/components/kid/kid-dashboard";

export default function DashboardPage() {
  const { user } = useApp();

  if (user?.role === "kid") {
    return <KidDashboard />;
  }

  return <ParentDashboard />;
}
