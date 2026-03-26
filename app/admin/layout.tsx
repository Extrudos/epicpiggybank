import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  if (!user || user.role !== "super_admin") {
    redirect("/login");
  }

  return <AdminShell user={user}>{children}</AdminShell>;
}
