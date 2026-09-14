"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";

const STEP_LABELS = ["Photo", "Plan aur Payment"];

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

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [rejectionNote, setRejectionNote] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);

  const [plans, setPlans] = useState<Plan[]>([]);
  const [methods, setMethods] = useState<Method[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<Method | null>(null);
  const [copied, setCopied] = useState(false);
  const [txnRef, setTxnRef] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => {
        if (r.status === 401) {
          router.replace("/login?next=/onboarding");
          throw new Error("not authenticated");
        }
        return r.json();
      })
      .then((d) => {
        const p = d.profile;
        if (!p) return;
        if (p.status === "APPROVED" || p.status === "SUBMITTED" || p.status === "UNDER_REVIEW") {
          router.replace("/profile/edit");
          return;
        }
        if (p.photos?.[0]?.url) setExistingPhotoUrl(p.photos[0].url);
        if (p.status === "REJECTED") {
          setRejectionNote("Aapki pichli submission mein kuch theek karna tha. Neeche update karo aur dobara submit karo.");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    fetch("/api/membership/plans").then((r) => r.json()).then((d) => setPlans(d.plans ?? []));
    fetch("/api/payments/methods").then((r) => r.json()).then((d) => setMethods(d.methods ?? []));
  }, [router]);

  function next() {
    setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1));
  }
  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

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

  // Payment is mandatory: the profile only becomes SUBMITTED (and lands in
  // admin's review queue) once the payment itself has been submitted, not
  // just once a plan was picked. Nothing here lets the user reach the main
  // app — DashboardLayout also redirects a DRAFT profile straight back here.
  async function submitPaymentAndProfile() {
    if (!selectedPlan || !selectedMethod) {
      setUploadError("Pehle ek plan aur payment method chuno.");
      return;
    }
    if (!txnRef.trim()) {
      setUploadError("Transaction / reference ID zaroori hai.");
      return;
    }
    setSaving(true);
    setUploadError(null);
    try {
      // 1. Profile photo, if selected.
      let photoKey: string | null = null;
      if (photoFile) {
        const formData = new FormData();
        formData.append("file", photoFile);
        const uploadRes = await fetch("/api/profile/photos/upload", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          setUploadError(uploadData.error || "Photo upload fail ho gaya. Dusri photo try karo.");
          setSaving(false);
          return;
        }
        photoKey = uploadData.key;
      }

      // 2. Payment proof screenshot.
      let proofUrl: string | undefined;
      if (proofFile) {
        const formData = new FormData();
        formData.append("file", proofFile);
        const uploadRes = await fetch("/api/profile/photos/upload", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          setUploadError(uploadData.error || "Screenshot upload fail ho gaya.");
          setSaving(false);
          return;
        }
        proofUrl = uploadData.url;
      }

      // 3. Submit the payment for admin review.
      const paymentRes = await fetch("/api/payments/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlan.id,
          methodId: selectedMethod.id,
          amount: selectedPlan.price,
          txnRef,
          paymentDate: paymentDate || new Date().toISOString(),
          proofUrl,
        }),
      });
      if (!paymentRes.ok) {
        const data = await paymentRes.json().catch(() => ({}));
        setUploadError(data.error ? JSON.stringify(data.error) : "Payment submit nahi ho saka. Dobara try karo.");
        setSaving(false);
        return;
      }

      // 4. Only now does the profile move to SUBMITTED (admin review queue).
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intention: "DATING",
          preferences: { ageMin: 20, ageMax: 40 },
          photoKey,
          submit: true,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setUploadError(data.error ? JSON.stringify(data.error) : "Profile submit nahi ho saki. Dobara try karo.");
        setSaving(false);
        return;
      }

      router.push("/onboarding/pending");
    } catch (err) {
      setUploadError("Kuch ghalat ho gaya. Apna connection check karke dobara try karo.");
      setSaving(false);
    }
  }

  if (loading) return <p className="text-center py-20 text-sm text-ink/50">Loading…</p>;

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 via-base to-plum-500/10 px-6 py-10 flex flex-col items-center relative overflow-hidden">
      <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-rose-200/30 blur-3xl" />

      <div className="relative w-full max-w-md">
        <p className="font-display text-xl font-semibold text-rose-500 text-center mb-6">💗 DilMil</p>
        {rejectionNote && (
          <div className="mb-4 rounded-xl bg-gold-400/10 border border-gold-400/30 px-4 py-3 text-sm text-gold-500">
            {rejectionNote}
          </div>
        )}
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm font-medium text-ink/60">
            Step {step + 1} / {STEP_LABELS.length}
          </span>
          <span className="text-sm text-rose-500 font-medium">{STEP_LABELS[step]}</span>
        </div>
        <div className="h-1.5 bg-black/5 rounded-full mb-8 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-rose-400 to-plum-500 transition-all"
            style={{ width: `${((step + 1) / STEP_LABELS.length) * 100}%` }}
          />
        </div>

        <div className="surface-card p-6 shadow-cardHover">
          {step === 0 && (
            <div className="space-y-3 text-center">
              <p className="text-sm font-medium">Profile photo lagao</p>
              {photoPreview || existingPhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoPreview || existingPhotoUrl || ""} alt="Preview" className="w-32 h-32 rounded-2xl object-cover mx-auto" />
              ) : (
                <div className="w-32 h-32 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-300 text-3xl mx-auto">+</div>
              )}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} className="mx-auto" />
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-center">Apna plan chuno ❤️</p>
              <div className="space-y-2">
                {plans.map((plan, i) => {
                  const isPro = i === 1 && plans.length >= 2;
                  const selected = selectedPlan?.id === plan.id;
                  return (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan)}
                      className={`w-full text-left rounded-2xl p-4 border-2 transition-colors ${selected ? "border-rose-500 bg-rose-50" : "border-black/10"}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold flex items-center gap-2">
                            {plan.name}
                            {isPro && <span className="text-[9px] font-bold uppercase bg-gold-400 text-[#14111A] px-2 py-0.5 rounded-full">Popular</span>}
                          </p>
                          <p className="text-xs text-ink/50 mt-0.5">
                            {plan.durationDays >= 3650 ? "Lifetime access" : `${plan.durationDays} days`}
                          </p>
                        </div>
                        <p className="text-lg font-semibold">Rs.{plan.price}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedPlan && (
                <>
                  <p className="text-sm font-medium pt-2">Payment method chuno</p>
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
                </>
              )}

              {selectedMethod && (
                <div className="rounded-2xl border border-black/10 p-5 text-center space-y-3">
                  {selectedMethod.logoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selectedMethod.logoUrl} alt={selectedMethod.name} className="h-10 mx-auto object-contain" />
                  )}
                  {selectedMethod.qrCodeUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selectedMethod.qrCodeUrl} alt="Payment QR" className="h-40 w-40 mx-auto rounded-xl border border-black/5 object-contain" />
                  )}
                  {selectedMethod.accountNumber && (
                    <div>
                      {selectedMethod.accountTitle && <p className="text-xs text-ink/50">{selectedMethod.accountTitle}</p>}
                      <div className="flex items-center justify-center gap-2 mt-1">
                        <p className="text-base font-semibold tracking-wide">{selectedMethod.accountNumber}</p>
                        <button onClick={copyAccountNumber} className="text-xs font-medium bg-rose-50 text-rose-600 rounded-full px-3 py-1">
                          {copied ? "Copied ✓" : "Copy"}
                        </button>
                      </div>
                    </div>
                  )}
                  {selectedMethod.instructions && (
                    <p className="text-xs text-ink/60 bg-black/[0.03] rounded-lg p-3 text-left">{selectedMethod.instructions}</p>
                  )}

                  <Input label="Transaction / reference ID" required value={txnRef} onChange={(e) => setTxnRef(e.target.value)} />
                  <Input label="Payment date" type="date" required value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />

                  <div className="text-left">
                    <label className="text-xs text-ink/50">Payment ka screenshot lagao (zaroori hai)</label>
                    {proofPreview && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={proofPreview} alt="Proof preview" className="mt-2 h-28 rounded-xl object-cover border border-black/10" />
                    )}
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleProofSelect} className="mt-2 text-sm" />
                  </div>
                </div>
              )}

              {uploadError && (
                <p className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">{uploadError}</p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-6">
          <Button variant="ghost" onClick={back} disabled={step === 0}>
            Back
          </Button>
          {step < STEP_LABELS.length - 1 ? (
            <Button onClick={next}>Continue</Button>
          ) : (
            <Button onClick={submitPaymentAndProfile} loading={saving} disabled={!selectedMethod || !txnRef.trim() || !proofFile}>
              Payment Submit Karo
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
