import Link from "next/link";
import { Navbar } from "../../components/layout/Navigation";
import { Badge } from "../../components/ui/primitives";
import { prisma } from "@/lib/db/prisma";
import { HowItWorks } from "../../components/marketing/HowItWorks";
import { WhyChooseDilMil } from "../../components/marketing/WhyChooseDilMil";
import { StatsSection } from "../../components/marketing/StatsSection";
import { FAQSection } from "../../components/marketing/FAQSection";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featured, plans, settingsRows, feedPosts] = await Promise.all([
    prisma.profile.findMany({
      where: { status: "APPROVED", hiddenFromDiscovery: false },
      include: { photos: { where: { isPrimary: true }, take: 1 } },
      orderBy: { completeness: "desc" },
      take: 8,
    }),
    prisma.membershipPlan.findMany({ where: { isActive: true }, orderBy: { price: "asc" } }),
    prisma.setting.findMany(),
    prisma.post.findMany({
      where: { status: "VISIBLE" },
      include: { author: { include: { profile: true } }, images: { take: 1 }, _count: { select: { likes: true, comments: true } } },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  const settingsMap = Object.fromEntries(settingsRows.map((r) => [r.key, r.value]));
  const stats = [
    { label: "Active Users", value: settingsMap.stat_active_users || "500+" },
    { label: "Daily Matches", value: settingsMap.stat_daily_matches || "50+" },
    { label: "Messages Sent", value: settingsMap.stat_messages_sent || "2K+" },
    { label: "User Satisfaction", value: settingsMap.stat_satisfaction || "4.8/5" },
  ];

  return (
    <>
      <Navbar />
      <main className="overflow-x-hidden">
        {/* HERO */}
        <section className="relative px-5 sm:px-8 pt-14 pb-20 max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: copy */}
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-1.5 bg-white border border-rose-100 rounded-full px-4 py-1.5 text-xs font-medium text-rose-600 shadow-sm">
                🇵🇰 Pakistan&apos;s Trusted Dating &amp; Social Platform
              </span>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.1] mt-5">
                Meet. Match.
                <br />
                <span className="text-rose-500">Connect.</span> ❤️
              </h1>
              <p className="text-ink/60 mt-5 text-lg max-w-md mx-auto lg:mx-0">
                Discover genuine connections, meaningful conversations and new possibilities — built for Pakistan.
              </p>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mt-8">
                <Link href="/register" className="bg-rose-500 text-white rounded-xl px-6 py-3.5 font-medium hover:bg-rose-600 transition-colors shadow-sm">
                  Create Your Profile →
                </Link>
                <Link href="/how-it-works" className="border border-black/10 bg-white rounded-xl px-6 py-3.5 font-medium hover:bg-black/5 transition-colors">
                  Explore How It Works
                </Link>
              </div>
              <p className="text-xs text-ink/40 mt-6">
                💗 Join thousands of people finding their special someone.
              </p>
            </div>

            {/* Right: visual composition with sample profile photos */}
            <div className="relative aspect-square max-w-md mx-auto w-full">
              <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-rose-200 via-rose-100 to-plum-500/10 shadow-cardHover" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-8xl">💞</span>
              </div>
              <div className="absolute -left-2 bottom-10 surface-card p-3 w-40 rotate-[-6deg]">
                <div className="h-16 w-full rounded-lg mb-2 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="https://i.ibb.co/S4HHw5CS/a04b6ad311acb3112d97b8eaa80ee6cf.jpg" alt="Ali" className="w-full h-full object-cover" />
                </div>
                <p className="text-xs font-semibold flex items-center gap-1">Ali, 26 <Badge tone="success">✓</Badge></p>
                <p className="text-[10px] text-ink/50">Lahore</p>
              </div>
              <div className="absolute -right-2 top-10 surface-card p-3 w-40 rotate-[6deg]">
                <div className="h-16 w-full rounded-lg mb-2 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="https://i.ibb.co/1t7x61p3/images-2026-09-13-T073454-165.jpg" alt="Ayesha" className="w-full h-full object-cover" />
                </div>
                <p className="text-xs font-semibold">Ayesha, 24 ❤️</p>
                <p className="text-[10px] text-ink/50">Islamabad</p>
              </div>
            </div>
          </div>
        </section>

        <StatsSection stats={stats} />

        <HowItWorks />
        <WhyChooseDilMil />

        {/* Featured profiles */}
        {featured.length > 0 && (
          <section className="py-16 px-5 sm:px-8">
            <div className="max-w-6xl mx-auto">
              <h2 className="font-display text-3xl font-semibold text-center mb-2">People You Could Meet ❤️</h2>
              <p className="text-center text-ink/50 text-sm mb-10">A glimpse of the DilMil community</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {featured.map((p) => (
                  <div key={p.id} className="surface-card overflow-hidden hover:shadow-cardHover transition-shadow">
                    <div className="relative aspect-square bg-rose-50">
                      {p.photos[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.photos[0].url} alt={p.displayName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-rose-300 text-3xl font-display">
                          {p.displayName.charAt(0)}
                        </div>
                      )}
                      {p.verified && (
                        <span className="absolute top-2 left-2 text-[10px] bg-white/90 rounded-full px-2 py-0.5 font-medium text-success">✓ Verified</span>
                      )}
                    </div>
                    <div className="p-2.5 text-center">
                      <p className="text-xs font-semibold truncate">{p.displayName}</p>
                      <p className="text-[10px] text-ink/40">{p.city}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-center mt-8">
                <Link href="/register" className="text-rose-500 font-medium text-sm">Explore People →</Link>
              </p>
            </div>
          </section>
        )}

        {/* Social feed preview */}
        <section className="py-16 px-5 sm:px-8 bg-rose-50/50">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display text-3xl font-semibold mb-2">Share. Connect. Be Yourself.</h2>
            <p className="text-ink/50 mb-10">DilMil is also a community — not just a swipe.</p>
            {feedPosts.length > 0 ? (
              <div className="grid sm:grid-cols-3 gap-4 text-left">
                {feedPosts.map((post) => (
                  <div key={post.id} className="surface-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-8 w-8 rounded-full bg-rose-100 flex items-center justify-center text-sm font-semibold text-rose-500 shrink-0">
                        {post.author.profile?.displayName?.charAt(0) ?? "?"}
                      </div>
                      <p className="text-xs font-medium">{post.author.profile?.displayName ?? "DilMil User"}</p>
                    </div>
                    {post.images[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={post.images[0].url} alt="" className="w-full aspect-video object-cover rounded-lg mb-2" />
                    )}
                    {post.caption && <p className="text-xs text-ink/60 line-clamp-2">{post.caption}</p>}
                    <div className="flex gap-4 mt-3 text-[10px] text-ink/40">
                      <span>❤️ {post._count.likes}</span>
                      <span>💬 {post._count.comments}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="surface-card p-8 text-sm text-ink/40">
                Be the first to share a moment on the DilMil feed once you join.
              </div>
            )}
            <Link href="/register" className="text-rose-500 font-medium text-sm mt-8 inline-block">Join the Feed →</Link>
          </div>
        </section>

        {/* Membership plans */}
        {plans.length > 0 && (
          <section className="py-16 px-5 sm:px-8">
            <div className="max-w-5xl mx-auto text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-rose-500 mb-2">Choose Your Plan</p>
              <h2 className="font-display text-3xl font-semibold mb-2">Membership Plans</h2>
              <p className="text-ink/50 mb-2 max-w-md mx-auto">More visibility. Better discovery. More ways to connect.</p>
              <p className="text-xs text-ink/40 mb-10">Plans improve reach — never guaranteed matches or dates.</p>
              <div className="grid sm:grid-cols-3 gap-6 text-left">
                {plans.map((p, i) => {
                  const isMid = i === 1 && plans.length >= 2;
                  return (
                    <div
                      key={p.id}
                      className={`rounded-3xl p-7 relative ${
                        isMid
                          ? "bg-plum-500 text-white shadow-cardHover scale-[1.03]"
                          : "surface-card"
                      }`}
                    >
                      {p.badge && (
                        <span className={`absolute -top-3 right-6 text-[10px] font-bold uppercase px-3 py-1 rounded-full ${isMid ? "bg-white text-plum-600" : "bg-gold-400/20 text-gold-500"}`}>
                          {p.badge}
                        </span>
                      )}
                      <p className="text-sm font-semibold uppercase tracking-wide opacity-80">{p.name}</p>
                      <p className="text-3xl font-display font-semibold mt-2">
                        Rs.{p.price} <span className="text-sm font-normal opacity-60">/{p.durationDays}d</span>
                      </p>
                      <ul className="mt-5 space-y-2 text-sm">
                        {Object.entries((p.features as any) || {}).map(([k, v]) => (
                          <li key={k} className="flex items-start gap-2">
                            <span>✓</span> <span>{k}: {String(v)}</span>
                          </li>
                        ))}
                      </ul>
                      <Link
                        href="/register"
                        className={`block text-center rounded-xl py-2.5 mt-6 text-sm font-medium transition-colors ${
                          isMid ? "bg-white text-plum-600 hover:bg-white/90" : "bg-rose-500 text-white hover:bg-rose-600"
                        }`}
                      >
                        Get Started →
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Safety */}
        <section className="bg-rose-50/50 py-16 px-5 sm:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display text-3xl font-semibold mb-4">Safety, by Design</h2>
            <div className="grid sm:grid-cols-2 gap-3 text-left mt-8">
              {[
                ["🔞", "18+ adults only — verified server-side"],
                ["✅", "Every profile is reviewed before going live"],
                ["🚫", "Block & report tools everywhere"],
                ["🔒", "Full privacy controls"],
                ["📵", "No public phone numbers, ever"],
                ["🤝", "Mutual WhatsApp consent required"],
              ].map(([icon, text]) => (
                <div key={text} className="surface-card p-4 flex items-center gap-3">
                  <span className="text-xl">{icon}</span>
                  <p className="text-sm text-ink/70">{text}</p>
                </div>
              ))}
            </div>
            <Link href="/safety" className="text-rose-500 font-medium mt-8 inline-block">
              Read Our Safety Commitment →
            </Link>
          </div>
        </section>

        <FAQSection />

        {/* Final CTA */}
        <section className="bg-gradient-to-br from-rose-500 to-plum-500 py-16 px-5 sm:px-8 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-white mb-3">
            Your next meaningful connection could be one click away. ❤️
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <Link href="/register" className="bg-white text-rose-500 rounded-xl px-7 py-3.5 font-medium hover:bg-white/90 transition-colors">
              Create Your Profile →
            </Link>
            <Link href="/register" className="border border-white/40 text-white rounded-xl px-7 py-3.5 font-medium hover:bg-white/10 transition-colors">
              Explore People →
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-[#14111A] text-white/70 py-14 px-5 sm:px-8">
          <div className="max-w-6xl mx-auto grid sm:grid-cols-4 gap-10">
            <div>
              <p className="font-display text-xl font-semibold text-white flex items-center gap-1.5">💗 DilMil</p>
              <p className="text-sm mt-2">Meet. Match. Connect. ❤️</p>
              <p className="text-xs mt-3 max-w-xs">Pakistan&apos;s trusted dating and social platform for genuine connections.</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-white uppercase tracking-wide mb-3">Quick Links</p>
              <div className="space-y-2 text-sm">
                <Link href="/" className="block">Home</Link>
                <Link href="/how-it-works" className="block">How It Works</Link>
                <Link href="/safety" className="block">Safety</Link>
                <Link href="/pricing" className="block">Pricing</Link>
                <Link href="/contact" className="block">Contact</Link>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-white uppercase tracking-wide mb-3">Legal</p>
              <div className="space-y-2 text-sm">
                <Link href="/terms" className="block">Terms &amp; Conditions</Link>
                <Link href="/privacy" className="block">Privacy Policy</Link>
                <Link href="/community-guidelines" className="block">Community Guidelines</Link>
                <Link href="/settings" className="block">Delete Account</Link>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-white uppercase tracking-wide mb-3">Support</p>
              <div className="space-y-2 text-sm">
                <Link href="/faq" className="block">Help Center</Link>
                <Link href="/contact" className="block">Contact Us</Link>
                <Link href="/contact" className="block">Report Issue</Link>
              </div>
            </div>
          </div>
          <div className="max-w-6xl mx-auto border-t border-white/10 mt-10 pt-6 flex flex-wrap justify-between gap-3 text-xs">
            <span>© {new Date().getFullYear()} DilMil. All rights reserved.</span>
            <span>Made with ❤️ in Pakistan</span>
          </div>
        </footer>
      </main>
    </>
  );
}
