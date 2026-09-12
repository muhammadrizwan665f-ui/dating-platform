"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  totalUsers: number;
  maleUsers: number;
  femaleUsers: number;
  activeUsers: number;
  pendingProfiles: number;
  approvedProfiles: number;
  rejectedProfiles: number;
  pendingPayments: number;
  approvedPayments: number;
  activeSubscriptions: number;
  matches: number;
  messages: number;
  openReports: number;
  suspended: number;
  banned: number;
  revenue: number;
  todayRevenue: number;
  monthRevenue: number;
  demoProfiles: number;
  newRegistrationsToday: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats").then((r) => r.json()).then(setStats);
  }, []);

  const pendingActions = (stats?.pendingProfiles ?? 0) + (stats?.pendingPayments ?? 0) + (stats?.openReports ?? 0);

  const cards: [string, keyof Stats, string?][] = [
    ["Total Users", "totalUsers", "/admin/users"],
    ["Active Users", "activeUsers", "/admin/users"],
    ["New Today", "newRegistrationsToday", "/admin/users"],
    ["Male", "maleUsers"],
    ["Female", "femaleUsers"],
    ["Demo Profiles", "demoProfiles", "/admin/demo-profiles"],
    ["Pending Profile Reviews", "pendingProfiles", "/admin/profiles"],
    ["Approved Profiles", "approvedProfiles", "/admin/profiles"],
    ["Rejected Profiles", "rejectedProfiles", "/admin/profiles"],
    ["Pending Payments", "pendingPayments", "/admin/payments"],
    ["Approved Payments", "approvedPayments", "/admin/payments"],
    ["Active Memberships", "activeSubscriptions", "/admin/plans"],
    ["Total Revenue (Rs.)", "revenue", "/admin/payments"],
    ["Today's Revenue (Rs.)", "todayRevenue", "/admin/payments"],
    ["This Month (Rs.)", "monthRevenue", "/admin/payments"],
    ["Matches", "matches", "/admin/matches"],
    ["Messages", "messages", "/admin/messages"],
    ["Open Reports", "openReports", "/admin/reports"],
    ["Suspended", "suspended", "/admin/users"],
    ["Banned", "banned", "/admin/users"],
  ];

  return (
    <>
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl font-semibold">Dashboard</h1>
          {pendingActions > 0 && (
            <span className="text-xs font-semibold bg-danger/10 text-danger px-3 py-1.5 rounded-full">
              🔴 {pendingActions} Pending Action{pendingActions !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {cards.map(([label, key, href]) => {
            const content = (
              <>
                <p className="text-xs text-ink/50">{label}</p>
                <p className="text-2xl font-semibold mt-1">{stats ? stats[key] : "—"}</p>
              </>
            );
            return href ? (
              <Link key={key} href={href} className="surface-card p-5 block hover:shadow-cardHover hover:-translate-y-0.5 transition-all">
                {content}
              </Link>
            ) : (
              <div key={key} className="surface-card p-5">
                {content}
              </div>
            );
          })}
        </div>
    </>
  );
}
