"use client";
import { useEffect, useState } from "react";

type Boost = { id: string; userEmail: string; startsAt: string; endsAt: string; multiplier: number; isActive: boolean };
type BoostPlan = { id: string; name: string; durationMinutes: number; price: number; isActive: boolean };

export default function AdminBoostsPage() {
  const [boosts, setBoosts] = useState<Boost[]>([]);
  const [plans, setPlans] = useState<BoostPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", durationMinutes: "60", price: "" });
  const [saving, setSaving] = useState(false);

  const load = () => {
    Promise.all([
      fetch("/api/admin/boosts").then((r) => r.json()),
      fetch("/api/admin/boost-plans").then((r) => r.json()),
    ]).then(([b, p]) => {
      setBoosts(b.boosts ?? []);
      setPlans(p.plans ?? []);
      setLoading(false);
    });
  };
  useEffect(load, []);

  const addPlan = async () => {
    if (!form.name.trim() || !form.price) return;
    setSaving(true);
    try {
      await fetch("/api/admin/boost-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), durationMinutes: Number(form.durationMinutes), price: Number(form.price) }),
      });
      setForm({ name: "", durationMinutes: "60", price: "" });
      load();
    } finally {
      setSaving(false);
    }
  };

  const togglePlan = async (id: string, isActive: boolean) => {
    await fetch("/api/admin/boost-plans", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive }),
    });
    load();
  };

  if (loading) return <p className="text-sm text-ink/50">Loading…</p>;

  const active = boosts.filter((b) => b.isActive);
  const past = boosts.filter((b) => !b.isActive);

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-semibold mb-1">Boosts</h1>
      <p className="text-sm text-ink/50 mb-6">Manage boost offerings and see who's currently boosted.</p>

      <div className="surface-card p-5 mb-6">
        <p className="text-sm font-medium mb-3">Boost offerings</p>
        <div className="space-y-2 mb-4">
          {plans.map((p) => (
            <div key={p.id} className="flex items-center gap-3 text-sm">
              <span className="flex-1">{p.name} — Rs.{p.price}</span>
              <label className="flex items-center gap-1.5 text-xs">
                <input type="checkbox" checked={p.isActive} onChange={(e) => togglePlan(p.id, e.target.checked)} />
                Active
              </label>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-lg border border-black/10 px-3 py-2 text-sm" />
          <input placeholder="Minutes" type="number" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} className="w-24 rounded-lg border border-black/10 px-3 py-2 text-sm" />
          <input placeholder="Price (Rs.)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-28 rounded-lg border border-black/10 px-3 py-2 text-sm" />
          <button onClick={addPlan} disabled={saving} className="rounded-lg bg-rose-500 text-white px-4 py-2 text-sm font-medium disabled:opacity-50">
            Add
          </button>
        </div>
      </div>

      <p className="text-sm font-medium mb-2">Active now ({active.length})</p>
      <div className="space-y-2 mb-6">
        {active.length === 0 && <p className="text-xs text-ink/40 surface-card p-4">No active boosts right now.</p>}
        {active.map((b) => (
          <div key={b.id} className="surface-card p-4 flex items-center gap-4">
            <span className="h-2 w-2 rounded-full bg-success shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">{b.userEmail}</p>
              <p className="text-xs text-ink/40">Until {new Date(b.endsAt).toLocaleString()} · {b.multiplier}x visibility</p>
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
              <p className="text-xs text-ink/40">{new Date(b.startsAt).toLocaleDateString()} – {new Date(b.endsAt).toLocaleDateString()} · {b.multiplier}x</p>
            </div>
          </div>
        ))}
        {past.length === 0 && <p className="text-xs text-ink/40 surface-card p-4">No boost history yet.</p>}
      </div>
    </div>
  );
}
