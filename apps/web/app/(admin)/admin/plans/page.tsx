"use client";
import { useEffect, useState } from "react";

type Plan = {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  badge: string | null;
  isActive: boolean;
  features: any;
};

const emptyForm = { name: "", price: "", durationDays: "30", badge: "" };

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    fetch("/api/admin/plans")
      .then((r) => r.json())
      .then((d) => setPlans(d.plans ?? []))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const startEdit = (p: Plan) => {
    setEditingId(p.id);
    setForm({ name: p.name, price: String(p.price), durationDays: String(p.durationDays), badge: p.badge || "" });
  };

  const save = async () => {
    if (!form.name.trim() || !form.price) return;
    setSaving(true);
    try {
      const payload = { name: form.name.trim(), price: Number(form.price), durationDays: Number(form.durationDays), badge: form.badge.trim() || null };
      const res = editingId
        ? await fetch("/api/admin/plans", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editingId, ...payload }) })
        : await fetch("/api/admin/plans", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) {
        setForm(emptyForm);
        setEditingId(null);
        load();
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (p: Plan) => {
    await fetch("/api/admin/plans", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, isActive: !p.isActive }),
    });
    load();
  };

  if (loading) return <p className="text-sm text-ink/50">Loading…</p>;

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-semibold mb-1">Membership Plans</h1>
      <p className="text-sm text-ink/50 mb-6">Edit prices, duration, and badges — changes apply site-wide instantly.</p>

      <div className="surface-card p-5 mb-6">
        <p className="text-sm font-medium mb-3">{editingId ? "Edit plan" : "Add new plan"}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-lg border border-black/10 px-3 py-2 text-sm" />
          <input placeholder="Price (PKR)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="rounded-lg border border-black/10 px-3 py-2 text-sm" />
          <input placeholder="Duration (days)" type="number" value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: e.target.value })} className="rounded-lg border border-black/10 px-3 py-2 text-sm" />
          <input placeholder="Badge (optional)" value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} className="rounded-lg border border-black/10 px-3 py-2 text-sm" />
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={save} disabled={saving} className="rounded-lg bg-rose-500 text-white px-5 py-2 text-sm font-medium disabled:opacity-50">
            {saving ? "Saving…" : editingId ? "Update Plan" : "Add Plan"}
          </button>
          {editingId && (
            <button onClick={() => { setEditingId(null); setForm(emptyForm); }} className="text-sm text-ink/50">
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {plans.map((p) => (
          <div key={p.id} className="surface-card p-4 flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium">
                {p.name} {p.badge && <span className="ml-2 text-[10px] font-semibold uppercase bg-gold-400/20 text-gold-500 px-2 py-0.5 rounded-full">{p.badge}</span>}
              </p>
              <p className="text-xs text-ink/50">Rs.{p.price} / {p.durationDays} days</p>
            </div>
            <button onClick={() => startEdit(p)} className="text-xs font-medium text-plum-600">Edit</button>
            <label className="flex items-center gap-1.5 text-xs">
              <input type="checkbox" checked={p.isActive} onChange={() => toggleActive(p)} />
              Active
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
