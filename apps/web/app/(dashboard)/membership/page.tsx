"use client";
import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Badge } from "../../../components/ui/primitives";

interface Plan {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  badge?: string | null;
  features: Record<string, unknown>;
}
interface Method {
  id: string;
  name: string;
  instructions: string;
}

export default function MembershipPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [methods, setMethods] = useState<Method[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<Method | null>(null);
  const [form, setForm] = useState({ txnRef: "", paymentDate: "", note: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/membership/plans").then((r) => r.json()).then((d) => setPlans(d.plans ?? []));
    fetch("/api/payments/methods").then((r) => r.json()).then((d) => setMethods(d.methods ?? []));
  }, []);

  async function submitPayment() {
    if (!selectedPlan || !selectedMethod) return;
    setSubmitting(true);
    await fetch("/api/payments/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planId: selectedPlan.id,
        methodId: selectedMethod.id,
        amount: selectedPlan.price,
        txnRef: form.txnRef,
        paymentDate: form.paymentDate || new Date().toISOString(),
        note: form.note,
      }),
    });
    setSubmitting(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 bg-base">
        <div className="surface-card p-8 max-w-sm text-center">
          <p className="text-3xl mb-2">⏳</p>
          <h1 className="font-display text-xl font-semibold">Payment under review</h1>
          <p className="text-sm text-ink/60 mt-2">
            We&apos;ll notify you once our team verifies your payment. This usually takes a few hours.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-base px-4 py-10">
      <h1 className="font-display text-2xl font-semibold text-center mb-2">Choose your plan</h1>
      <p className="text-center text-ink/50 mb-8 text-sm">
        Premium plans improve your visibility in Discover — they don&apos;t guarantee matches or replies.
      </p>

      <div className="grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto mb-10">
        {plans.map((plan) => (
          <button
            key={plan.id}
            onClick={() => setSelectedPlan(plan)}
            className={`surface-card p-5 text-left transition-all ${selectedPlan?.id === plan.id ? "ring-2 ring-rose-400" : ""}`}
          >
            {plan.badge && <Badge tone="gold">{plan.badge}</Badge>}
            <p className="font-display text-lg font-semibold mt-2">{plan.name}</p>
            <p className="text-2xl font-semibold mt-1">
              Rs.{plan.price} <span className="text-sm font-normal text-ink/50">/{plan.durationDays}d</span>
            </p>
          </button>
        ))}
      </div>

      {selectedPlan && (
        <div className="max-w-md mx-auto surface-card p-6 space-y-4">
          <p className="font-medium text-sm">Select payment method</p>
          <div className="grid grid-cols-2 gap-2">
            {methods.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedMethod(m)}
                className={`rounded-xl border px-3 py-2.5 text-sm text-left ${selectedMethod?.id === m.id ? "border-rose-400 bg-rose-50" : "border-black/10"}`}
              >
                {m.name}
              </button>
            ))}
          </div>

          {selectedMethod && (
            <>
              <p className="text-xs text-ink/60 bg-black/[0.03] rounded-lg p-3">{selectedMethod.instructions}</p>
              <Input
                label="Transaction / reference ID"
                required
                value={form.txnRef}
                onChange={(e) => setForm((f) => ({ ...f, txnRef: e.target.value }))}
              />
              <Input
                label="Payment date"
                type="date"
                required
                value={form.paymentDate}
                onChange={(e) => setForm((f) => ({ ...f, paymentDate: e.target.value }))}
              />
              <Input
                label="Note (optional)"
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              />
              <Button className="w-full" onClick={submitPayment} loading={submitting} disabled={!form.txnRef}>
                Submit Payment
              </Button>
            </>
          )}
        </div>
      )}
    </main>
  );
}
