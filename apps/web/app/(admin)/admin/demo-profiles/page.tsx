"use client";
import { useEffect, useRef, useState } from "react";

type DemoProfile = {
  id: string;
  displayName: string;
  city: string;
  gender: string;
  photos: { url: string }[];
};
type PreviewProfile = {
  displayName: string;
  gender: string;
  age: number;
  city: string;
  profession: string;
  intention: string;
  interests: string[];
  photoUrl: string;
};

const ALL_CITIES = ["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Quetta", "Sialkot", "Gujranwala", "Hyderabad"];
const INTENTIONS = ["DATING", "FRIENDSHIP", "RELATIONSHIP"];

export default function AdminDemoProfilesPage() {
  const [count, setCount] = useState(100);
  const [gender, setGender] = useState("FEMALE");
  const [ageMin, setAgeMin] = useState(21);
  const [ageMax, setAgeMax] = useState(32);
  const [cities, setCities] = useState<string[]>(["Lahore", "Islamabad", "Karachi"]);
  const [intentions, setIntentions] = useState<string[]>(INTENTIONS);

  const [preview, setPreview] = useState<PreviewProfile[] | null>(null);
  const [previewCount, setPreviewCount] = useState(0);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [total, setTotal] = useState(0);
  const [profiles, setProfiles] = useState<DemoProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const allGeneratedRef = useRef<PreviewProfile[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [uploadedPhotos, setUploadedPhotos] = useState<{ name: string; url?: string; error?: string }[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const load = () => {
    fetch("/api/admin/demo-profiles")
      .then((r) => r.json())
      .then((d) => {
        setTotal(d.count ?? 0);
        setProfiles(d.profiles ?? []);
      })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const toggleCity = (c: string) => setCities((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  const toggleIntent = (i: string) => setIntentions((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));

  const generatePreview = async () => {
    setGeneratingPreview(true);
    try {
      const res = await fetch("/api/admin/demo-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count, gender: gender === "MIXED" ? undefined : gender, ageMin, ageMax, cities, intentions, dryRun: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPreview(data.preview);
        setPreviewCount(data.count);
        allGeneratedRef.current = data.all;
      } else {
        alert(data.error || "Failed to generate preview");
      }
    } finally {
      setGeneratingPreview(false);
    }
  };

  const createProfiles = async () => {
    if (!confirm(`Create ${previewCount} demo profiles? This will write to the database.`)) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/demo-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count: previewCount, gender: gender === "MIXED" ? undefined : gender, ageMin, ageMax, cities, intentions,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`${data.created} demo profiles created successfully.`);
        setPreview(null);
        load();
      } else {
        alert(data.error || "Failed to create");
      }
    } finally {
      setCreating(false);
    }
  };

  const deleteAll = async () => {
    if (!confirm(`Delete all ${total} demo profiles? This can't be undone.`)) return;
    setDeleting(true);
    try {
      await fetch("/api/admin/demo-profiles", { method: "DELETE" });
      load();
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkPhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadingPhotos(true);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));
      const res = await fetch("/api/admin/demo-profiles/bulk-photos", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) setUploadedPhotos(data.results);
      else alert(data.error);
    } finally {
      setUploadingPhotos(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const autoAssignPhotos = async () => {
    const validPhotos = uploadedPhotos.filter((p) => p.url).map((p) => p.url as string);
    if (validPhotos.length === 0) return;
    // Only assign to profiles that don't already have a real (non-Dicebear) photo.
    const targets = profiles.filter((p) => !p.photos[0]?.url || p.photos[0].url.includes("dicebear.com")).slice(0, validPhotos.length);
    if (targets.length === 0) {
      alert("No demo profiles need a photo right now.");
      return;
    }
    setAssigning(true);
    try {
      const assignments = targets.map((t, i) => ({ profileId: t.id, photoUrl: validPhotos[i] }));
      const res = await fetch("/api/admin/demo-profiles/assign-photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignments }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`${data.updated} profiles updated with new photos.`);
        setUploadedPhotos([]);
        load();
      } else {
        alert(data.error);
      }
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-2xl font-semibold mb-1">Demo Profile Generator</h1>
      <p className="text-sm text-ink/50 mb-6">
        Every field is auto-filled — only the photo is synthetic (illustrated avatar). Clearly marked internally as
        demo; never counted toward real user stats.
      </p>

      <div className="surface-card p-5 mb-6 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-ink/50 mb-1">Gender</label>
            <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm">
              <option value="MIXED">Mixed</option>
              <option value="FEMALE">Female</option>
              <option value="MALE">Male</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-ink/50 mb-1">Age Min</label>
            <input type="number" min={18} max={65} value={ageMin} onChange={(e) => setAgeMin(Number(e.target.value))} className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-ink/50 mb-1">Age Max</label>
            <input type="number" min={18} max={65} value={ageMax} onChange={(e) => setAgeMax(Number(e.target.value))} className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-ink/50 mb-1">Number of Profiles</label>
            <input type="number" min={1} max={1000} value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
          </div>
        </div>

        <div>
          <label className="block text-xs text-ink/50 mb-1.5">Cities</label>
          <div className="flex flex-wrap gap-1.5">
            {ALL_CITIES.map((c) => (
              <button
                key={c}
                onClick={() => toggleCity(c)}
                className={`text-xs px-3 py-1.5 rounded-full ${cities.includes(c) ? "bg-rose-500 text-white" : "bg-black/5 text-ink/60"}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-ink/50 mb-1.5">Relationship Intent</label>
          <div className="flex flex-wrap gap-1.5">
            {INTENTIONS.map((i) => (
              <button
                key={i}
                onClick={() => toggleIntent(i)}
                className={`text-xs px-3 py-1.5 rounded-full ${intentions.includes(i) ? "bg-plum-500 text-white" : "bg-black/5 text-ink/60"}`}
              >
                {i.charAt(0) + i.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={generatePreview}
          disabled={generatingPreview}
          className="rounded-xl bg-rose-500 hover:bg-rose-600 transition-colors text-white px-5 py-2.5 text-sm font-medium disabled:opacity-50"
        >
          {generatingPreview ? "Generating…" : "Generate Preview"}
        </button>
      </div>

      {preview && (
        <div className="surface-card p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium">Preview ({previewCount} profiles — showing first {preview.length})</p>
            <div className="flex gap-2">
              <button onClick={generatePreview} className="text-xs font-medium text-plum-600">Generate Again</button>
              <button
                onClick={createProfiles}
                disabled={creating}
                className="rounded-lg bg-success text-white px-4 py-2 text-xs font-medium disabled:opacity-50"
              >
                {creating ? "Creating…" : `Create ${previewCount} Profiles`}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-96 overflow-y-auto">
            {preview.map((p, i) => (
              <div key={i} className="rounded-xl border border-black/5 p-2 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.photoUrl} alt="" className="h-14 w-14 rounded-full mx-auto mb-1 bg-rose-50" />
                <p className="text-[11px] font-medium truncate">{p.displayName}, {p.age}</p>
                <p className="text-[10px] text-ink/40 truncate">{p.city}</p>
                <p className="text-[9px] text-ink/30 truncate">{p.profession}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="surface-card p-5 mb-6">
        <p className="text-sm font-medium mb-1">Upload Photos in Bulk</p>
        <p className="text-xs text-ink/50 mb-3">
          Upload real photo files to replace the synthetic avatars — they'll auto-assign in order to demo profiles
          that still need one.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="rounded-xl border border-black/10 px-4 py-2 text-sm font-medium cursor-pointer">
            {uploadingPhotos ? "Uploading…" : "Choose Photos"}
            <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleBulkPhotoSelect} className="hidden" disabled={uploadingPhotos} />
          </label>
          {uploadedPhotos.length > 0 && (
            <>
              <span className="text-xs text-ink/50">
                {uploadedPhotos.filter((p) => p.url).length} uploaded, {uploadedPhotos.filter((p) => p.error).length} failed
              </span>
              <button
                onClick={autoAssignPhotos}
                disabled={assigning}
                className="rounded-xl bg-success text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                {assigning ? "Assigning…" : "Auto Assign"}
              </button>
            </>
          )}
        </div>
        {uploadedPhotos.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {uploadedPhotos.map((p, i) => (
              <div key={i} className="relative">
                {p.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.url} alt="" className="h-14 w-14 rounded-lg object-cover" />
                ) : (
                  <div className="h-14 w-14 rounded-lg bg-danger/10 flex items-center justify-center text-danger text-[9px] text-center p-1">
                    {p.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium">{total} demo profile(s) currently active</p>
        {total > 0 && (
          <button onClick={deleteAll} disabled={deleting} className="text-xs font-medium text-danger disabled:opacity-50">
            {deleting ? "Deleting…" : "Delete all demo profiles"}
          </button>
        )}
      </div>

      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {profiles.map((p) => (
            <div key={p.id} className="surface-card p-3 text-center">
              {p.photos[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.photos[0].url} alt={p.displayName} className="w-16 h-16 rounded-full mx-auto mb-2 bg-rose-50" />
              )}
              <p className="text-xs font-medium truncate">{p.displayName}</p>
              <p className="text-[10px] text-ink/40">{p.city}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
