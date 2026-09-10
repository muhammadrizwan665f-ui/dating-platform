"use client";
import { useEffect, useState } from "react";

type AdminUser = { id: string; email: string | null; role: string; status: string; createdAt: string };

export default function AdminAdminsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("MODERATOR");
  const [adding, setAdding] = useState(false);

  const load = () => {
    fetch("/api/admin/admins")
      .then((r) => {
        if (r.status === 403) { setForbidden(true); throw new Error(); }
        return r.json();
      })
      .then((d) => setAdmins(d.admins ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const grant = async () => {
    if (!email.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const data = await res.json();
      if (data.success) { setEmail(""); load(); }
      else alert(data.error);
    } finally {
      setAdding(false);
    }
  };

  const changeRole = async (userId: string, newRole: string) => {
    const res = await fetch("/api/admin/admins", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role: newRole }),
    });
    if (res.ok) load();
    else alert((await res.json()).error);
  };

  if (loading) return <p className="text-sm text-ink/50">Loading…</p>;
  if (forbidden) {
    return <p className="text-sm text-danger">Only Super Admins can manage admin access.</p>;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-semibold mb-1">Admin Users</h1>
      <p className="text-sm text-ink/50 mb-6">Grant or change admin/moderator access. The person must already have a regular account.</p>

      <div className="surface-card p-5 mb-6">
        <p className="text-sm font-medium mb-3">Grant access</p>
        <div className="flex flex-wrap gap-2">
          <input
            placeholder="user@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 min-w-[200px] rounded-lg border border-black/10 px-3 py-2 text-sm"
          />
          <select value={role} onChange={(e) => setRole(e.target.value)} className="rounded-lg border border-black/10 px-3 py-2 text-sm">
            <option value="MODERATOR">Moderator</option>
            <option value="ADMIN">Admin</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>
          <button onClick={grant} disabled={adding} className="rounded-lg bg-rose-500 text-white px-4 py-2 text-sm font-medium disabled:opacity-50">
            {adding ? "Adding…" : "Grant"}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {admins.map((a) => (
          <div key={a.id} className="surface-card p-4 flex items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium">{a.email}</p>
              <p className="text-xs text-ink/40">Since {new Date(a.createdAt).toLocaleDateString()}</p>
            </div>
            <select
              value={a.role}
              onChange={(e) => changeRole(a.id, e.target.value)}
              className="rounded-lg border border-black/10 px-2 py-1.5 text-xs"
            >
              <option value="USER">Remove access (User)</option>
              <option value="MODERATOR">Moderator</option>
              <option value="ADMIN">Admin</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
