"use client";
import { useEffect, useState } from "react";

type ThemeRow = { id: string; name: string; sortOrder: number };

// Same swatch colors as the shared THEMES constant, duplicated here (client
// component) to avoid pulling the workspace package into a "use client" tree
// just for two hex strings per theme.
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

export function ThemePicker() {
  const [themes, setThemes] = useState<ThemeRow[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings/theme")
      .then((r) => r.json())
      .then((data) => {
        setThemes(data.themes ?? []);
        setCurrent(data.current);
      });
  }, []);

  const pick = async (id: string) => {
    setSaving(id);
    // Apply instantly, don't wait for the server round-trip.
    document.documentElement.setAttribute("data-theme", id);
    setCurrent(id);
    try {
      await fetch("/api/settings/theme", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: id }),
      });
    } finally {
      setSaving(null);
    }
  };

  if (themes.length === 0) return null;

  return (
    <div className="surface-card p-5">
      <p className="text-sm font-medium mb-1">App Theme</p>
      <p className="text-xs text-ink/50 mb-4">Pick a look that fits your vibe — changes apply instantly.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {themes.map((t) => {
          const [a, b] = SWATCHES[t.id] ?? ["#F43F5E", "#8B5CF6"];
          const active = current === t.id;
          return (
            <button
              key={t.id}
              onClick={() => pick(t.id)}
              disabled={saving === t.id}
              className={`flex items-center gap-2 rounded-xl border-2 p-2.5 text-left transition-colors ${
                active ? "border-rose-500" : "border-black/5 hover:border-black/10"
              }`}
            >
              <span
                className="h-8 w-8 shrink-0 rounded-full"
                style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}
              />
              <span className="text-xs font-medium leading-tight">{t.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
