import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { createServerSupabaseClient } from "./supabase-server";
import type { SessionUser, UserRole } from "@/types/database";

const KID_SESSION_COOKIE = "epb_kid_session";
const JWT_SECRET = new TextEncoder().encode(
  process.env.KID_JWT_SECRET || "epicpiggybank-kid-secret-change-me"
);

export interface KidTokenPayload {
  profileId: string;
  tenantId: string;
  role: "kid";
  displayName: string;
  avatarUrl: string | null;
}

export async function createKidToken(payload: KidTokenPayload): Promise<string> {
  const { SignJWT } = await import("jose");
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("4h")
    .setIssuedAt()
    .sign(JWT_SECRET);
}

export async function setKidSession(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(KID_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 4 * 60 * 60, // 4 hours
    path: "/",
  });
}

export async function clearKidSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(KID_SESSION_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  // First check for kid session
  const cookieStore = await cookies();
  const kidToken = cookieStore.get(KID_SESSION_COOKIE)?.value;

  if (kidToken) {
    try {
      const { payload } = await jwtVerify(kidToken, JWT_SECRET);
      const data = payload as unknown as KidTokenPayload;
      return {
        id: data.profileId,
        tenantId: data.tenantId,
        role: "kid",
        displayName: data.displayName,
        avatarUrl: data.avatarUrl,
      };
    } catch {
      // Invalid/expired kid token, fall through to parent auth
    }
  }

  // Check for parent/admin Supabase auth session
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, tenant_id, role, display_name, avatar_url")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return {
    id: profile.id,
    tenantId: profile.tenant_id,
    role: profile.role as UserRole,
    displayName: profile.display_name,
    avatarUrl: profile.avatar_url,
  };
}

export async function requireSession(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireRole(
  ...roles: UserRole[]
): Promise<SessionUser> {
  const user = await requireSession();
  if (!roles.includes(user.role)) {
    throw new Error("Forbidden");
  }
  return user;
}
