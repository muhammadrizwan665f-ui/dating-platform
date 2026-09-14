"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../../components/ui/Button";

const STEP_LABELS = ["Photo", "Plans"];

interface Plan {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  badge?: string | null;
  features: Record<string, unknown>;
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
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // Load whatever the user has already saved (photo) so coming back here —
  // after a refresh, a rejection, or navigating away mid-flow — never asks
  // for the same info twice. If already submitted/approved, this isn't the
  // right place for them — send them to Edit Profile instead.
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        const p = d.profile;
        if (!p) return;
        if (p.status === "APPROVED" || p.status === "SUBMITTED" || p.status === "UNDER_REVIEW") {
          router.replace("/profile/edit");
          return;
        }
        if (p.photos?.[0]?.url) setExistingPhotoUrl(p.photos[0].url);
        if (p.status === "REJECTED") {
          setRejectionNote("Your previous submission needed changes. Update your photo below and resubmit.");
        }
      })
      .finally(() => setLoading(false));
    fetch("/api/membership/plans")
      .then((r) => r.json())
      .then((d) => setPlans(d.plans ?? []));
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

  async function submitForApproval() {
    setSaving(true);
    setUploadError(null);
    try {
      let photoKey: string | null = null;
      if (photoFile) {
        const formData = new FormData();
        formData.append("file", photoFile);
        const uploadRes = await fetch("/api/profile/photos/upload", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          setUploadError(uploadData.error || "Photo upload failed. Please try a different photo.");
          setSaving(false);
          return;
        }
        photoKey = uploadData.key;
      }

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
        setUploadError(data.error ? JSON.stringify(data.error) : "Couldn't submit your profile. Please try again.");
        setSaving(false);
        return;
      }

      router.push(selectedPlan ? `/membership?plan=${selectedPlan}` : "/membership");
    } catch (err) {
      setUploadError("Something went wrong. Please check your connection and try again.");
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

        <div className="surface-card p-6 min-h-[280px] shadow-cardHover">
          {step === 0 && (
            <div className="space-y-3 text-center">
              <p className="text-sm font-medium">Add a profile photo</p>
              {photoPreview || existingPhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoPreview || existingPhotoUrl || ""} alt="Preview" className="w-32 h-32 rounded-2xl object-cover mx-auto" />
              ) : (
                <div className="w-32 h-32 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-300 text-3xl mx-auto">+</div>
              )}
              {existingPhotoUrl && !photoFile && (
                <p className="text-xs text-ink/40">Aapki pehle se photo hai — nayi choose karo replace karne ke liye, ya aage badho.</p>
              )}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} className="mx-auto" />
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-center mb-3">Apna plan chuno ❤️</p>
              <div className="space-y-2">
                {plans.map((plan, i) => {
                  const isPro = i === 1 && plans.length >= 2;
                  const selected = selectedPlan === plan.id;
                  return (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`w-full text-left rounded-2xl p-4 border-2 transition-colors ${
                        selected ? "border-rose-500 bg-rose-50" : "border-black/10"
                      }`}
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
              <p className="text-xs text-ink/40 text-center pt-1">
                Payment agle screen pe hoga — abhi sirf profile submit karo.
              </p>
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
            <Button onClick={submitForApproval} loading={saving}>
              Submit for Approval
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
