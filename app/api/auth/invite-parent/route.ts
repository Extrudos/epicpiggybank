import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";
import { requireRole } from "@/lib/auth";
import { resend } from "@/lib/resend";
import { writeAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const user = await requireRole("parent");
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // Check if there's already 2 parents
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", user.tenantId)
      .eq("role", "parent");

    if ((count ?? 0) >= 2) {
      return NextResponse.json(
        { error: "Maximum of 2 parents per family" },
        { status: 400 }
      );
    }

    // Create invite via Supabase auth
    const { data: inviteData, error: inviteError } =
      await supabase.auth.admin.inviteUserByEmail(email, {
        data: {
          tenant_id: user.tenantId,
          role: "parent",
          invited_by: user.id,
        },
        redirectTo: `${request.headers.get("origin")}/invite`,
      });

    if (inviteError) {
      return NextResponse.json(
        { error: inviteError.message },
        { status: 400 }
      );
    }

    // Send a custom notification via Resend
    try {
      await resend.emails.send({
        from: "EpicPiggyBank <noreply@epicpiggybank.com>",
        to: email,
        subject: `${user.displayName} invited you to EpicPiggyBank!`,
        html: `
          <h2>You've been invited to join a family on EpicPiggyBank!</h2>
          <p>${user.displayName} wants you to help manage their family's finances.</p>
          <p>Check your email for the signup link.</p>
        `,
      });
    } catch {
      // Email sending is best-effort
    }

    await writeAuditLog({
      tenant_id: user.tenantId,
      user_id: user.id,
      action: "INVITE",
      table_name: "profiles",
      new_value: { email, invited_by: user.id },
    });

    return NextResponse.json({
      success: true,
      userId: inviteData?.user?.id,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
