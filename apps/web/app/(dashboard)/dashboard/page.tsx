"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BottomNavigation } from "../../../components/layout/Navigation";

interface Summary {
  displayName: string | null;
  profileCompleteness: number;
  profileStatus: string;
  membershipPlan: string | null;
  likesReceived: number;
  matches: number;
  connections: number;
  unreadNotifications: number;
  conversations: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<Summary | null>(null);

  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then(setData);
  }, []);

  const quickActions = [
    ["Discover", "/discover", "🔍"],
    ["Matches", "/matches", "❤️"],
    ["Messages", "/messages", "💬"],
    ["Feed", "/feed", "📸"],
    ["Edit Profile", "/profile/edit", "✏️"],
    ["Membership", "/membership", "💎"],
  ];

  return (
    <main className="min-h-screen bg-base pb-24 px-4 pt-8 max-w-md mx-auto">
      <h1 className="font-display text-2xl font-semibold mb-1">
        {data?.displayName ? `Hi, ${data.displayName} 👋` : "Welcome to DilMil"}
      </h1>
      <p className="text-sm text-ink/50 mb-6">Here's what's happening with your profile.</p>

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

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="surface-card p-4">
          <p className="text-xs text-ink/50">Likes Received</p>
          <p className="text-2xl font-semibold mt-1">{data?.likesReceived ?? "—"}</p>
        </div>
        <div className="surface-card p-4">
          <p className="text-xs text-ink/50">Matches</p>
          <p className="text-2xl font-semibold mt-1">{data?.matches ?? "—"}</p>
        </div>
        <div className="surface-card p-4">
          <p className="text-xs text-ink/50">Connections</p>
          <p className="text-2xl font-semibold mt-1">{data?.connections ?? "—"}</p>
        </div>
        <div className="surface-card p-4">
          <p className="text-xs text-ink/50">Membership</p>
          <p className="text-lg font-semibold mt-1">{data?.membershipPlan ?? "Basic"}</p>
        </div>
      </div>

      {data && data.unreadNotifications > 0 && (
        <Link href="/notifications" className="block surface-card p-4 mb-6 flex items-center justify-between">
          <span className="text-sm font-medium">🔔 {data.unreadNotifications} new notification{data.unreadNotifications !== 1 ? "s" : ""}</span>
          <span className="text-rose-500 text-xs font-medium">View →</span>
        </Link>
      )}

      <p className="text-sm font-medium mb-3">Quick Actions</p>
      <div className="grid grid-cols-3 gap-3">
        {quickActions.map(([label, href, icon]) => (
          <Link key={href} href={href} className="surface-card p-4 text-center">
            <span className="text-2xl block mb-1">{icon}</span>
            <span className="text-xs font-medium">{label}</span>
          </Link>
        ))}
      </div>

      <BottomNavigation />
    </main>
  );
}
