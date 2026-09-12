"use client";
import { useEffect, useState } from "react";

type ThemeRow = { id: string; name: string; sortOrder: number };

// Full palette per theme (base/ink/rose-500/rose-400) so the mini preview
// looks like a genuine tiny screenshot of that theme, not just a swatch.
const PALETTES: Record<string, { base: string; ink: string; accent: string; accent2: string; emoji: string }> = {
  "rose-romance": { base: "#FFFBF9", ink: "#2A2430", accent: "#F43F5E", accent2: "#8B5CF6", emoji: "🌹" },
  "cherry-love": { base: "#FFF8F7", ink: "#2E1A1A", accent: "#D6362A", accent2: "#C2410C", emoji: "🍒" },
  "blush-dream": { base: "#FFFAFB", ink: "#3D2A33", accent: "#EC5C8E", accent2: "#B794F6", emoji: "🌸" },
  "midnight-love": { base: "#14111A", ink: "#F3EEF9", accent: "#F43F5E", accent2: "#A78BFA", emoji: "🌙" },
  "sunset-hearts": { base: "#FFF9F5", ink: "#3D2817", accent: "#FF6B35", accent2: "#EC4899", emoji: "🌅" },
  "lavender-love": { base: "#FBFAFF", ink: "#2E2A3D", accent: "#8B5CF6", accent2: "#C026D3", emoji: "💜" },
  "sweet-candy": { base: "#FFFAFC", ink: "#2D1B2E", accent: "#FF3D9A", accent2: "#38BDF8", emoji: "🍬" },
  "royal-romance": { base: "#FBF8F5", ink: "#251A2E", accent: "#9333EA", accent2: "#D97706", emoji: "👑" },
  "emerald-romance": { base: "#F7FBF9", ink: "#1A2E24", accent: "#10B981", accent2: "#F43F5E", emoji: "💚" },
  "neon-love": { base: "#0A0A12", ink: "#F0F0FF", accent: "#FF0080", accent2: "#00F5FF", emoji: "💖" },
};

function ThemeMiniPreview({ id }: { id: string }) {
  const p = PALETTES[id] ?? PALETTES["rose-romance"];
  return (
    <div className="rounded-xl overflow-hidden border border-black/5" style={{ background: p.base }}>
      {/* mini navbar */}
      <div className="flex items-center justify-between px-2 py-1.5" style={{ borderBottom: `1px solid ${p.accent}22` }}>
        <span style={{ color: p.accent, fontSize: 9, fontWeight: 700 }}>{p.emoji} DilMil</span>
        <span className="h-2 w-2 rounded-full" style={{ background: p.accent }} />
      </div>
      {/* mini card */}
      <div className="p-2">
        <div className="rounded-lg p-2" style={{ background: `${p.ink}08`, border: `1px solid ${p.ink}10` }}>
          <div className="h-6 w-6 rounded-full mb-1" style={{ background: `linear-gradient(135deg, ${p.accent}, ${p.accent2})` }} />
          <div className="h-1.5 w-10 rounded-full mb-1" style={{ background: `${p.ink}30` }} />
          <div className="h-1.5 w-14 rounded-full" style={{ background: `${p.ink}18` }} />
        </div>
        <div className="mt-1.5 rounded-md text-center" style={{ background: p.accent, color: "#fff", fontSize: 8, padding: "3px 0" }}>
          ❤️ Like
        </div>
      </div>
    </div>
  );
}

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
      <p className="text-sm font-medium mb-1">Pick Your Vibe ❤️</p>
      <p className="text-xs text-ink/50 mb-4">Make your experience more beautiful — pick your favorite theme, or try them all.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {themes.map((t) => {
          const active = current === t.id;
          return (
            <button
              key={t.id}
              onClick={() => pick(t.id)}
              disabled={saving === t.id}
              className={`rounded-2xl border-2 p-2 text-left transition-colors ${active ? "border-rose-500" : "border-transparent hover:border-black/10"}`}
            >
              <ThemeMiniPreview id={t.id} />
              <p className="text-xs font-medium mt-2 flex items-center justify-between">
                {t.name}
                {active && <span className="text-rose-500 text-[10px]">● Active</span>}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
