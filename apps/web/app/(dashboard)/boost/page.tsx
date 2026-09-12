"use client";
import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";

interface BoostPlan {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
}
interface Method {
  id: string;
  name: string;
  instructions: string;
}

function formatDuration(mins: number) {
  if (mins < 60) return `${mins} min`;
  if (mins < 1440) return `${mins / 60} hr`;
  return `${mins / 1440} day${mins / 1440 > 1 ? "s" : ""}`;
}

export default function BoostPage() {
  const [plans, setPlans] = useState<BoostPlan[]>([]);
  const [methods, setMethods] = useState<Method[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<BoostPlan | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<Method | null>(null);
  const [form, setForm] = useState({ txnRef: "", paymentDate: "", note: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/boost-plans").then((r) => r.json()).then((d) => setPlans(d.plans ?? []));
    fetch("/api/payments/methods").then((r) => r.json()).then((d) => setMethods(d.methods ?? []));
  }, []);

  async function submitPayment() {
    if (!selectedPlan || !selectedMethod) return;
    setSubmitting(true);
    await fetch("/api/payments/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        boostPlanId: selectedPlan.id,
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
      <div className="flex items-center justify-center px-6 py-20">
        <div className="surface-card p-8 max-w-sm text-center">
          <p className="text-3xl mb-2">🚀</p>
          <h1 className="font-display text-xl font-semibold">Boost pending review</h1>
          <p className="text-sm text-ink/60 mt-2">
            Once approved, your profile gets extra Discover visibility for the boost duration.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-10 max-w-2xl mx-auto">
      <h1 className="font-display text-2xl font-semibold text-center mb-2">Boost your profile</h1>
      <p className="text-center text-ink/50 mb-8 text-sm">
        Get more visibility in Discover for a limited time — doesn't guarantee matches.
      </p>

      <div className="grid grid-cols-2 gap-3 max-w-md mx-auto mb-10">
        {plans.map((plan) => (
          <button
            key={plan.id}
            onClick={() => setSelectedPlan(plan)}
            className={`surface-card p-4 text-left transition-all ${selectedPlan?.id === plan.id ? "ring-2 ring-rose-400" : ""}`}
          >
            <p className="font-medium text-sm">{formatDuration(plan.durationMinutes)}</p>
            <p className="text-lg font-semibold mt-1">Rs.{plan.price}</p>
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
    </div>
  );
}
