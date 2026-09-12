"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";

const STEP_LABELS = ["Basics", "Photo", "Bio", "Interests", "Preferences", "Review", "Membership", "Submit"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [rejectionNote, setRejectionNote] = useState<string | null>(null);
  const [profile, setProfile] = useState({
    bio: "",
    interests: [] as string[],
    interestInput: "",
    ageMin: 20,
    ageMax: 35,
    intention: "DATING",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);

  // Load whatever the user has already saved (bio/interests/photo) so
  // coming back here — after a refresh, a rejection, or navigating away
  // mid-flow — never shows a blank form and never asks for the same info
  // twice. If the profile is already submitted/approved, this isn't the
  // right place for them at all — send them to Edit Profile instead.
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

        setProfile((prev) => ({
          ...prev,
          bio: p.bio || "",
          interests: p.interests || [],
          intention: p.intention || "DATING",
        }));
        if (p.photos?.[0]?.url) setExistingPhotoUrl(p.photos[0].url);
        if (p.status === "REJECTED") {
          setRejectionNote("Your previous submission needed changes. Update the details below and resubmit.");
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  function next() {
    setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1));
  }
  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function addInterest() {
    const v = profile.interestInput.trim();
    if (v && !profile.interests.includes(v)) {
      setProfile((p) => ({ ...p, interests: [...p.interests, v], interestInput: "" }));
    }
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
      // 1. Upload photo (if selected) via server-proxied upload — no direct
      //    browser-to-R2 request, so no R2 CORS config needed.
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

      // 2. Save profile fields + submit for review.
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: profile.bio,
          interests: profile.interests,
          intention: profile.intention,
          preferences: { ageMin: profile.ageMin, ageMax: profile.ageMax },
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

      router.push("/membership");
    } catch (err) {
      setUploadError("Something went wrong. Please check your connection and try again.");
      setSaving(false);
    }
  }

  if (loading) return <p className="text-center py-20 text-sm text-ink/50">Loading…</p>;

  return (
    <main className="min-h-screen bg-base px-6 py-10 flex flex-col items-center">
      <div className="w-full max-w-md">
        {rejectionNote && (
          <div className="mb-4 rounded-xl bg-gold-400/10 border border-gold-400/30 px-4 py-3 text-sm text-gold-500">
            {rejectionNote}
          </div>
        )}
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm font-medium text-ink/60">
            Step {step + 1} / {STEP_LABELS.length}
          </span>
          <span className="text-sm text-rose-500">{STEP_LABELS[step]}</span>
        </div>
        <div className="h-1.5 bg-black/5 rounded-full mb-8 overflow-hidden">
          <div
            className="h-full bg-rose-500 transition-all"
            style={{ width: `${((step + 1) / STEP_LABELS.length) * 100}%` }}
          />
        </div>

        <div className="surface-card p-6 min-h-[280px]">
          {step === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-ink/60">Your basic details were captured at registration. You can refine your bio next.</p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">Add a profile photo</p>
              {photoPreview || existingPhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoPreview || existingPhotoUrl || ""} alt="Preview" className="w-32 h-32 rounded-2xl object-cover" />
              ) : (
                <div className="w-32 h-32 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-300 text-3xl">+</div>
              )}
              {existingPhotoUrl && !photoFile && (
                <p className="text-xs text-ink/40">You already have a photo — pick a new one to replace it, or continue.</p>
              )}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <label className="text-sm font-medium">About me</label>
              <textarea
                className="w-full rounded-xl border border-black/10 px-3.5 py-2.5 text-sm h-32"
                maxLength={500}
                value={profile.bio}
                onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                placeholder="Tell people a little about yourself..."
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <label className="text-sm font-medium">Interests</label>
              <div className="flex gap-2">
                <Input
                  value={profile.interestInput}
                  onChange={(e) => setProfile((p) => ({ ...p, interestInput: e.target.value }))}
                  placeholder="e.g. Travel"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addInterest())}
                />
                <Button type="button" onClick={addInterest}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((i) => (
                  <span key={i} className="bg-rose-50 text-rose-600 text-xs rounded-full px-3 py-1">
                    {i}
                  </span>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <label className="text-sm font-medium">Relationship intention</label>
              <select
                className="w-full rounded-xl border border-black/10 px-3.5 py-2.5 text-sm"
                value={profile.intention}
                onChange={(e) => setProfile((p) => ({ ...p, intention: e.target.value }))}
              >
                <option value="DATING">Dating</option>
                <option value="FRIENDSHIP">Friendship</option>
                <option value="RELATIONSHIP">Relationship</option>
                <option value="NOT_SURE">Not sure yet</option>
              </select>
              <label className="text-sm font-medium">Preferred age range</label>
              <div className="flex items-center gap-3">
                <Input type="number" value={profile.ageMin} onChange={(e) => setProfile((p) => ({ ...p, ageMin: Number(e.target.value) }))} />
                <span className="text-ink/40">to</span>
                <Input type="number" value={profile.ageMax} onChange={(e) => setProfile((p) => ({ ...p, ageMax: Number(e.target.value) }))} />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-2 text-sm">
              <p className="font-medium">Review your profile</p>
              <p><span className="text-ink/50">Bio:</span> {profile.bio || "—"}</p>
              <p><span className="text-ink/50">Interests:</span> {profile.interests.join(", ") || "—"}</p>
              <p><span className="text-ink/50">Looking for:</span> {profile.intention}</p>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-3 text-sm">
              <p>Membership selection and payment happen on the next screen once your profile draft is saved.</p>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-3 text-sm">
              <p>Ready to submit your profile for admin review. You&apos;ll be notified once it&apos;s approved.</p>
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
