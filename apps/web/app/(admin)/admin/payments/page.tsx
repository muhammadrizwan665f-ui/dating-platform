"use client";
import { useEffect, useState } from "react";
import { Button } from "../../../../components/ui/Button";

interface Payment {
  id: string;
  amount: number;
  txnRef: string;
  proofUrl?: string | null;
  plan?: { name: string } | null;
  boostPlan?: { name: string } | null;
  method: { name: string };
  user: { email?: string; phone?: string; profile?: { displayName: string } };
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [lightbox, setLightbox] = useState<string | null>(null);

  function load() {
    fetch("/api/admin/payments").then((r) => r.json()).then((d) => setPayments(d.payments ?? []));
  }
  useEffect(load, []);

  async function act(id: string, action: "APPROVE" | "REJECT") {
    await fetch(`/api/admin/payments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    load();
  }

  return (
    <>
      <h1 className="font-display text-2xl font-semibold mb-6">Payments — Pending Review</h1>

      {payments.length === 0 && <p className="text-sm text-ink/50">No pending payments right now.</p>}

      <div className="space-y-3">
        {payments.map((p) => (
          <div key={p.id} className="surface-card p-4 flex flex-wrap items-center gap-4">
            {p.proofUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.proofUrl}
                alt="Payment proof"
                className="h-16 w-16 rounded-lg object-cover border border-black/10 cursor-pointer shrink-0"
                onClick={() => setLightbox(p.proofUrl!)}
              />
            ) : (
              <div className="h-16 w-16 rounded-lg bg-black/5 flex items-center justify-center text-[9px] text-ink/40 text-center shrink-0">
                No screenshot
              </div>
            )}

            <div className="flex-1 min-w-[180px]">
              <p className="text-sm font-medium">{p.user.profile?.displayName ?? p.user.email ?? p.user.phone ?? "—"}</p>
              <p className="text-xs text-ink/50">
                {p.plan?.name ?? p.boostPlan?.name ?? "Unknown"} · {p.method.name} · Rs.{p.amount}
              </p>
              <p className="text-xs text-ink/40">Txn: {p.txnRef}</p>
            </div>

            <div className="flex gap-2">
              <Button size="sm" onClick={() => act(p.id, "APPROVE")}>Approve</Button>
              <Button size="sm" variant="danger" onClick={() => act(p.id, "REJECT")}>Reject</Button>
            </div>
          </div>
        ))}
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6" onClick={() => setLightbox(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="Payment proof" className="max-h-[85vh] max-w-full rounded-xl" />
        </div>
      )}
    </>
  );
}
