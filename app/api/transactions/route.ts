import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";
import { requireSession } from "@/lib/auth";
import { assertPremium } from "@/lib/plan-gates";
import { writeAuditLog } from "@/lib/audit";
import type { TransactionType } from "@/types/database";

const AUTO_APPROVE_TYPES: TransactionType[] = [
  "parent_deposit",
  "parent_withdrawal",
  "allowance",
];

export async function GET(request: NextRequest) {
  try {
    const user = await requireSession();
    const supabase = createServiceRoleClient();
    const searchParams = request.nextUrl.searchParams;

    let query = supabase
      .from("transactions")
      .select("*, kid:profiles!kid_id(display_name, avatar_url), initiator:profiles!initiated_by(display_name)")
      .eq("tenant_id", user.tenantId)
      .order("created_at", { ascending: false });

    // Kids can only see their own transactions
    if (user.role === "kid") {
      query = query.eq("kid_id", user.id);
    }

    const kidId = searchParams.get("kidId");
    if (kidId) query = query.eq("kid_id", kidId);

    const status = searchParams.get("status");
    if (status) query = query.eq("status", status);

    const type = searchParams.get("type");
    if (type) query = query.eq("type", type);

    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSession();
    const body = await request.json();

    const { kidId, type, amount, description, notes } = body as {
      kidId: string;
      type: TransactionType;
      amount: number;
      description?: string;
      notes?: string;
    };

    if (!kidId || !type || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "Kid ID, type, and a positive amount are required" },
        { status: 400 }
      );
    }

    // Premium check for investments
    if (type === "investment") {
      await assertPremium(user.tenantId);
    }

    // Kids can only create transactions for themselves
    if (user.role === "kid" && kidId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parent-initiated transactions are auto-approved
    const isAutoApproved =
      user.role === "parent" && AUTO_APPROVE_TYPES.includes(type);

    const supabase = createServiceRoleClient();

    const { data: txn, error } = await supabase
      .from("transactions")
      .insert({
        tenant_id: user.tenantId,
        kid_id: kidId,
        type,
        amount,
        description: description || null,
        notes: notes || null,
        status: isAutoApproved ? "approved" : "pending",
        initiated_by: user.id,
        approved_by: isAutoApproved ? user.id : null,
        approved_at: isAutoApproved ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) throw error;

    await writeAuditLog({
      tenant_id: user.tenantId,
      user_id: user.id,
      action: "INSERT",
      table_name: "transactions",
      record_id: txn.id,
      new_value: { type, amount, kid_id: kidId, status: txn.status },
    });

    return NextResponse.json(txn, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    const status = err instanceof Error && err.name === "PlanLimitError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
