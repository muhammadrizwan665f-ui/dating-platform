import { Navbar } from "./Navigation";

export function StaticPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="font-display text-3xl font-semibold mb-6">{title}</h1>
        <div className="prose prose-sm max-w-none text-ink/70 space-y-4">{children}</div>
      </main>
    </>
  );
}
