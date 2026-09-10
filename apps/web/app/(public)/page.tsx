import Link from "next/link";
import { Navbar } from "../../components/layout/Navigation";
import { Badge } from "../../components/ui/primitives";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="px-6 sm:px-8 pt-16 pb-20 max-w-5xl mx-auto text-center">
          <div className="flex justify-center gap-2 mb-6">
            <Badge tone="gold">18+ Only</Badge>
            <Badge tone="success">Verified Profiles</Badge>
          </div>
          <h1 className="font-display text-4xl sm:text-6xl font-semibold leading-tight">
            Meet. Match. <span className="text-rose-500">Connect.</span>
          </h1>
          <p className="text-ink/60 mt-5 text-lg max-w-xl mx-auto">
            Discover people, make connections and start meaningful conversations — built for
            Pakistan, with real verification and privacy at the core.
          </p>
          <div className="flex items-center justify-center gap-3 mt-8">
            <Link
              href="/register"
              className="bg-rose-500 text-white rounded-xl px-6 py-3.5 font-medium hover:bg-rose-600 transition-colors"
            >
              Create Your Profile
            </Link>
            <Link
              href="/how-it-works"
              className="border border-black/10 rounded-xl px-6 py-3.5 font-medium hover:bg-black/5 transition-colors"
            >
              Explore How It Works
            </Link>
          </div>
        </section>

        {/* How it works */}
        <section className="bg-white border-y border-black/5 py-16 px-6 sm:px-8">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-display text-2xl font-semibold text-center mb-10">How It Works</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {[
                "Create your profile",
                "Get approved",
                "Discover people",
                "Match",
                "Chat",
                "Connect",
              ].map((step, i) => (
                <div key={step} className="surface-card p-5 text-center">
                  <div className="h-9 w-9 rounded-full bg-rose-50 text-rose-500 font-semibold flex items-center justify-center mx-auto mb-3">
                    {i + 1}
                  </div>
                  <p className="text-sm font-medium">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why join */}
        <section className="py-16 px-6 sm:px-8 max-w-5xl mx-auto">
          <h2 className="font-display text-2xl font-semibold text-center mb-10">Why Join</h2>
          <div className="grid sm:grid-cols-3 gap-6 text-sm">
            {[
              ["Verified profiles", "Admin-reviewed profiles, not bots."],
              ["Private messaging", "Realtime, authorized-only conversations."],
              ["Modern discovery", "A thoughtful ranking, not a wall of ads."],
              ["Community feed", "Share moments, not just swipes."],
              ["Safety tools", "Block, report and privacy controls built-in."],
              ["Premium visibility", "Optional plans for more reach — never guaranteed outcomes."],
            ].map(([title, desc]) => (
              <div key={title} className="surface-card p-5">
                <p className="font-medium">{title}</p>
                <p className="text-ink/50 mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing preview */}
        <section className="bg-white border-y border-black/5 py-16 px-6 sm:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-display text-2xl font-semibold mb-2">Simple pricing</h2>
            <p className="text-ink/50 mb-10">Start for Rs.499. Upgrade any time.</p>
            <Link href="/pricing" className="text-rose-500 font-medium">
              View full pricing →
            </Link>
          </div>
        </section>

        {/* Safety */}
        <section className="py-16 px-6 sm:px-8 max-w-3xl mx-auto text-center">
          <h2 className="font-display text-2xl font-semibold mb-4">Safety, by design</h2>
          <p className="text-ink/60">
            18+ only, enforced server-side. Every profile is reviewed before it becomes visible.
            Block and report tools are available everywhere. Your phone number and exact location
            are never shown without your consent.
          </p>
          <Link href="/safety" className="text-rose-500 font-medium mt-4 inline-block">
            Read our safety commitments →
          </Link>
        </section>

        <footer className="border-t border-black/5 py-10 px-6 sm:px-8 text-sm text-ink/50">
          <div className="max-w-5xl mx-auto flex flex-wrap gap-x-8 gap-y-3 justify-between">
            <span>© {new Date().getFullYear()} DilMil</span>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <Link href="/terms">Terms</Link>
              <Link href="/privacy">Privacy</Link>
              <Link href="/community-guidelines">Community Guidelines</Link>
              <Link href="/safety">Safety</Link>
              <Link href="/contact">Contact</Link>
              <Link href="/settings/delete-account">Delete Account</Link>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
