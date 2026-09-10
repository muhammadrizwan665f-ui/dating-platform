"use client";
import { useEffect, useState } from "react";

type Method = { id: string; name: string; instructions: string; isActive: boolean };

export default function AdminPaymentMethodsPage() {
  const [methods, setMethods] = useState<Method[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  const load = () => {
    fetch("/api/admin/payment-methods")
      .then((r) => r.json())
      .then((d) => setMethods(d.methods ?? []))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const save = async (m: Method) => {
    setSaving(m.id);
    try {
      await fetch("/api/admin/payment-methods", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: m.id, instructions: editing[m.id] ?? m.instructions }),
      });
      load();
    } finally {
      setSaving(null);
    }
  };

  const toggleActive = async (m: Method) => {
    await fetch("/api/admin/payment-methods", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: m.id, isActive: !m.isActive }),
    });
    load();
  };

  const addMethod = async () => {
    if (!newName.trim()) return;
    await fetch("/api/admin/payment-methods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), instructions: "Add account details here." }),
    });
    setNewName("");
    load();
  };

  if (loading) return <p className="text-sm text-ink/50">Loading…</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-semibold mb-1">Payment Methods</h1>
      <p className="text-sm text-ink/50 mb-6">
        Set real account numbers / titles here — customers see exactly this text when submitting a manual payment.
      </p>

      <div className="flex gap-2 mb-6">
        <input
          placeholder="New payment method name (e.g. Bank Alfalah)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1 rounded-lg border border-black/10 px-3 py-2 text-sm"
        />
        <button onClick={addMethod} className="rounded-lg bg-rose-500 text-white px-4 py-2 text-sm font-medium">Add</button>
      </div>

      <div className="space-y-4">
        {methods.map((m) => (
          <div key={m.id} className="surface-card p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">{m.name}</p>
              <label className="flex items-center gap-1.5 text-xs">
                <input type="checkbox" checked={m.isActive} onChange={() => toggleActive(m)} />
                Active
              </label>
            </div>
            <textarea
              defaultValue={m.instructions}
              onChange={(e) => setEditing({ ...editing, [m.id]: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-black/10 px-3 py-2 text-xs"
              placeholder="Account title, account number, bank name, IBAN..."
            />
            <button onClick={() => save(m)} disabled={saving === m.id} className="mt-2 text-xs font-medium text-plum-600 disabled:opacity-50">
              {saving === m.id ? "Saving…" : "Save"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
