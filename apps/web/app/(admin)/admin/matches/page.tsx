"use client";
import { useEffect, useState } from "react";

type MatchRow = {
  id: string;
  status: string;
  createdAt: string;
  user1: { email: string | null };
  user2: { email: string | null };
};

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/matches")
      .then((r) => r.json())
      .then((d) => { setMatches(d.matches ?? []); setTotal(d.total ?? 0); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-ink/50">Loading…</p>;

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-semibold mb-1">Matches</h1>
      <p className="text-sm text-ink/50 mb-6">{total} total mutual matches on DilMil.</p>

      <div className="surface-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/5 text-left text-ink/50">
              <th className="px-4 py-3 font-medium">User A</th>
              <th className="px-4 py-3 font-medium">User B</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Matched</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((m) => (
              <tr key={m.id} className="border-b border-black/5 last:border-0">
                <td className="px-4 py-3 whitespace-nowrap">{m.user1.email}</td>
                <td className="px-4 py-3 whitespace-nowrap">{m.user2.email}</td>
                <td className="px-4 py-3 whitespace-nowrap text-ink/50">{m.status}</td>
                <td className="px-4 py-3 whitespace-nowrap text-xs text-ink/40">{new Date(m.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
