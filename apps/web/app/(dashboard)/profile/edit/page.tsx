"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  photos: { id: string; url: string; isPrimary: boolean }[];
}

export default function EditProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [form, setForm] = useState({ bio: "", city: "", interests: [] as string[], interestInput: "", intention: "DATING", education: "", profession: "" });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
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
    if (file) setPhotoFile(file);
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
      setSaved(true);
      // Refresh so the new photo actually shows up in the gallery above.
      fetch("/api/profile").then((r) => r.json()).then((d) => d.profile && setProfile(d.profile));
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setSaveError("Something went wrong. Please check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!profile) return <p className="text-center py-20 text-sm text-ink/50">Loading…</p>;

  return (
    <main className="min-h-screen bg-base pb-24 px-4 pt-8 max-w-md mx-auto space-y-4">
      <h1 className="font-display text-2xl font-semibold">Edit Profile</h1>
      <p className="text-xs text-ink/50">{profile.completeness}% complete · Status: {profile.status.replace("_", " ")}</p>

      <div className="surface-card p-5 space-y-4">
        <div>
          <p className="text-xs text-ink/50 mb-2">Photos</p>
          <div className="flex flex-wrap gap-2 mb-2">
            {profile.photos.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={p.id} src={p.url} alt="" className="h-16 w-16 rounded-lg object-cover" />
            ))}
          </div>
          <input type="file" accept="image/*" onChange={handlePhoto} className="text-xs" />
          {photoFile && <p className="text-xs text-success mt-1">New photo ready to upload: {photoFile.name}</p>}
        </div>

        <Input label="City" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />

        <div>
          <label className="text-xs text-ink/50">Bio</label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            rows={3}
            maxLength={500}
            className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm mt-1"
          />
        </div>

        <div>
          <label className="text-xs text-ink/50">Looking for</label>
          <select
            value={form.intention}
            onChange={(e) => setForm((f) => ({ ...f, intention: e.target.value }))}
            className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm mt-1"
          >
            <option value="DATING">Dating</option>
            <option value="FRIENDSHIP">Friendship</option>
            <option value="RELATIONSHIP">Relationship</option>
            <option value="NOT_SURE">Not sure yet</option>
          </select>
        </div>

        <Input label="Profession" value={form.profession} onChange={(e) => setForm((f) => ({ ...f, profession: e.target.value }))} />
        <Input label="Education" value={form.education} onChange={(e) => setForm((f) => ({ ...f, education: e.target.value }))} />

        <div>
          <label className="text-xs text-ink/50">Interests</label>
          <div className="flex gap-2 mt-1">
            <input
              value={form.interestInput}
              onChange={(e) => setForm((f) => ({ ...f, interestInput: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addInterest())}
              placeholder="Add an interest…"
              className="flex-1 rounded-xl border border-black/10 px-3 py-2 text-sm"
            />
            <Button variant="ghost" onClick={addInterest}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {form.interests.map((i) => (
              <button key={i} onClick={() => removeInterest(i)} className="text-xs bg-rose-50 text-rose-600 px-2.5 py-1 rounded-full">
                {i} ×
              </button>
            ))}
          </div>
        </div>

        {saveError && <p className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">{saveError}</p>}
        <Button className="w-full" loading={saving || uploading} onClick={save}>
          {saved ? "Saved ✓" : "Save Profile"}
        </Button>
      </div>
    </main>
  );
}
