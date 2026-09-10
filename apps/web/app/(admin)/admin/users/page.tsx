"use client";
import { useEffect, useState } from "react";
import { AdminSidebar, AdminTable } from "../../../../components/admin/AdminShell";
import { Badge } from "../../../../components/ui/primitives";
import { Button } from "../../../../components/ui/Button";

interface AdminUser {
  id: string;
  email?: string | null;
  phone?: string | null;
  role: string;
  status: string;
  profile?: { displayName: string; status: string; gender: string; city: string; verified: boolean } | null;
}

const toneFor: Record<string, "default" | "success" | "warning" | "danger"> = {
  ACTIVE: "success",
  PENDING: "warning",
  SUSPENDED: "warning",
  BANNED: "danger",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");

  function load() {
    fetch(`/api/admin/users${query ? `?q=${encodeURIComponent(query)}` : ""}`)
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []));
  }

  useEffect(load, []);

  async function act(userId: string, action: "SUSPEND" | "BAN" | "UNBAN") {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action }),
    });
    load();
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl font-semibold">Users</h1>
          <input
            className="rounded-lg border border-black/10 px-3 py-1.5 text-sm"
            placeholder="Search name, email, phone"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
          />
        </div>

        <AdminTable
          columns={["Name", "Contact", "Gender / City", "Status", "Actions"]}
          rows={users.map((u) => [
            u.profile?.displayName ?? "—",
            u.email ?? u.phone ?? "—",
            `${u.profile?.gender ?? "—"} · ${u.profile?.city ?? "—"}`,
            <Badge key="status" tone={toneFor[u.status] ?? "default"}>{u.status}</Badge>,
            <div key="actions" className="flex gap-2">
              {u.status !== "SUSPENDED" && (
                <Button size="sm" variant="ghost" onClick={() => act(u.id, "SUSPEND")}>Suspend</Button>
              )}
              {u.status !== "BANNED" && (
                <Button size="sm" variant="danger" onClick={() => act(u.id, "BAN")}>Ban</Button>
              )}
              {(u.status === "SUSPENDED" || u.status === "BANNED") && (
                <Button size="sm" variant="secondary" onClick={() => act(u.id, "UNBAN")}>Reinstate</Button>
              )}
            </div>,
          ])}
        />
      </main>
    </div>
  );
}
