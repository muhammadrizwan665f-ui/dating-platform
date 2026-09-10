"use client";
import { useEffect, useState } from "react";

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
