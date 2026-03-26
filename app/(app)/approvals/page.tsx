"use client";

import { ApprovalQueue } from "@/components/parent/approval-queue";

export default function ApprovalsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pending Approvals</h1>
        <p className="text-sm text-muted-foreground">
          Review and approve transactions submitted by your kids
        </p>
      </div>
      <ApprovalQueue />
    </div>
  );
}
