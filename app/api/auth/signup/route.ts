import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";
import { createServerSupabaseClient } from "@/lib/supabase-server";
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

    // 4. Set app_metadata on the user
    await serviceClient.auth.admin.updateUserById(authData.user.id, {
      app_metadata: {
        tenant_id: tenant.id,
        role: "parent",
        profile_id: authData.user.id,
      },
    });

    // 5. Sign the user in
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signInWithPassword({ email, password });

    // 6. Audit log
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
