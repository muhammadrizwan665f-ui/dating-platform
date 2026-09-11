"use client";
import { useEffect, useState, useRef } from "react";

type DemoProfile = {
  id: string;
  displayName: string;
  city: string;
  gender: string;
  photos: { url: string }[];
};

export default function AdminDemoProfilesPage() {
  const [count, setCount] = useState(20);
  const [gender, setGender] = useState("MIXED");
  const [generating, setGenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [total, setTotal] = useState(0);
  const [profiles, setProfiles] = useState<DemoProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const [csvText, setCsvText] = useState("");
  const [csvPreview, setCsvPreview] = useState<any>(null);
  const [importing, setImporting] = useState(false);

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

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/demo-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count, gender: gender === "MIXED" ? undefined : gender }),
      });
      const data = await res.json();
      if (data.success) load();
      else alert(data.error || "Failed to generate");
    } finally {
      setGenerating(false);
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

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      setCsvText(text);
      previewCsv(text);
    };
    reader.readAsText(file);
  };

  const previewCsv = async (text: string) => {
    const res = await fetch("/api/admin/demo-profiles/import-csv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv: text, dryRun: true }),
    });
    setCsvPreview(await res.json());
  };

  const confirmImport = async () => {
    setImporting(true);
    try {
      const res = await fetch("/api/admin/demo-profiles/import-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: csvText, dryRun: false }),
      });
      const data = await res.json();
      alert(`Imported ${data.successCount} of ${data.totalRows} rows.${data.failedCount ? ` ${data.failedCount} failed.` : ""}`);
      setCsvPreview(null);
      setCsvText("");
      if (fileRef.current) fileRef.current.value = "";
      load();
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-semibold mb-1">Demo Profiles</h1>
      <p className="text-sm text-ink/50 mb-6">
        Generate placeholder profiles (synthetic avatars, clearly marked internally as demo) to populate Discover for
        testing. They never count toward real user stats.
      </p>

      <div className="surface-card p-5 mb-6">
        <p className="text-sm font-medium mb-3">Generate new demo profiles</p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-ink/50 mb-1">How many</label>
            <input
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-24 rounded-lg border border-black/10 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-ink/50 mb-1">Gender mix</label>
            <select value={gender} onChange={(e) => setGender(e.target.value)} className="rounded-lg border border-black/10 px-3 py-2 text-sm">
              <option value="MIXED">Mixed</option>
              <option value="MALE">Male only</option>
              <option value="FEMALE">Female only</option>
            </select>
          </div>
          <button
            onClick={generate}
            disabled={generating}
            className="rounded-lg bg-rose-500 text-white px-5 py-2 text-sm font-medium disabled:opacity-50"
          >
            {generating ? "Generating…" : "Generate"}
          </button>
        </div>
      </div>

      <div className="surface-card p-5 mb-6">
        <p className="text-sm font-medium mb-1">Bulk import via CSV</p>
        <p className="text-xs text-ink/50 mb-3">
          Columns: name, age, gender, city, bio, interests, relationship_intention, profile_photo, status
        </p>
        <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleFile} className="text-xs" />
        {csvPreview && (
          <div className="mt-4">
            {csvPreview.error ? (
              <p className="text-xs text-danger">{csvPreview.error}</p>
            ) : (
              <>
                <p className="text-xs text-ink/60 mb-2">
                  {csvPreview.totalRows} rows found — {csvPreview.successCount} valid, {csvPreview.failedCount} with errors.
                </p>
                {csvPreview.errors?.length > 0 && (
                  <ul className="text-xs text-danger mb-2 list-disc pl-4">
                    {csvPreview.errors.map((e: string, i: number) => <li key={i}>{e}</li>)}
                  </ul>
                )}
                <button
                  onClick={confirmImport}
                  disabled={importing || csvPreview.successCount === 0}
                  className="rounded-lg bg-rose-500 text-white px-4 py-2 text-xs font-medium disabled:opacity-50"
                >
                  {importing ? "Importing…" : `Import ${csvPreview.successCount} profiles`}
                </button>
              </>
            )}
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
