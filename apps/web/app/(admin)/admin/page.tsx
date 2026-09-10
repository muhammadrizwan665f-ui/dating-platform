"use client";
import { useEffect, useState } from "react";

interface Stats {
  totalUsers: number;
  maleUsers: number;
  femaleUsers: number;
  pendingProfiles: number;
  pendingPayments: number;
  activeSubscriptions: number;
  matches: number;
  messages: number;
  openReports: number;
  suspended: number;
  banned: number;
  revenue: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats").then((r) => r.json()).then(setStats);
  }, []);

  const cards: [string, keyof Stats][] = [
    ["Total Users", "totalUsers"],
    ["Male", "maleUsers"],
    ["Female", "femaleUsers"],
    ["Pending Profile Reviews", "pendingProfiles"],
    ["Pending Payments", "pendingPayments"],
    ["Active Memberships", "activeSubscriptions"],
    ["Revenue (Rs.)", "revenue"],
    ["Matches", "matches"],
    ["Messages", "messages"],
    ["Open Reports", "openReports"],
    ["Suspended", "suspended"],
    ["Banned", "banned"],
  ];

  return (
    <>
        <h1 className="font-display text-2xl font-semibold mb-6">Dashboard</h1>
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
