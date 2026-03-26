import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createServiceRoleClient } from "@/lib/supabase";
import { createKidToken, setKidSession } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const { kidId, pin } = await request.json();

    if (!kidId || !pin) {
      return NextResponse.json(
        { error: "Kid ID and PIN are required" },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    const { data: kid, error } = await supabase
      .from("profiles")
      .select("id, tenant_id, role, display_name, avatar_url, pin_hash, is_active")
      .eq("id", kidId)
      .eq("role", "kid")
      .single();

    if (error || !kid) {
      return NextResponse.json(
        { error: "Kid not found" },
        { status: 404 }
      );
    }

    if (!kid.is_active) {
      return NextResponse.json(
        { error: "This account is inactive" },
        { status: 403 }
      );
    }

    if (!kid.pin_hash) {
      return NextResponse.json(
        { error: "No PIN set for this kid. Ask a parent to set one." },
        { status: 400 }
      );
    }

    const valid = await bcrypt.compare(pin, kid.pin_hash);
    if (!valid) {
      return NextResponse.json(
        { error: "Wrong PIN. Try again!" },
        { status: 401 }
      );
    }

    // Create kid session token
    const token = await createKidToken({
      profileId: kid.id,
      tenantId: kid.tenant_id,
      role: "kid",
      displayName: kid.display_name,
      avatarUrl: kid.avatar_url,
    });

    await setKidSession(token);

    await writeAuditLog({
      tenant_id: kid.tenant_id,
      user_id: kid.id,
      action: "LOGIN",
      table_name: "profiles",
      record_id: kid.id,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: kid.id,
        displayName: kid.display_name,
        avatarUrl: kid.avatar_url,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
