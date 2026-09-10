"use client";
import { useEffect, useState } from "react";

type ThemeRow = { id: string; name: string; isEnabled: boolean; isDefault: boolean; sortOrder: number };

const SWATCHES: Record<string, [string, string]> = {
  "rose-romance": ["#F43F5E", "#8B5CF6"],
  "cherry-love": ["#D6362A", "#C2410C"],
  "blush-dream": ["#EC5C8E", "#B794F6"],
  "midnight-love": ["#14111A", "#F43F5E"],
  "sunset-hearts": ["#FF6B35", "#EC4899"],
  "lavender-love": ["#8B5CF6", "#C026D3"],
  "sweet-candy": ["#FF3D9A", "#38BDF8"],
  "royal-romance": ["#9333EA", "#D97706"],
  "emerald-romance": ["#10B981", "#F43F5E"],
  "neon-love": ["#0A0A12", "#FF0080"],
};

export default function AdminThemesPage() {
  const [themes, setThemes] = useState<ThemeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const load = () => {
    fetch("/api/admin/themes")
      .then((r) => r.json())
      .then((d) => setThemes(d.themes ?? []))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const toggle = async (id: string, isEnabled: boolean) => {
    const res = await fetch("/api/admin/themes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isEnabled }),
    });
    if (res.ok) load();
    else alert((await res.json()).error);
  };

  const setDefault = async (id: string) => {
    const res = await fetch("/api/admin/themes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, setDefault: true }),
    });
    if (res.ok) load();
    else alert((await res.json()).error);
  };

  const move = async (index: number, dir: -1 | 1) => {
    const next = [...themes];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setThemes(next);
    await fetch("/api/admin/themes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: next.map((t) => t.id) }),
    });
  };

  const preview = (id: string) => {
    setPreviewId(id);
    document.documentElement.setAttribute("data-theme", id);
  };
  const stopPreview = () => {
    setPreviewId(null);
    document.documentElement.setAttribute("data-theme", themes.find((t) => t.isDefault)?.id || "rose-romance");
  };

  if (loading) return <p className="text-sm text-ink/50">Loading…</p>;

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-semibold mb-1">Themes</h1>
      <p className="text-sm text-ink/50 mb-6">
        Enable/disable, reorder, and set the site-wide default. Users can also pick their own in Settings.
        {previewId && (
          <button onClick={stopPreview} className="ml-2 text-rose-500 font-medium">
            (Previewing — click to stop)
          </button>
        )}
      </p>

      <div className="space-y-3">
        {themes.map((t, i) => {
          const [a, b] = SWATCHES[t.id] ?? ["#F43F5E", "#8B5CF6"];
          return (
            <div key={t.id} className="surface-card p-4 flex items-center gap-4">
              <span
                className="h-10 w-10 shrink-0 rounded-full cursor-pointer"
                style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}
                onClick={() => preview(t.id)}
                title="Preview"
              />
              <div className="flex-1">
                <p className="text-sm font-medium">{t.name}</p>
                <p className="text-xs text-ink/40">{t.id}</p>
              </div>
              {t.isDefault && (
                <span className="text-[10px] font-semibold uppercase tracking-wide bg-rose-50 text-rose-600 px-2 py-1 rounded-full">
                  Default
                </span>
              )}
              <div className="flex items-center gap-1">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="p-1 text-ink/40 disabled:opacity-20">
                  ↑
                </button>
                <button onClick={() => move(i, 1)} disabled={i === themes.length - 1} className="p-1 text-ink/40 disabled:opacity-20">
                  ↓
                </button>
              </div>
              {!t.isDefault && (
                <button onClick={() => setDefault(t.id)} className="text-xs font-medium text-plum-600">
                  Make Default
                </button>
              )}
              <label className="flex items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  checked={t.isEnabled}
                  disabled={t.isDefault}
                  onChange={(e) => toggle(t.id, e.target.checked)}
                />
                Enabled
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}
