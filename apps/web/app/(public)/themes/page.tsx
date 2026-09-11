import Link from "next/link";
import { Navbar } from "../../../components/layout/Navigation";

const THEMES = [
  ["rose-romance", "Rose Romance", ["#F43F5E", "#8B5CF6"]],
  ["cherry-love", "Cherry Love", ["#D6362A", "#C2410C"]],
  ["blush-dream", "Blush Dream", ["#EC5C8E", "#B794F6"]],
  ["midnight-love", "Midnight Love", ["#14111A", "#F43F5E"]],
  ["sunset-hearts", "Sunset Hearts", ["#FF6B35", "#EC4899"]],
  ["lavender-love", "Lavender Love", ["#8B5CF6", "#C026D3"]],
  ["sweet-candy", "Sweet Candy", ["#FF3D9A", "#38BDF8"]],
  ["royal-romance", "Royal Romance", ["#9333EA", "#D97706"]],
  ["emerald-romance", "Emerald Romance", ["#10B981", "#F43F5E"]],
  ["neon-love", "Neon Love", ["#0A0A12", "#FF0080"]],
] as const;

export default function ThemesPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-5 sm:px-8 py-16">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-center">Pick Your Vibe</h1>
        <p className="text-center text-ink/50 mt-3 mb-10 max-w-md mx-auto">
          DilMil comes with 10 beautiful themes. Choose yours from Settings after you sign up — it changes the whole
          app instantly.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {THEMES.map(([id, name, [a, b]]) => (
            <div key={id} className="surface-card p-4 text-center">
              <div
                className="h-16 w-16 rounded-full mx-auto mb-3"
                style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}
              />
              <p className="text-xs font-medium">{name}</p>
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
