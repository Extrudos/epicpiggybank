import { NextResponse } from "next/server";
import { clearKidSession } from "@/lib/auth";

export async function POST() {
  await clearKidSession();
  return NextResponse.json({ success: true });
}
