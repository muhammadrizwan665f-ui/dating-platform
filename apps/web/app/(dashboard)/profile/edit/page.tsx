"use client";
import { useEffect, useState } from "react";
import { Input } from "../../../../components/ui/Input";
import { Button } from "../../../../components/ui/Button";

interface ProfileData {
  displayName: string;
  bio: string | null;
  city: string;
  interests: string[];
  intention: string;
  education: string | null;
  profession: string | null;
  completeness: number;
  status: string;
  verified: boolean;
  photos: { id: string; url: string; isPrimary: boolean }[];
}

export default function EditProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [form, setForm] = useState({ bio: "", city: "", interests: [] as string[], interestInput: "", intention: "DATING", education: "", profession: "" });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        const p = d.profile;
        if (!p) return;
        setProfile(p);
        setForm({
          bio: p.bio || "",
          city: p.city || "",
          interests: p.interests || [],
          interestInput: "",
          intention: p.intention || "DATING",
          education: p.education || "",
          profession: p.profession || "",
        });
      });
  }, []);

  const addInterest = () => {
    const v = form.interestInput.trim();
    if (v && !form.interests.includes(v) && form.interests.length < 15) {
      setForm((f) => ({ ...f, interests: [...f.interests, v], interestInput: "" }));
    }
  };
  const removeInterest = (i: string) => setForm((f) => ({ ...f, interests: f.interests.filter((x) => x !== i) }));

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const save = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      let photoKey: string | null = null;
      if (photoFile) {
        setUploading(true);
        const formData = new FormData();
        formData.append("file", photoFile);
        const uploadRes = await fetch("/api/profile/photos/upload", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        setUploading(false);
        if (!uploadRes.ok) {
          setSaveError(uploadData.error || "Photo upload failed. Please try a different photo.");
          setSaving(false);
          return;
        }
        photoKey = uploadData.key;
      }

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: form.bio,
          city: form.city,
          interests: form.interests,
          intention: form.intention,
          education: form.education,
          profession: form.profession,
          photoKey,
          submit: true,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSaveError(data.error ? JSON.stringify(data.error) : "Couldn't save your profile. Please try again.");
        setSaving(false);
        return;
      }
      setPhotoFile(null);
      setPhotoPreview(null);
      setSaved(true);
      fetch("/api/profile").then((r) => r.json()).then((d) => d.profile && setProfile(d.profile));
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setSaveError("Something went wrong. Please check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!profile) return <p className="text-center py-20 text-sm text-ink/50">Loading…</p>;

  const heroPhoto = photoPreview || profile.photos.find((p) => p.isPrimary)?.url || profile.photos[0]?.url;

  return (
    <div className="px-4 sm:px-6 py-8 max-w-5xl mx-auto grid lg:grid-cols-[300px_1fr] gap-6">
      {/* LEFT: preview card */}
      <aside className="lg:sticky lg:top-20 h-fit">
        <div className="surface-card overflow-hidden">
          <div className="relative aspect-[4/5] bg-rose-50">
            {heroPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={heroPhoto} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-rose-300 text-4xl font-display">
                {profile.displayName.charAt(0)}
              </div>
            )}
            <label className="absolute bottom-3 right-3 bg-white rounded-full px-3 py-1.5 text-xs font-medium shadow cursor-pointer">
              📷 Change Photo
              <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
            </label>
          </div>
          <div className="p-4">
            <p className="font-semibold text-sm flex items-center gap-1">
              {profile.displayName} {profile.verified && <span className="text-success text-xs">✓</span>}
            </p>
            <p className="text-xs text-ink/50">{profile.status.replace("_", " ")}</p>
            <div className="mt-3">
              <div className="flex justify-between text-[10px] text-ink/50 mb-1">
                <span>Profile Completion</span>
                <span>{profile.completeness}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-black/5 overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: `${profile.completeness}%` }} />
              </div>
              {profile.completeness < 100 && (
                <p className="text-[10px] text-ink/40 mt-1.5">Complete your profile to get more visibility.</p>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* RIGHT: sectioned form */}
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">Edit Profile</h1>
          <p className="text-sm text-ink/50">Update your information and let others know more about you.</p>
        </div>

        {photoFile && (
          <p className="text-xs text-success bg-success/10 rounded-lg px-3 py-2">
            New photo ready — click &quot;Save Changes&quot; below to upload it.
          </p>
        )}

        <div className="surface-card p-5 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-500">About You</p>
          <Input label="City" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
          <div>
            <label className="text-xs text-ink/50">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              rows={3}
              maxLength={500}
              className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-rose-200"
            />
          </div>
          <div>
            <label className="text-xs text-ink/50">Relationship Intention</label>
            <select
              value={form.intention}
              onChange={(e) => setForm((f) => ({ ...f, intention: e.target.value }))}
              className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-rose-200"
            >
              <option value="DATING">Dating</option>
              <option value="FRIENDSHIP">Friendship</option>
              <option value="RELATIONSHIP">Serious Relationship</option>
              <option value="NOT_SURE">Not sure yet</option>
            </select>
          </div>
        </div>

        <div className="surface-card p-5 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-500">About Me</p>
          <Input label="Profession" value={form.profession} onChange={(e) => setForm((f) => ({ ...f, profession: e.target.value }))} />
          <Input label="Education" value={form.education} onChange={(e) => setForm((f) => ({ ...f, education: e.target.value }))} />
        </div>

        <div className="surface-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-500 mb-3">Interests</p>
          <div className="flex gap-2">
            <input
              value={form.interestInput}
              onChange={(e) => setForm((f) => ({ ...f, interestInput: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addInterest())}
              placeholder="Add an interest…"
              className="flex-1 rounded-xl border border-black/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
            />
            <Button variant="ghost" onClick={addInterest}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {form.interests.length === 0 && <p className="text-xs text-ink/40">No interests added yet.</p>}
            {form.interests.map((i) => (
              <button key={i} onClick={() => removeInterest(i)} className="text-xs bg-rose-50 text-rose-600 px-2.5 py-1 rounded-full hover:bg-rose-100 transition-colors">
                {i} ×
              </button>
            ))}
          </div>
        </div>

        {saveError && <p className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">{saveError}</p>}
        <div className="flex gap-3">
          <Button className="flex-1" loading={saving || uploading} onClick={save}>
            {saved ? "Saved ✓" : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
