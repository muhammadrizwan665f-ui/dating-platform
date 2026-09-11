"use client";
import { useEffect, useState } from "react";

type Method = { id: string; name: string; instructions: string; isActive: boolean };

export default function AdminPaymentMethodsPage() {
  const [methods, setMethods] = useState<Method[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    fetch("/api/admin/payment-methods")
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json().catch(() => ({})))?.error || `Failed to load (${r.status})`);
        return r.json();
      })
      .then((d) => setMethods(d.methods ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  async function callApi(body: any) {
    const res = await fetch("/api/admin/payment-methods", {
      method: body.name && !body.id ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ? JSON.stringify(data.error) : `Request failed (${res.status})`);
    return data;
  }

  const save = async (m: Method) => {
    setSaving(m.id);
    setError(null);
    try {
      await callApi({ id: m.id, instructions: editing[m.id] ?? m.instructions });
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(null);
    }
  };

  const toggleActive = async (m: Method) => {
    setError(null);
    try {
      await callApi({ id: m.id, isActive: !m.isActive });
      load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const addMethod = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    setError(null);
    try {
      await callApi({ name: newName.trim(), instructions: "Add account details here." });
      setNewName("");
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-semibold mb-1">Payment Methods</h1>
      <p className="text-sm text-ink/50 mb-6">
        Set real account numbers / titles here — customers see exactly this text when submitting a manual payment.
      </p>

      {error && (
        <div className="mb-4 rounded-xl bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="surface-card p-5 mb-6">
        <p className="text-sm font-medium mb-3">Add a payment method</p>
        <div className="flex gap-2">
          <input
            placeholder="e.g. Bank Alfalah, JazzCash, EasyPaisa"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addMethod()}
            className="flex-1 rounded-xl border border-black/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
          />
          <button
            onClick={addMethod}
            disabled={adding || !newName.trim()}
            className="rounded-xl bg-rose-500 text-white px-5 py-2.5 text-sm font-medium disabled:opacity-40 hover:bg-rose-600 transition-colors"
          >
            {adding ? "Adding…" : "+ Add"}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-ink/50">Loading…</p>
      ) : methods.length === 0 ? (
        <p className="text-sm text-ink/40 surface-card p-6 text-center">No payment methods yet — add one above.</p>
      ) : (
        <div className="space-y-4">
          {methods.map((m) => (
            <div key={m.id} className="surface-card p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold">{m.name}</p>
                <label className="flex items-center gap-2 text-xs">
                  <span className={m.isActive ? "text-success" : "text-ink/40"}>{m.isActive ? "Active" : "Inactive"}</span>
                  <input type="checkbox" checked={m.isActive} onChange={() => toggleActive(m)} />
                </label>
              </div>
              <textarea
                defaultValue={m.instructions}
                onChange={(e) => setEditing((s) => ({ ...s, [m.id]: e.target.value }))}
                rows={3}
                className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
                placeholder="Account title, account number, bank name, IBAN..."
              />
              <button
                onClick={() => save(m)}
                disabled={saving === m.id}
                className="mt-3 rounded-lg bg-black/5 hover:bg-black/10 transition-colors px-4 py-2 text-xs font-medium disabled:opacity-40"
              >
                {saving === m.id ? "Saving…" : "Save Changes"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
