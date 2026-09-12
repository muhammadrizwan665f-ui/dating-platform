"use client";
import { useEffect, useState } from "react";
import { ProfileCard, ProfileCardData } from "../../../components/profile/ProfileCard";
import { EmptyState, LoadingSkeleton } from "../../../components/ui/primitives";

export default function DiscoverPage() {
  const [profiles, setProfiles] = useState<ProfileCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchedName, setMatchedName] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/discover")
      .then((r) => r.json())
      .then((data) => setProfiles(data.profiles ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function handleLike(id: string) {
    const target = profiles.find((p) => p.id === id);
    setProfiles((prev) => prev.filter((p) => p.id !== id));
    const res = await fetch("/api/discover/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toUserId: id }),
    }).then((r) => r.json());
    if (res.matched && target) setMatchedName(target.displayName);
  }

  function handlePass(id: string) {
    setProfiles((prev) => prev.filter((p) => p.id !== id));
    fetch("/api/discover/pass", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toUserId: id }),
    });
  }

  return (
    <main className="min-h-screen bg-base pb-20 px-4 pt-8">
      <h1 className="font-display text-2xl font-semibold text-center mb-6">Discover</h1>

      {matchedName && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-6" onClick={() => setMatchedName(null)}>
          <div className="bg-white rounded-3xl p-8 text-center max-w-xs">
            <p className="text-3xl mb-2">🎉</p>
            <h2 className="font-display text-xl font-semibold">It&apos;s a Match!</h2>
            <p className="text-sm text-ink/60 mt-1">You and {matchedName} liked each other.</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="max-w-sm mx-auto space-y-3">
          <LoadingSkeleton className="h-[420px]" />
        </div>
      )}

      {!loading && profiles.length === 0 && (
        <EmptyState title="No new profiles right now" description="Check back soon, or try expanding your preferences in Settings." />
      )}

      {!loading && profiles[0] && (
        <ProfileCard profile={profiles[0]} onLike={handleLike} onPass={handlePass} />
      )}
    </main>
  );
}
