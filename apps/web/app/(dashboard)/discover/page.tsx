"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Badge } from "../../../components/ui/primitives";
import { EmptyState, LoadingSkeleton } from "../../../components/ui/primitives";

interface Profile {
  id: string;
  displayName: string;
  age: number;
  city: string;
  verified: boolean;
  bio: string | null;
  interests: string[];
  photoUrl: string | null;
}

const PAGE_SIZE = 20;

export default function DiscoverPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [matchedName, setMatchedName] = useState<string | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  const loadPage = useCallback(async (skip: number, replace: boolean) => {
    const res = await fetch(`/api/discover?skip=${skip}&take=${PAGE_SIZE}`).then((r) => r.json());
    setProfiles((prev) => (replace ? res.profiles ?? [] : [...prev, ...(res.profiles ?? [])]));
    setHasMore(!!res.hasMore);
    setTotal(res.total ?? 0);
  }, []);

  useEffect(() => {
    loadPage(0, true).finally(() => setLoading(false));
  }, [loadPage]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      await loadPage(profiles.length, false);
    } finally {
      setLoadingMore(false);
    }
  };

  async function handleLike(id: string, displayName: string) {
    setLikedIds((prev) => new Set(prev).add(id));
    const res = await fetch("/api/discover/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toUserId: id }),
    }).then((r) => r.json());
    if (res.matched) setMatchedName(displayName);
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold">Discover People ❤️</h1>
        {total > 0 && <span className="text-xs text-ink/50">{total} profiles</span>}
      </div>

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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <LoadingSkeleton key={i} className="h-64" />)}
        </div>
      )}

      {!loading && profiles.length === 0 && (
        <EmptyState title="No new profiles right now" description="Check back soon, or try expanding your preferences in Settings." />
      )}

      {!loading && profiles.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {profiles.map((p) => (
              <div key={p.id} className="surface-card overflow-hidden hover:shadow-cardHover transition-shadow">
                <Link href={`/profile/${p.id}`} className="block">
                  <div className="relative aspect-square bg-rose-50">
                    {p.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.photoUrl} alt={p.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-rose-300 text-3xl font-display">
                        {p.displayName.charAt(0)}
                      </div>
                    )}
                    {p.verified && (
                      <span className="absolute top-2 left-2 text-[10px] bg-white/90 rounded-full px-2 py-0.5 font-medium text-success">✓ Verified</span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold">{p.displayName}, {p.age}</p>
                    <p className="text-xs text-ink/50">{p.city}</p>
                    {p.interests.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {p.interests.slice(0, 2).map((i) => <Badge key={i}>{i}</Badge>)}
                      </div>
                    )}
                  </div>
                </Link>
                <div className="px-3 pb-3">
                  <button
                    onClick={() => handleLike(p.id, p.displayName)}
                    disabled={likedIds.has(p.id)}
                    className="w-full bg-rose-500 text-white rounded-xl py-2 text-xs font-medium disabled:opacity-50 hover:bg-rose-600 transition-colors"
                  >
                    {likedIds.has(p.id) ? "Liked ❤️" : "❤️ Like"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="text-center mt-8">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="rounded-xl border border-black/10 px-6 py-2.5 text-sm font-medium hover:bg-black/5 transition-colors disabled:opacity-50"
              >
                {loadingMore ? "Loading…" : "Load More Profiles"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
