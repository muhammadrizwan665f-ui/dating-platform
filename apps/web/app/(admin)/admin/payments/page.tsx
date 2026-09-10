"use client";
import { useEffect, useState } from "react";
import { AdminSidebar, AdminTable } from "../../../../components/admin/AdminShell";
import { Button } from "../../../../components/ui/Button";

interface Payment {
  id: string;
  amount: number;
  txnRef: string;
  proofUrl?: string | null;
  plan: { name: string };
  method: { name: string };
  user: { email?: string; phone?: string; profile?: { displayName: string } };
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);

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
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6">
        <h1 className="font-display text-2xl font-semibold mb-6">Payments — Pending Review</h1>
        <AdminTable
          columns={["User", "Plan", "Method", "Amount", "Txn Ref", "Actions"]}
          rows={payments.map((p) => [
            p.user.profile?.displayName ?? p.user.email ?? p.user.phone ?? "—",
            p.plan.name,
            p.method.name,
            `Rs.${p.amount}`,
            p.txnRef,
            <div key="actions" className="flex gap-2">
              <Button size="sm" onClick={() => act(p.id, "APPROVE")}>Approve</Button>
              <Button size="sm" variant="danger" onClick={() => act(p.id, "REJECT")}>Reject</Button>
            </div>,
          ])}
        />
      </main>
    </div>
  );
}
