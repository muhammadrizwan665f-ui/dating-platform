import Link from "next/link";
import { Navbar } from "../../../components/layout/Navigation";

const STEPS = [
  ["01", "Create Your Account", "Sign up in seconds with your basic details — email or phone, and you're in.", "👤"],
  ["02", "Build Your Profile", "Add your photos, bio, interests and what you're looking for.", "✏️"],
  ["03", "Get Approved", "Our team reviews every profile before it goes live — no bots, no fakes.", "✅"],
  ["04", "Discover People", "Browse profiles that match your preferences — city, age, interests and intention.", "🔍"],
  ["05", "Like Someone", "See someone you click with? Show interest with a like.", "❤️"],
  ["06", "Match", "When it's mutual, it's a match — and a private chat opens up instantly.", "✨"],
  ["07", "Start Chatting", "Message privately in a realtime, WhatsApp-style chat experience.", "💬"],
  ["08", "Connect", "Build something real, at your own pace — dating, friendship, or more.", "🤝"],
] as const;

export default function HowItWorksPage() {
  return (
    <>
      <Navbar />
      <main>
        <section className="px-5 sm:px-8 py-16 text-center max-w-2xl mx-auto">
          <h1 className="font-display text-3xl sm:text-4xl font-semibold">
            Finding the right connection shouldn&apos;t be complicated.
          </h1>
          <p className="text-ink/50 mt-4">
            Here&apos;s exactly how DilMil works, from signing up to your first real conversation.
          </p>
        </section>

        <section className="px-5 sm:px-8 pb-20 max-w-3xl mx-auto space-y-8">
          {STEPS.map(([num, title, desc, icon], i) => (
            <div key={num} className={`flex items-center gap-6 ${i % 2 === 1 ? "sm:flex-row-reverse sm:text-right" : ""}`}>
              <div className="h-16 w-16 sm:h-20 sm:w-20 shrink-0 rounded-3xl bg-gradient-to-br from-rose-100 to-plum-500/10 flex items-center justify-center text-3xl">
                {icon}
              </div>
              <div className="surface-card p-5 flex-1">
                <p className="text-xs font-bold text-rose-400 mb-1">{num}</p>
                <p className="font-display text-lg font-semibold">{title}</p>
                <p className="text-sm text-ink/60 mt-1">{desc}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="bg-gradient-to-br from-rose-500 to-plum-500 py-16 px-5 sm:px-8 text-center">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-white mb-6">Ready to start your journey?</h2>
          <Link href="/register" className="bg-white text-rose-500 rounded-xl px-7 py-3.5 font-medium inline-block hover:bg-white/90 transition-colors">
            Create Your Profile →
          </Link>
        </section>
      </main>
    </>
  );
}
