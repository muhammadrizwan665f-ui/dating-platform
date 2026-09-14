"use client";
import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";

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
  logoUrl?: string | null;
  qrCodeUrl?: string | null;
  accountNumber?: string | null;
  accountTitle?: string | null;
}

export default function MembershipPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [methods, setMethods] = useState<Method[]>([]);
  const [currentPlanName, setCurrentPlanName] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<Method | null>(null);
  const [form, setForm] = useState({ txnRef: "", paymentDate: "", note: "" });
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/membership/plans").then((r) => r.json()).then((d) => setPlans(d.plans ?? []));
    fetch("/api/payments/methods").then((r) => r.json()).then((d) => setMethods(d.methods ?? []));
    fetch("/api/dashboard").then((r) => r.json()).then((d) => setCurrentPlanName(d.membershipPlan ?? null));
  }, []);

  const copyAccountNumber = () => {
    if (!selectedMethod?.accountNumber) return;
    navigator.clipboard.writeText(selectedMethod.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleProofSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
  };

  async function submitPayment() {
    if (!selectedPlan || !selectedMethod) return;
    setSubmitting(true);
    setError(null);
    try {
      let proofUrl: string | undefined;
      if (proofFile) {
        const formData = new FormData();
        formData.append("file", proofFile);
        const uploadRes = await fetch("/api/profile/photos/upload", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          setError(uploadData.error || "Screenshot upload failed. Please try again.");
          return;
        }
        proofUrl = uploadData.url;
      }

      const res = await fetch("/api/payments/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlan.id,
          methodId: selectedMethod.id,
          amount: selectedPlan.price,
          txnRef: form.txnRef,
          paymentDate: form.paymentDate || new Date().toISOString(),
          note: form.note,
          proofUrl,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ? JSON.stringify(data.error) : "Couldn't submit payment. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch (err) {
      setError("Something went wrong. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center px-6 py-20">
        <div className="surface-card p-8 max-w-sm text-center">
          <p className="text-3xl mb-2">⏳</p>
          <h1 className="font-display text-xl font-semibold">Payment review ke liye bhej diya</h1>
          <p className="text-sm text-ink/60 mt-2">
            Hamari team payment verify kar rahi hai — approve hote hi aapko notify kar denge.
          </p>
        </div>
      </div>
    );
  }

  const styleFor = (i: number, total: number) => {
    const isPro = i === 1 && total >= 2;
    const isDiamond = i === total - 1 && total >= 3;
    if (isDiamond) return "bg-[#14111A] text-white shadow-cardHover";
    if (isPro) return "bg-plum-500 text-white shadow-cardHover scale-[1.03]";
    return "surface-card";
  };

  return (
    <div className="px-4 sm:px-6 py-10 max-w-5xl mx-auto">
      <div className="rounded-3xl bg-gradient-to-br from-rose-500 to-plum-500 p-8 text-center text-white mb-10">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold">Apna DilMil Plan Chuno ❤️</h1>
        <p className="text-white/80 mt-2 text-sm max-w-md mx-auto">
          Zyada visibility, zyada log discover karo, aur asli connections banao.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-6 mb-10">
        {plans.map((plan, i) => {
          const isPro = i === 1 && plans.length >= 2;
          const isCurrent = currentPlanName === plan.name;
          const selected = selectedPlan?.id === plan.id;
          return (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan)}
              className={`relative rounded-3xl p-6 text-left transition-all ${styleFor(i, plans.length)} ${selected ? "ring-2 ring-rose-300" : ""}`}
            >
              {isPro && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold-400 text-[#14111A] text-[10px] font-bold uppercase px-3 py-1 rounded-full">
                  Most Popular
                </span>
              )}
              {isCurrent && (
                <span className="absolute -top-3 right-4 bg-success text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full">
                  Current Plan
                </span>
              )}
              <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{plan.badge || plan.name}</p>
              <p className="font-display text-2xl font-semibold mt-1">{plan.name}</p>
              <p className="text-3xl font-semibold mt-2">
                Rs.{plan.price}{" "}
                <span className="text-sm font-normal opacity-60">
                  {plan.durationDays >= 3650 ? "/ Lifetime" : `/${plan.durationDays}d`}
                </span>
              </p>
              <ul className="mt-5 space-y-2 text-sm">
                {Object.entries(plan.features || {}).map(([k, v]) => (
                  <li key={k} className="flex items-start gap-2">
                    <span>✓</span> <span>{k}: {String(v)}</span>
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      {selectedPlan && (
        <div className="max-w-md mx-auto surface-card p-6 space-y-4">
          <p className="font-medium text-sm">Payment method chuno</p>
          <div className="grid grid-cols-2 gap-2">
            {methods.map((m) => (
              <button
                key={m.id}
                onClick={() => { setSelectedMethod(m); setError(null); }}
                className={`rounded-xl border px-3 py-2.5 text-sm text-left ${selectedMethod?.id === m.id ? "border-rose-400 bg-rose-50" : "border-black/10"}`}
              >
                {m.name}
              </button>
            ))}
          </div>

          {selectedMethod && (
            <div className="rounded-2xl border border-black/10 p-5 text-center space-y-3">
              {/* 1. Logo at the top, small */}
              {selectedMethod.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selectedMethod.logoUrl} alt={selectedMethod.name} className="h-10 mx-auto object-contain" />
              )}

              {/* 2. QR code */}
              {selectedMethod.qrCodeUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selectedMethod.qrCodeUrl} alt="Payment QR" className="h-44 w-44 mx-auto rounded-xl border border-black/5 object-contain" />
              )}

              {/* 3. Account title + number with copy button */}
              {selectedMethod.accountNumber && (
                <div>
                  {selectedMethod.accountTitle && <p className="text-xs text-ink/50">{selectedMethod.accountTitle}</p>}
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <p className="text-base font-semibold tracking-wide">{selectedMethod.accountNumber}</p>
                    <button
                      onClick={copyAccountNumber}
                      className="text-xs font-medium bg-rose-50 text-rose-600 rounded-full px-3 py-1"
                    >
                      {copied ? "Copied ✓" : "Copy"}
                    </button>
                  </div>
                </div>
              )}

              {selectedMethod.instructions && (
                <p className="text-xs text-ink/60 bg-black/[0.03] rounded-lg p-3 text-left">{selectedMethod.instructions}</p>
              )}
            </div>
          )}

          {selectedMethod && (
            <>
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

              {/* 4. Payment proof / screenshot upload */}
              <div>
                <label className="text-xs text-ink/50">Payment ka screenshot lagao</label>
                {proofPreview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={proofPreview} alt="Proof preview" className="mt-2 h-28 rounded-xl object-cover border border-black/10" />
                )}
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleProofSelect} className="mt-2 text-sm" />
              </div>

              <Input
                label="Note (optional)"
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              />

              {error && <p className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">{error}</p>}

              <Button className="w-full" onClick={submitPayment} loading={submitting} disabled={!form.txnRef}>
                Payment Submit Karo
              </Button>
            </>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 max-w-3xl mx-auto">
        {[
          ["📈", "Zyada Matches", "Chances badhao"],
          ["👁️", "Behtar Visibility", "Jaldi notice ho"],
          ["🎛️", "Advanced Filters", "Apni marzi ka dhoondo"],
          ["🎧", "Priority Support", "Hum hamesha ready hain"],
        ].map(([icon, title, desc]) => (
          <div key={title} className="surface-card p-4 text-center">
            <span className="text-xl">{icon}</span>
            <p className="text-xs font-semibold mt-2">{title}</p>
            <p className="text-[10px] text-ink/50 mt-0.5">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
