import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";
import { writeAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const { email, password, familyName, displayName } = await request.json();

    if (!email || !password || !familyName || !displayName) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const serviceClient = createServiceRoleClient();

    // 1. Create the auth user
    const { data: authData, error: authError } =
      await serviceClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || "Failed to create user" },
        { status: 400 }
      );
    }

    // 2. Create tenant
    const { data: tenant, error: tenantError } = await serviceClient
      .from("tenants")
      .insert({ name: familyName })
      .select()
      .single();

    if (tenantError || !tenant) {
      // Cleanup: delete the auth user
      await serviceClient.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: "Failed to create family account" },
        { status: 500 }
      );
    }

    // 3. Create profile
    const { error: profileError } = await serviceClient
      .from("profiles")
      .insert({
        id: authData.user.id,
        tenant_id: tenant.id,
        role: "parent",
        display_name: displayName,
        email,
      });

    if (profileError) {
      await serviceClient.auth.admin.deleteUser(authData.user.id);
      await serviceClient.from("tenants").delete().eq("id", tenant.id);
      return NextResponse.json(
        { error: "Failed to create profile" },
        { status: 500 }
      );
    }

    // 4. Audit log
    // (app_metadata is synced automatically by the
    //  sync_profile_to_auth_metadata database trigger)
    await writeAuditLog({
      tenant_id: tenant.id,
      user_id: authData.user.id,
      action: "INSERT",
      table_name: "tenants",
      record_id: tenant.id,
      new_value: { name: familyName },
    });

    return NextResponse.json({ success: true, tenantId: tenant.id });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
