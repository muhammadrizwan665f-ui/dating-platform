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
  const [gender, setGender] = useState("FEMALE");
  const [ageMin, setAgeMin] = useState(21);
  const [ageMax, setAgeMax] = useState(32);
  const [cities, setCities] = useState<string[]>(["Lahore", "Islamabad", "Karachi"]);
  const [intentions, setIntentions] = useState<string[]>(INTENTIONS);
  const [countNoPhotos, setCountNoPhotos] = useState(20);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedPhotoUrls, setUploadedPhotoUrls] = useState<string[]>([]);
  const [uploadFailures, setUploadFailures] = useState(0);

  const [preview, setPreview] = useState<PreviewProfile[] | null>(null);
  const [previewCount, setPreviewCount] = useState(0);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [total, setTotal] = useState(0);
  const [profiles, setProfiles] = useState<DemoProfile[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Step 1: pick photo files (just stages them — nothing uploads yet).
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
    setUploadedPhotoUrls([]);
    setPreview(null);
  };

  // Step 2: one button uploads every photo, then immediately generates a
  // matching profile per photo (name/city/interests/bio all auto-filled) —
  // this is the combined "50 photos in, 50 ready profiles out" flow.
  const uploadAndPreview = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setUploadFailures(0);
    try {
      const formData = new FormData();
      selectedFiles.forEach((f) => formData.append("files", f));
      const res = await fetch("/api/admin/demo-profiles/bulk-photos", { method: "POST", body: formData });
      const data = await res.json();
      const urls = (data.results ?? []).filter((r: any) => r.url).map((r: any) => r.url as string);
      setUploadedPhotoUrls(urls);
      setUploadFailures((data.results ?? []).length - urls.length);
      if (urls.length === 0) {
        alert("No photos uploaded successfully — check the file types (JPEG/PNG/WEBP, max 8MB) and try again.");
        return;
      }
      await runPreview(urls);
    } finally {
      setUploading(false);
    }
  };

  const runPreview = async (photoUrls: string[]) => {
    setGeneratingPreview(true);
    try {
      const res = await fetch("/api/admin/demo-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoUrls: photoUrls.length ? photoUrls : undefined,
          count: photoUrls.length ? undefined : countNoPhotos,
          gender: gender === "MIXED" ? undefined : gender,
          ageMin, ageMax, cities, intentions,
          dryRun: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPreview(data.preview);
        setPreviewCount(data.count);
      } else {
        alert(data.error || "Failed to generate preview");
      }
    } finally {
      setGeneratingPreview(false);
    }
  };

  // Text-only preview (no photos yet) — for when the admin just wants
  // profiles with placeholder avatars, without uploading real photos.
  const generatePreviewNoPhotos = () => runPreview([]);

  const createProfiles = async () => {
    if (!confirm(`Create ${previewCount} demo profiles now? They'll be active and visible in Discover immediately.`)) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/demo-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoUrls: uploadedPhotoUrls.length ? uploadedPhotoUrls : undefined,
          count: uploadedPhotoUrls.length ? undefined : previewCount,
          gender: gender === "MIXED" ? undefined : gender,
          ageMin, ageMax, cities, intentions,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`${data.created} demo profiles created and are now active.`);
        setPreview(null);
        setSelectedFiles([]);
        setUploadedPhotoUrls([]);
        if (photoInputRef.current) photoInputRef.current.value = "";
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

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-2xl font-semibold mb-1">Bulk Profile Generator</h1>
      <p className="text-sm text-ink/50 mb-6">
        Upload real photos and get fully-active profiles in one step — name, city, bio, interests, and profession are
        all auto-filled. Marked internally as demo; never counted toward real user stats.
      </p>

      {/* Templates */}
      <div className="surface-card p-5 mb-4 space-y-4">
        <p className="text-sm font-medium">1. Set the profile template</p>
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
            <label className="block text-xs text-ink/50 mb-1">Count (if no photos uploaded)</label>
            <input type="number" min={1} max={1000} value={countNoPhotos} onChange={(e) => setCountNoPhotos(Number(e.target.value))} className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-xs text-ink/50 mb-1.5">Cities</label>
          <div className="flex flex-wrap gap-1.5">
            {ALL_CITIES.map((c) => (
              <button key={c} onClick={() => toggleCity(c)} className={`text-xs px-3 py-1.5 rounded-full ${cities.includes(c) ? "bg-rose-500 text-white" : "bg-black/5 text-ink/60"}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs text-ink/50 mb-1.5">Relationship Intent</label>
          <div className="flex flex-wrap gap-1.5">
            {INTENTIONS.map((i) => (
              <button key={i} onClick={() => toggleIntent(i)} className={`text-xs px-3 py-1.5 rounded-full ${intentions.includes(i) ? "bg-plum-500 text-white" : "bg-black/5 text-ink/60"}`}>
                {i.charAt(0) + i.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Photo upload — the easy combined flow */}
      <div className="surface-card p-5 mb-4">
        <p className="text-sm font-medium mb-1">2. Upload photos (one profile per photo)</p>
        <p className="text-xs text-ink/50 mb-3">
          Select up to 50+ photos at once. Each photo becomes one profile with an auto-generated name, city and
          interests matching your template above.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="rounded-xl border border-black/10 px-4 py-2 text-sm font-medium cursor-pointer">
            Choose Photos
            <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleFileSelect} className="hidden" />
          </label>
          {selectedFiles.length > 0 && <span className="text-xs text-ink/50">{selectedFiles.length} photo(s) selected</span>}
          <button
            onClick={uploadAndPreview}
            disabled={selectedFiles.length === 0 || uploading}
            className="rounded-xl bg-rose-500 hover:bg-rose-600 transition-colors text-white px-5 py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {uploading ? "Uploading & generating…" : `Generate ${selectedFiles.length || ""} Profiles from Photos`}
          </button>
        </div>
        {uploadFailures > 0 && <p className="text-xs text-danger mt-2">{uploadFailures} photo(s) failed to upload (wrong type or too large).</p>}

        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-black/5">
          <span className="text-xs text-ink/40">or, no photos yet —</span>
          <button onClick={generatePreviewNoPhotos} disabled={generatingPreview} className="text-xs font-medium text-plum-600">
            {generatingPreview ? "Generating…" : `Generate ${countNoPhotos} profiles with placeholder avatars`}
          </button>
        </div>
      </div>

      {preview && (
        <div className="surface-card p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium">Preview — {previewCount} profile(s) ready</p>
            <button
              onClick={createProfiles}
              disabled={creating}
              className="rounded-lg bg-success text-white px-4 py-2 text-xs font-medium disabled:opacity-50"
            >
              {creating ? "Creating…" : `3. Create ${previewCount} Profiles (make active)`}
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-96 overflow-y-auto">
            {preview.map((p, i) => (
              <div key={i} className="rounded-xl border border-black/5 p-2 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.photoUrl} alt="" className="h-16 w-16 rounded-full mx-auto mb-1 object-cover bg-rose-50" />
                <p className="text-[11px] font-medium truncate">{p.displayName}, {p.age}</p>
                <p className="text-[10px] text-ink/40 truncate">{p.city}</p>
                <p className="text-[9px] text-ink/30 truncate">{p.profession}</p>
              </div>
            ))}
          </div>
        </div>
      )}

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
                <img src={p.photos[0].url} alt={p.displayName} className="w-16 h-16 rounded-full mx-auto mb-2 object-cover bg-rose-50" />
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
