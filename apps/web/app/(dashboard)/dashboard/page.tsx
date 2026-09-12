"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Summary {
  displayName: string | null;
  photoUrl: string | null;
  city: string | null;
  age: number | null;
  verified: boolean;
  profileCompleteness: number;
  profileStatus: string;
  membershipPlan: string | null;
  likesReceived: number;
  matches: number;
  connections: number;
  unreadNotifications: number;
  conversations: number;
  profileViews: number;
  recentActivity: { type: string; text: string; at: string }[];
  featuredProfile: {
    userId: string;
    displayName: string;
    age: number;
    city: string;
    bio: string | null;
    verified: boolean;
    photoUrl: string | null;
  } | null;
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function DashboardPage() {
  const [data, setData] = useState<Summary | null>(null);
  const [liking, setLiking] = useState(false);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then(setData);
  }, []);

  const like = async () => {
    if (!data?.featuredProfile) return;
    setLiking(true);
    try {
      await fetch("/api/discover/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId: data.featuredProfile.userId }),
      });
      setLiked(true);
    } finally {
      setLiking(false);
    }
  };

  const quickActions = [
    ["Discover", "/discover", "🔍"],
    ["Matches", "/matches", "💞"],
    ["Messages", "/messages", "💬"],
    ["Feed", "/feed", "📸"],
    ["Edit Profile", "/profile/edit", "✏️"],
    ["Membership", "/membership", "💎"],
  ] as const;

  const stats: [string, number | string, string][] = [
    ["Likes Received", data?.likesReceived ?? "—", "❤️"],
    ["Matches", data?.matches ?? "—", "💞"],
    ["Connections", data?.connections ?? "—", "👥"],
    ["Messages", data?.conversations ?? "—", "💬"],
    ["Profile Views", data?.profileViews ?? "—", "👁️"],
    ["Membership", data?.membershipPlan ?? "Basic", "💎"],
  ];

  return (
    <div className="px-4 sm:px-6 pt-6 max-w-6xl mx-auto grid lg:grid-cols-[260px_1fr_300px] gap-6">
      {/* LEFT: profile summary (desktop only, mobile sees it inline via header) */}
      <aside className="hidden lg:block">
        <div className="surface-card p-5 text-center sticky top-20">
          <div className="h-20 w-20 rounded-full mx-auto bg-rose-50 overflow-hidden mb-3">
            {data?.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.photoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-rose-300 text-2xl font-display">
                {data?.displayName?.charAt(0) ?? "?"}
              </div>
            )}
          </div>
          <p className="font-semibold text-sm flex items-center justify-center gap-1">
            {data?.displayName ?? "Your Profile"} {data?.verified && <span className="text-success text-xs">✓</span>}
          </p>
          <p className="text-xs text-ink/50">{data?.age ? `${data.age} · ` : ""}{data?.city ?? ""}</p>

          <div className="mt-4 text-left">
            <div className="flex justify-between text-[10px] text-ink/50 mb-1">
              <span>Profile Completion</span>
              <span>{data?.profileCompleteness ?? 0}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-black/5 overflow-hidden">
              <div className="h-full bg-rose-500 rounded-full transition-all" style={{ width: `${data?.profileCompleteness ?? 0}%` }} />
            </div>
          </div>
          {(data?.profileCompleteness ?? 0) < 100 && (
            <Link href="/profile/edit" className="block mt-3 text-xs font-medium text-rose-500">
              Complete Profile →
            </Link>
          )}
        </div>
      </aside>

      {/* CENTER: welcome + stats + quick actions */}
      <div>
        <h1 className="font-display text-2xl font-semibold mb-1">
          {data?.displayName ? `Good to see you, ${data.displayName} ❤️` : "Welcome to DilMil"}
        </h1>
        <p className="text-sm text-ink/50 mb-6">Here&apos;s what&apos;s happening with your DilMil account.</p>

        {data && data.profileStatus !== "APPROVED" && (
          <div className="surface-card p-4 mb-4 border-l-4 border-gold-400">
            <p className="text-sm font-medium">
              {data.profileStatus === "DRAFT" || data.profileStatus === "SUBMITTED"
                ? "Complete your profile to get more visibility."
                : data.profileStatus === "UNDER_REVIEW"
                  ? "Your profile is under review — we'll notify you once it's approved."
                  : "Your profile needs attention."}
            </p>
            <Link href="/profile/edit" className="text-xs text-rose-500 font-medium mt-1 inline-block">
              {data.profileCompleteness}% complete — finish now →
            </Link>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {stats.map(([label, value, icon]) => (
            <div key={label} className="surface-card p-4">
              <span className="text-lg">{icon}</span>
              <p className="text-xs text-ink/50 mt-2">{label}</p>
              <p className="text-xl font-semibold mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        {data && data.unreadNotifications > 0 && (
          <Link href="/notifications" className="flex surface-card p-4 mb-6 items-center justify-between">
            <span className="text-sm font-medium">🔔 {data.unreadNotifications} new notification{data.unreadNotifications !== 1 ? "s" : ""}</span>
            <span className="text-rose-500 text-xs font-medium">View →</span>
          </Link>
        )}

        <p className="text-sm font-medium mb-3">Quick Actions</p>
        <div className="grid grid-cols-3 gap-3">
          {quickActions.map(([label, href, icon]) => (
            <Link key={href} href={href} className="surface-card p-4 text-center hover:shadow-cardHover transition-shadow">
              <span className="text-2xl block mb-1">{icon}</span>
              <span className="text-xs font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* RIGHT: featured profile + recent activity */}
      <aside className="space-y-6">
        <div>
          <p className="text-sm font-medium mb-3">Your Next Connection</p>
          {data?.featuredProfile ? (
            <div className="surface-card overflow-hidden">
              <div className="relative aspect-[4/5] bg-rose-50">
                {data.featuredProfile.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={data.featuredProfile.photoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-rose-300 text-4xl font-display">
                    {data.featuredProfile.displayName.charAt(0)}
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="font-semibold text-sm flex items-center gap-1">
                  {data.featuredProfile.displayName}, {data.featuredProfile.age}
                  {data.featuredProfile.verified && <span className="text-success text-xs">✓</span>}
                </p>
                <p className="text-xs text-ink/50">{data.featuredProfile.city}</p>
                {data.featuredProfile.bio && <p className="text-xs text-ink/60 mt-2 line-clamp-2">{data.featuredProfile.bio}</p>}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={like}
                    disabled={liking || liked}
                    className="flex-1 bg-rose-500 text-white rounded-lg py-2 text-xs font-medium disabled:opacity-50"
                  >
                    {liked ? "Liked ❤️" : "❤️ Like"}
                  </button>
                  <Link href={`/profile/${data.featuredProfile.userId}`} className="flex-1 border border-black/10 rounded-lg py-2 text-xs font-medium text-center">
                    View Profile
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <p className="surface-card p-6 text-xs text-ink/40 text-center">Check back soon for new profiles!</p>
          )}
        </div>

        <div>
          <p className="text-sm font-medium mb-3">Recent Activity</p>
          <div className="surface-card divide-y divide-black/5">
            {(data?.recentActivity?.length ?? 0) === 0 && (
              <p className="p-4 text-xs text-ink/40">No activity yet — start discovering people!</p>
            )}
            {data?.recentActivity.map((a, i) => (
              <div key={i} className="p-3 flex items-start gap-2">
                <span>{a.type === "MATCH" ? "💞" : "❤️"}</span>
                <div className="min-w-0">
                  <p className="text-xs">{a.text}</p>
                  <p className="text-[10px] text-ink/40 mt-0.5">{timeAgo(a.at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
