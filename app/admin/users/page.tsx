"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";

interface User {
  id: string;
  display_name: string;
  email: string | null;
  role: string;
  tenant_id: string;
  is_active: boolean;
  tenants?: { name: string };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/users")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setUsers(data); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u =>
    u.display_name.toLowerCase().includes(search.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Input
          placeholder="Search users..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-16" />)}</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(user => (
            <Card key={user.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">{user.display_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {user.email || "No email"} • {user.tenants?.name || user.tenant_id}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{user.role}</Badge>
                  {!user.is_active && <Badge variant="destructive">Inactive</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-6">No users found.</p>
          )}
        </div>
      )}
    </div>
  );
}
