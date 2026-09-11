const STEPS = [
  ["Create Account", "Sign up in seconds with your details.", "👤"],
  ["Complete Profile", "Add your photos, interests and bio.", "✏️"],
  ["Get Reviewed", "Our team verifies your profile (18+).", "✅"],
  ["Discover People", "Explore and find like-minded people.", "🔍"],
  ["Like", "Show interest in profiles you like.", "❤️"],
  ["Match", "When it's mutual, it's a match!", "✨"],
  ["Chat", "Start private conversations.", "💬"],
  ["Connect", "Build real relationships.", "🤝"],
] as const;

export function HowItWorks() {
  return (
    <section className="py-16 px-5 sm:px-8">
      <div className="max-w-6xl mx-auto text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-rose-500 mb-2">Simple Steps</p>
        <h2 className="font-display text-3xl sm:text-4xl font-semibold">How It Works</h2>
        <p className="text-ink/50 mt-3 mb-10 max-w-md mx-auto">
          Getting started is easy — follow these simple steps and find your perfect match.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STEPS.map(([title, desc, icon], i) => (
            <div key={title} className="relative surface-card p-5 text-left hover:shadow-cardHover transition-shadow">
              <span className="absolute top-3 right-4 text-[11px] font-bold text-rose-300">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="h-10 w-10 rounded-full bg-rose-50 flex items-center justify-center text-lg mb-3">
                {icon}
              </div>
              <p className="text-sm font-semibold">{title}</p>
              <p className="text-xs text-ink/50 mt-1 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
