"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar, EmptyState } from "../../../components/ui/primitives";

interface MatchItem {
  matchId: string;
  userId: string;
  displayName: string;
  city?: string;
  photoUrl?: string | null;
  matchedAt: string;
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/matches").then((r) => r.json()).then((d) => setMatches(d.matches ?? [])).finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-base pb-20 px-4 pt-8 max-w-lg mx-auto">
      <h1 className="font-display text-2xl font-semibold text-center mb-6">Matches</h1>

      {!loading && matches.length === 0 && (
        <EmptyState title="No new matches yet" description="Try expanding your preferences or check back after browsing Discover." />
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {matches.map((m) => (
          <Link key={m.matchId} href="/messages" className="surface-card p-4 flex flex-col items-center text-center">
            <Avatar src={m.photoUrl} alt={m.displayName} size={64} />
            <p className="text-sm font-medium mt-2">{m.displayName}</p>
            <p className="text-xs text-ink/50">{m.city}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
