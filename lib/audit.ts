import { createServiceRoleClient } from "./supabase";
import { headers } from "next/headers";

interface AuditEntry {
  tenant_id: string | null;
  user_id: string;
  action: string;
  table_name: string;
  record_id?: string | null;
  old_value?: Record<string, unknown> | null;
  new_value?: Record<string, unknown> | null;
}

export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  const supabase = createServiceRoleClient();
  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headersList.get("x-real-ip") ||
    null;

  await supabase.from("audit_log").insert({
    ...entry,
    ip_address: ip,
  });
}
