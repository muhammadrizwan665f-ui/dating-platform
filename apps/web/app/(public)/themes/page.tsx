import Link from "next/link";
import { Navbar } from "../../../components/layout/Navigation";

const THEMES = [
  ["rose-romance", "Rose Romance", "#FFFBF9", "#2A2430", "#F43F5E", "#8B5CF6", "🌹"],
  ["cherry-love", "Cherry Love", "#FFF8F7", "#2E1A1A", "#D6362A", "#C2410C", "🍒"],
  ["blush-dream", "Blush Dream", "#FFFAFB", "#3D2A33", "#EC5C8E", "#B794F6", "🌸"],
  ["midnight-love", "Midnight Love", "#14111A", "#F3EEF9", "#F43F5E", "#A78BFA", "🌙"],
  ["sunset-hearts", "Sunset Hearts", "#FFF9F5", "#3D2817", "#FF6B35", "#EC4899", "🌅"],
  ["lavender-love", "Lavender Love", "#FBFAFF", "#2E2A3D", "#8B5CF6", "#C026D3", "💜"],
  ["sweet-candy", "Sweet Candy", "#FFFAFC", "#2D1B2E", "#FF3D9A", "#38BDF8", "🍬"],
  ["royal-romance", "Royal Romance", "#FBF8F5", "#251A2E", "#9333EA", "#D97706", "👑"],
  ["emerald-romance", "Emerald Romance", "#F7FBF9", "#1A2E24", "#10B981", "#F43F5E", "💚"],
  ["neon-love", "Neon Love", "#0A0A12", "#F0F0FF", "#FF0080", "#00F5FF", "💖"],
] as const;

export default function ThemesPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-5 sm:px-8 py-16">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-center">Pick Your Vibe ❤️</h1>
        <p className="text-center text-ink/50 mt-3 mb-10 max-w-md mx-auto">
          DilMil comes with 10 beautiful themes. Choose yours from Settings after you sign up — it changes the whole
          app instantly.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {THEMES.map(([id, name, base, ink, accent, accent2, emoji]) => (
            <div key={id} className="rounded-2xl overflow-hidden border border-black/5" style={{ background: base }}>
              <div className="flex items-center justify-between px-2.5 py-2" style={{ borderBottom: `1px solid ${accent}22` }}>
                <span style={{ color: accent, fontSize: 11, fontWeight: 700 }}>{emoji} DilMil</span>
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: accent }} />
              </div>
              <div className="p-2.5">
                <div className="rounded-lg p-2.5" style={{ background: `${ink}08`, border: `1px solid ${ink}10` }}>
                  <div className="h-8 w-8 rounded-full mb-1.5" style={{ background: `linear-gradient(135deg, ${accent}, ${accent2})` }} />
                  <div className="h-1.5 w-14 rounded-full mb-1" style={{ background: `${ink}30` }} />
                  <div className="h-1.5 w-20 rounded-full" style={{ background: `${ink}18` }} />
                </div>
                <div className="mt-2 rounded-lg text-center text-white text-[11px] font-medium py-1.5" style={{ background: accent }}>
                  ❤️ Like
                </div>
              </div>
              <p className="text-xs font-semibold text-center py-2.5" style={{ color: ink }}>{name}</p>
            </div>
          ))}
        </div>
        <p className="text-center mt-10">
          <Link href="/register" className="bg-rose-500 text-white rounded-xl px-6 py-3 font-medium inline-block hover:bg-rose-600 transition-colors">
            Create Your Profile →
          </Link>
        </p>
      </main>
    </>
  );
}
