"use client";
import { useEffect, useState } from "react";

type Log = { id: string; adminEmail: string; action: string; target: string; meta: any; createdAt: string };

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/audit-logs")
      .then((r) => r.json())
      .then((d) => setLogs(d.logs ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-ink/50">Loading…</p>;

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-semibold mb-1">Audit Logs</h1>
      <p className="text-sm text-ink/50 mb-6">Every admin action (bans, approvals, payment reviews, role changes) — most recent 200.</p>

      <div className="surface-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/5 text-left text-ink/50">
              <th className="px-4 py-3 font-medium">Admin</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Target</th>
              <th className="px-4 py-3 font-medium">When</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-b border-black/5 last:border-0">
                <td className="px-4 py-3 whitespace-nowrap">{l.adminEmail}</td>
                <td className="px-4 py-3 whitespace-nowrap font-medium">{l.action}</td>
                <td className="px-4 py-3 whitespace-nowrap text-ink/60">{l.target}</td>
                <td className="px-4 py-3 whitespace-nowrap text-ink/40 text-xs">{new Date(l.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-ink/40">No admin actions logged yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
