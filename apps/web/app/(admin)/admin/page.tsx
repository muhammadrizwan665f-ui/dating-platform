"use client";
import { useEffect, useState } from "react";

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

  const cards: [string, keyof Stats][] = [
    ["Total Users", "totalUsers"],
    ["Active Users", "activeUsers"],
    ["New Today", "newRegistrationsToday"],
    ["Male", "maleUsers"],
    ["Female", "femaleUsers"],
    ["Demo Profiles", "demoProfiles"],
    ["Pending Profile Reviews", "pendingProfiles"],
    ["Approved Profiles", "approvedProfiles"],
    ["Rejected Profiles", "rejectedProfiles"],
    ["Pending Payments", "pendingPayments"],
    ["Approved Payments", "approvedPayments"],
    ["Active Memberships", "activeSubscriptions"],
    ["Total Revenue (Rs.)", "revenue"],
    ["Today's Revenue (Rs.)", "todayRevenue"],
    ["This Month (Rs.)", "monthRevenue"],
    ["Matches", "matches"],
    ["Messages", "messages"],
    ["Open Reports", "openReports"],
    ["Suspended", "suspended"],
    ["Banned", "banned"],
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
          {cards.map(([label, key]) => (
            <div key={key} className="surface-card p-5">
              <p className="text-xs text-ink/50">{label}</p>
              <p className="text-2xl font-semibold mt-1">{stats ? stats[key] : "—"}</p>
            </div>
          ))}
        </div>
    </>
  );
}
