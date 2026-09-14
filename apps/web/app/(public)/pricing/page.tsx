"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "../../../components/layout/Navigation";

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
      <main className="px-4 sm:px-6 py-14 max-w-5xl mx-auto">
        <div className="rounded-3xl bg-gradient-to-br from-rose-500 to-plum-500 p-8 text-center text-white mb-10">
          <h1 className="font-display text-2xl sm:text-3xl font-semibold">Choose Your DilMil Experience ❤️</h1>
          <p className="text-white/80 mt-2 text-sm max-w-md mx-auto">
            Get more visibility, discover more people and make meaningful connections.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6 mb-10">
          {plans.map((plan, i) => {
            const isPro = i === 1 && plans.length >= 2;
            const isDiamond = i === plans.length - 1 && plans.length >= 3;
            const cardStyle = isDiamond
              ? "bg-[#14111A] text-white shadow-cardHover"
              : isPro
                ? "bg-plum-500 text-white shadow-cardHover scale-[1.03]"
                : "surface-card";
            return (
              <div key={plan.id} className={`relative rounded-3xl p-6 text-left ${cardStyle}`}>
                {isPro && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold-400 text-[#14111A] text-[10px] font-bold uppercase px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
                <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{plan.badge || plan.name}</p>
                <p className="font-display text-2xl font-semibold mt-1">{plan.name}</p>
                <p className="text-3xl font-semibold mt-2">
                  Rs.{plan.price} <span className="text-sm font-normal opacity-60">/{plan.durationDays}d</span>
                </p>
                <ul className="mt-5 space-y-2 text-sm">
                  {Object.entries(plan.features || {}).map(([k, v]) => (
                    <li key={k} className="flex items-start gap-2">
                      <span>✓</span> <span>{k}: {String(v)}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`block text-center rounded-xl py-2.5 mt-6 text-sm font-medium transition-colors ${
                    isDiamond
                      ? "bg-gold-400 text-[#14111A] hover:bg-gold-500"
                      : isPro
                        ? "bg-white text-plum-600 hover:bg-white/90"
                        : "bg-rose-500 text-white hover:bg-rose-600"
                  }`}
                >
                  Get Started →
                </Link>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-ink/40 mb-10">
          Premium plans do not guarantee dates, matches, or replies — they improve platform reach and features.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {[
            ["📈", "More Matches", "Increase your chances"],
            ["👁️", "Better Visibility", "Get noticed faster"],
            ["🎛️", "Advanced Filters", "Find exactly what you want"],
            ["🎧", "Priority Support", "We're here for you"],
          ].map(([icon, title, desc]) => (
            <div key={title} className="surface-card p-4 text-center">
              <span className="text-xl">{icon}</span>
              <p className="text-xs font-semibold mt-2">{title}</p>
              <p className="text-[10px] text-ink/50 mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
