"use client";
import { useEffect, useState } from "react";

type Boost = { id: string; userEmail: string; startsAt: string; endsAt: string; multiplier: number; isActive: boolean };

export default function AdminBoostsPage() {
  const [boosts, setBoosts] = useState<Boost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/boosts")
      .then((r) => r.json())
      .then((d) => setBoosts(d.boosts ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-ink/50">Loading…</p>;

  const active = boosts.filter((b) => b.isActive);
  const past = boosts.filter((b) => !b.isActive);

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-semibold mb-1">Boosts</h1>
      <p className="text-sm text-ink/50 mb-6">Profile boosts purchased by users — active ones get higher Discover priority.</p>

      <p className="text-sm font-medium mb-2">Active now ({active.length})</p>
      <div className="space-y-2 mb-6">
        {active.length === 0 && <p className="text-xs text-ink/40 surface-card p-4">No active boosts right now.</p>}
        {active.map((b) => (
          <div key={b.id} className="surface-card p-4 flex items-center gap-4">
            <span className="h-2 w-2 rounded-full bg-success shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">{b.userEmail}</p>
              <p className="text-xs text-ink/40">
                Until {new Date(b.endsAt).toLocaleString()} · {b.multiplier}x visibility
              </p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-sm font-medium mb-2">History</p>
      <div className="space-y-2">
        {past.slice(0, 30).map((b) => (
          <div key={b.id} className="surface-card p-4 flex items-center gap-4 opacity-60">
            <div className="flex-1">
              <p className="text-sm">{b.userEmail}</p>
              <p className="text-xs text-ink/40">
                {new Date(b.startsAt).toLocaleDateString()} – {new Date(b.endsAt).toLocaleDateString()} · {b.multiplier}x
              </p>
            </div>
          </div>
        ))}
        {past.length === 0 && <p className="text-xs text-ink/40 surface-card p-4">No boost history yet.</p>}
      </div>
    </div>
  );
}
