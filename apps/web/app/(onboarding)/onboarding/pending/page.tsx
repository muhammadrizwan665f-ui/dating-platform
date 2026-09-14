"use client";
import Link from "next/link";

export default function OnboardingPendingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 via-base to-plum-500/10 flex items-center justify-center px-6">
      <div className="surface-card p-8 max-w-sm text-center">
        <p className="text-4xl mb-3">⏳</p>
        <h1 className="font-display text-xl font-semibold">Profile aur Payment Review Mein Hai</h1>
        <p className="text-sm text-ink/60 mt-2">
          Hamari team dono cheezein verify kar rahi hai — profile approve hote hi aapko notification mil jayegi,
          phir aap DilMil poori tarah use kar sakte ho.
        </p>
        <Link href="/dashboard" className="inline-block mt-6 text-sm text-rose-500 font-medium">
          Dashboard Dekho →
        </Link>
      </div>
    </main>
  );
}
