import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")?.toUpperCase().trim();

  if (!code || code.length < 4) {
    return NextResponse.json(
      { error: "Enter your family code" },
      { status: 400 }
    );
  }

  const supabase = createServiceRoleClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, name, family_code")
    .eq("family_code", code)
    .single();

  if (!tenant) {
    return NextResponse.json(
      { error: "Family not found. Check your code and try again." },
      { status: 404 }
    );
  }

  // Return kids in this family (only active, only safe fields)
  const { data: kids } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .eq("tenant_id", tenant.id)
    .eq("role", "kid")
    .eq("is_active", true)
    .order("display_name");

  return NextResponse.json({
    familyName: tenant.name,
    kids: kids || [],
  });
}
