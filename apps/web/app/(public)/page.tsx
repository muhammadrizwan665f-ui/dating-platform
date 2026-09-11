import Link from "next/link";
import { Navbar } from "../../components/layout/Navigation";
import { Badge } from "../../components/ui/primitives";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

const FAQS = [
  ["Is DilMil free to use?", "Yes — creating a profile, browsing, and basic matching are free. Optional paid plans improve your visibility."],
  ["How is my safety protected?", "Every profile goes through admin review before it's visible. You control what's shared, and block/report tools are available everywhere."],
  ["Is my phone number ever shared automatically?", "Never. Someone must explicitly request it, and you choose to accept or decline before anything is shared."],
  ["Do premium plans guarantee matches?", "No — plans improve your visibility and give you extra features, but we never promise guaranteed matches, replies, or dates."],
  ["Can I delete my account?", "Yes, any time, from Settings. This immediately hides your profile and stops matching/chat."],
];

export default async function HomePage() {
  const [featured, plans] = await Promise.all([
    prisma.profile.findMany({
      where: { status: "APPROVED", hiddenFromDiscovery: false },
      include: { photos: { where: { isPrimary: true }, take: 1 } },
      orderBy: { completeness: "desc" },
      take: 6,
    }),
    prisma.membershipPlan.findMany({ where: { isActive: true }, orderBy: { price: "asc" } }),
  ]);

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
            Meet. Match. <span className="text-rose-500">Connect.</span> ❤️
          </h1>
          <p className="text-ink/60 mt-5 text-lg max-w-xl mx-auto">
            Discover genuine connections, meaningful conversations and new possibilities — built for Pakistan.
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

        {/* Featured profiles */}
        {featured.length > 0 && (
          <section className="bg-white border-y border-black/5 py-16 px-6 sm:px-8">
            <div className="max-w-5xl mx-auto">
              <h2 className="font-display text-2xl font-semibold text-center mb-2">Featured Profiles</h2>
              <p className="text-center text-ink/50 text-sm mb-10">A glimpse of the DilMil community</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {featured.map((p) => (
                  <div key={p.id} className="surface-card overflow-hidden">
                    <div className="relative aspect-square bg-rose-50">
                      {p.photos[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.photos[0].url} alt={p.displayName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-rose-300 text-3xl font-display">
                          {p.displayName.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="p-2 text-center">
                      <p className="text-xs font-medium truncate">{p.displayName}</p>
                      <p className="text-[10px] text-ink/40">{p.city}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-center mt-8">
                <Link href="/register" className="text-rose-500 font-medium text-sm">Join to see everyone →</Link>
              </p>
            </div>
          </section>
        )}

        {/* How it works */}
        <section className="py-16 px-6 sm:px-8">
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
        <section className="bg-white border-y border-black/5 py-16 px-6 sm:px-8">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-display text-2xl font-semibold text-center mb-10">Why Join DilMil</h2>
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
          </div>
        </section>

        {/* Membership plans */}
        {plans.length > 0 && (
          <section className="py-16 px-6 sm:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="font-display text-2xl font-semibold mb-2">Membership Plans</h2>
              <p className="text-ink/50 mb-2">Start for Rs.{plans[0]?.price ?? 499}. Upgrade any time.</p>
              <p className="text-xs text-ink/40 mb-10">Plans improve visibility and features — never guaranteed matches or dates.</p>
              <div className="grid sm:grid-cols-3 gap-6 text-left">
                {plans.map((p) => (
                  <div key={p.id} className="surface-card p-6">
                    {p.badge && <Badge tone="gold">{p.badge}</Badge>}
                    <h3 className="font-display text-lg font-semibold mt-2">{p.name}</h3>
                    <p className="text-2xl font-semibold mt-1">
                      Rs.{p.price} <span className="text-xs font-normal text-ink/50">/{p.durationDays}d</span>
                    </p>
                  </div>
                ))}
              </div>
              <Link href="/pricing" className="text-rose-500 font-medium mt-8 inline-block text-sm">
                See full plan details →
              </Link>
            </div>
          </section>
        )}

        {/* Safety */}
        <section className="bg-white border-y border-black/5 py-16 px-6 sm:px-8 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display text-2xl font-semibold mb-4">Safety, by design</h2>
            <p className="text-ink/60">
              18+ only, enforced server-side. Every profile is reviewed before it becomes visible.
              Block and report tools are available everywhere. Your phone number and exact location
              are never shown without your consent.
            </p>
            <Link href="/safety" className="text-rose-500 font-medium mt-4 inline-block">
              Read our safety commitments →
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 px-6 sm:px-8">
          <div className="max-w-2xl mx-auto">
            <h2 className="font-display text-2xl font-semibold text-center mb-10">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {FAQS.map(([q, a]) => (
                <details key={q} className="surface-card p-4 group">
                  <summary className="text-sm font-medium cursor-pointer list-none flex justify-between items-center">
                    {q}
                    <span className="text-ink/30 group-open:rotate-45 transition-transform">+</span>
                  </summary>
                  <p className="text-sm text-ink/60 mt-2">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-rose-500 py-16 px-6 sm:px-8 text-center">
          <h2 className="font-display text-3xl font-semibold text-white mb-3">Ready to find your match?</h2>
          <p className="text-white/80 mb-8">Join DilMil today — it only takes a couple of minutes.</p>
          <Link href="/register" className="bg-white text-rose-500 rounded-xl px-8 py-3.5 font-medium inline-block hover:bg-white/90 transition-colors">
            Create Your Profile
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
              <Link href="/settings">Delete Account</Link>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
