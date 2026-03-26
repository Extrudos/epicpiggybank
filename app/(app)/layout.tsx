import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AppProvider } from "@/components/providers";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role === "super_admin") {
    redirect("/admin/dashboard");
  }

  return (
    <AppProvider initialUser={user}>
      <AppShell>{children}</AppShell>
    </AppProvider>
  );
}
