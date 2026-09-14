const FEATURES = [
  ["Verified Profiles", "Real people, real identities.", "🛡️"],
  ["Private Chat", "Your privacy is our priority.", "💬"],
  ["Social Feed", "Share moments, not just profiles.", "📸"],
  ["Smart Matching", "Better matches, thoughtfully ranked.", "🧩"],
  ["Privacy Controls", "You're always in control.", "🔒"],
  ["Safety Tools", "Report & block, stay safe.", "🚨"],
  ["Premium Discovery", "Get noticed with premium features.", "👑"],
] as const;

export function WhyChooseDilMil() {
  return (
    <section className="py-10 px-5 sm:px-8 bg-rose-50/50 relative overflow-hidden">
      <div className="max-w-6xl mx-auto text-center relative z-10">
        <p className="text-xs font-bold uppercase tracking-widest text-rose-500 mb-2">Why DilMil</p>
        <h2 className="font-display text-3xl sm:text-4xl font-semibold">Why Choose DilMil?</h2>
        <p className="text-ink/50 mt-3 mb-6 max-w-md mx-auto">
          More than just a dating app — it&apos;s a community. Here&apos;s what makes us special.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-5 text-left">
          {FEATURES.map(([title, desc, icon]) => (
            <div key={title} className="surface-card p-6 hover:-translate-y-1 hover:shadow-cardHover transition-all">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-rose-100 to-plum-500/10 flex items-center justify-center text-xl mb-4">
                {icon}
              </div>
              <p className="font-semibold text-sm">{title}</p>
              <p className="text-xs text-ink/50 mt-1.5 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
