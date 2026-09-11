"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BottomNavigation } from "../../../components/layout/Navigation";

type Row = { userId: string; profile: { displayName: string; city: string; photos: { url: string }[] } | null };

export default function LikesPage() {
  const [tab, setTab] = useState<"likedMe" | "myLikes">("likedMe");
  const [likedMe, setLikedMe] = useState<Row[]>([]);
  const [myLikes, setMyLikes] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/likes")
      .then((r) => r.json())
      .then((d) => {
        setLikedMe(d.likedMe ?? []);
        setMyLikes(d.myLikes ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const rows = tab === "likedMe" ? likedMe : myLikes;

  if (loading) return <p className="text-center py-20 text-sm text-ink/50">Loading…</p>;

  return (
    <main className="min-h-screen bg-base pb-24 px-4 pt-8 max-w-md mx-auto">
      <h1 className="font-display text-2xl font-semibold mb-4">Likes</h1>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("likedMe")}
          className={`text-xs font-medium px-3 py-1.5 rounded-full ${tab === "likedMe" ? "bg-rose-500 text-white" : "bg-black/5 text-ink/60"}`}
        >
          Who Liked Me ({likedMe.length})
        </button>
        <button
          onClick={() => setTab("myLikes")}
          className={`text-xs font-medium px-3 py-1.5 rounded-full ${tab === "myLikes" ? "bg-rose-500 text-white" : "bg-black/5 text-ink/60"}`}
        >
          My Likes ({myLikes.length})
        </button>
      </div>

      {rows.length === 0 && (
        <p className="text-center text-sm text-ink/40 surface-card p-8">
          {tab === "likedMe"
            ? "No one has liked you yet — keep your profile fresh!"
            : "You haven't liked anyone yet — head to Discover."}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        {rows.map((r) => (
          <Link key={r.userId} href={`/profile/${r.userId}`} className="surface-card overflow-hidden">
            <div className="relative aspect-square bg-rose-50">
              {r.profile?.photos[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.profile.photos[0].url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-rose-300 text-2xl font-display">
                  {r.profile?.displayName?.charAt(0) || "?"}
                </div>
              )}
            </div>
            <div className="p-2">
              <p className="text-xs font-medium truncate">{r.profile?.displayName || "Unknown"}</p>
              <p className="text-[10px] text-ink/40">{r.profile?.city}</p>
            </div>
          </Link>
        ))}
      </div>

      <BottomNavigation />
    </main>
  );
}
