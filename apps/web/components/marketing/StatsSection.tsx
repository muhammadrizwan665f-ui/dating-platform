export function StatsSection({ stats }: { stats: { label: string; value: string }[] }) {
  return (
    <section className="px-5 sm:px-8 -mt-8 relative z-10">
      <div className="max-w-4xl mx-auto surface-card p-6 sm:p-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="font-display text-2xl sm:text-3xl font-semibold text-rose-500">{s.value}</p>
            <p className="text-xs text-ink/50 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
