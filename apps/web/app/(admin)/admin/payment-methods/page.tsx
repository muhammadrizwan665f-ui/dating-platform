"use client";
import { useEffect, useState } from "react";

type Method = {
  id: string;
  name: string;
  instructions: string;
  isActive: boolean;
  logoUrl?: string | null;
  qrCodeUrl?: string | null;
  accountNumber?: string | null;
  accountTitle?: string | null;
};

export default function AdminPaymentMethodsPage() {
  const [methods, setMethods] = useState<Method[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

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

  const updateField = async (id: string, field: string, value: string) => {
    setError(null);
    try {
      await callApi({ id, [field]: value });
      load();
    } catch (e: any) {
      setError(e.message);
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
    setError(null);
    try {
      await callApi({ name: newName.trim(), instructions: "" });
      setNewName("");
      load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const uploadImage = async (methodId: string, field: "logoUrl" | "qrCodeUrl", file: File) => {
    setUploadingFor(`${methodId}-${field}`);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/profile/photos/upload", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        setError(uploadData.error || "Upload failed.");
        return;
      }
      await callApi({ id: methodId, [field]: uploadData.url });
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploadingFor(null);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-semibold mb-1">Payment Methods</h1>
      <p className="text-sm text-ink/50 mb-6">
        Logo, QR code, and account number/IBAN — customers see exactly this when paying manually.
      </p>

      {error && <div className="mb-4 rounded-xl bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger">{error}</div>}

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
          <button onClick={addMethod} disabled={!newName.trim()} className="rounded-xl bg-rose-500 text-white px-5 py-2.5 text-sm font-medium disabled:opacity-40 hover:bg-rose-600 transition-colors">
            + Add
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
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold">{m.name}</p>
                <label className="flex items-center gap-2 text-xs">
                  <span className={m.isActive ? "text-success" : "text-ink/40"}>{m.isActive ? "Active" : "Inactive"}</span>
                  <input type="checkbox" checked={m.isActive} onChange={() => toggleActive(m)} />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-ink/50 mb-1.5">Logo</label>
                  {m.logoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.logoUrl} alt="" className="h-12 w-12 rounded-lg object-contain bg-black/5 mb-2" />
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => e.target.files?.[0] && uploadImage(m.id, "logoUrl", e.target.files[0])}
                    disabled={uploadingFor === `${m.id}-logoUrl`}
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-ink/50 mb-1.5">QR Code</label>
                  {m.qrCodeUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.qrCodeUrl} alt="" className="h-16 w-16 rounded-lg object-contain bg-black/5 mb-2" />
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => e.target.files?.[0] && uploadImage(m.id, "qrCodeUrl", e.target.files[0])}
                    disabled={uploadingFor === `${m.id}-qrCodeUrl`}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-ink/50 mb-1">Account Title</label>
                  <input
                    defaultValue={m.accountTitle ?? ""}
                    onBlur={(e) => updateField(m.id, "accountTitle", e.target.value)}
                    placeholder="e.g. DilMil Pvt Ltd"
                    className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-ink/50 mb-1">Mobile Number / IBAN</label>
                  <input
                    defaultValue={m.accountNumber ?? ""}
                    onBlur={(e) => updateField(m.id, "accountNumber", e.target.value)}
                    placeholder="e.g. 0300-1234567"
                    className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <label className="block text-xs text-ink/50 mb-1">Extra instructions (optional)</label>
              <textarea
                defaultValue={m.instructions}
                onBlur={(e) => updateField(m.id, "instructions", e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-xs"
                placeholder="Any extra notes for the customer..."
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
