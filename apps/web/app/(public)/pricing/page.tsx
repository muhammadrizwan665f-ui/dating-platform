"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "../../../components/layout/Navigation";
import { Badge } from "../../../components/ui/primitives";

interface Plan {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  badge?: string | null;
  features: Record<string, unknown>;
}

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  useEffect(() => {
    fetch("/api/membership/plans").then((r) => r.json()).then((d) => setPlans(d.plans ?? []));
  }, []);

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="font-display text-3xl font-semibold text-center mb-3">Simple, transparent pricing</h1>
        <p className="text-center text-ink/60 mb-2">
          Every plan gives you full core access. Higher tiers improve your visibility in Discover.
        </p>
        <p className="text-center text-xs text-ink/40 mb-10">
          Premium plans do not guarantee dates, matches, or replies — they improve platform reach and features.
        </p>
        <div className="grid sm:grid-cols-3 gap-6">
          {plans.map((p) => (
            <div key={p.id} className="surface-card p-6">
              {p.badge && <Badge tone="gold">{p.badge}</Badge>}
              <h2 className="font-display text-xl font-semibold mt-2">{p.name}</h2>
              <p className="text-3xl font-semibold mt-2">
                Rs.{p.price} <span className="text-sm font-normal text-ink/50">/{p.durationDays} days</span>
              </p>
              <ul className="text-sm text-ink/60 mt-4 space-y-1.5">
                {Object.entries(p.features || {}).map(([k, v]) => (
                  <li key={k}>• {k}: {String(v)}</li>
                ))}
              </ul>
              <Link
                href="/register"
                className="block text-center bg-rose-500 text-white rounded-xl py-2.5 mt-6 text-sm font-medium hover:bg-rose-600"
              >
                Get started
              </Link>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
