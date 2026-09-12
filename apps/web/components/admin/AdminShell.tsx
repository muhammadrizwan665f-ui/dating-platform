"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const groups: { label: string; items: [string, string][] }[] = [
  {
    label: "Overview",
    items: [["/admin", "Dashboard"]],
  },
  {
    label: "People",
    items: [
      ["/admin/users", "Users"],
      ["/admin/profiles", "Profile Reviews"],
      ["/admin/demo-profiles", "Demo Profiles"],
      ["/admin/bulk-posts", "Bulk Posts"],
      ["/admin/admins", "Admin Users"],
    ],
  },
  {
    label: "Activity",
    items: [
      ["/admin/matches", "Matches"],
      ["/admin/messages", "Messages"],
      ["/admin/posts", "Posts & Comments"],
    ],
  },
  {
    label: "Money",
    items: [
      ["/admin/payments", "Payments"],
      ["/admin/plans", "Membership Plans"],
      ["/admin/payment-methods", "Payment Methods"],
      ["/admin/boosts", "Boosts"],
    ],
  },
  {
    label: "Trust & Safety",
    items: [
      ["/admin/reports", "Reports"],
      ["/admin/audit-logs", "Audit Logs"],
    ],
  },
  {
    label: "Site",
    items: [
      ["/admin/themes", "Themes"],
      ["/admin/settings", "Settings"],
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-60 shrink-0 border-r border-black/5 bg-white min-h-screen p-4 hidden md:block overflow-y-auto">
      <Link href="/admin" className="font-display text-lg font-semibold text-rose-500 mb-6 px-2 block">
        DilMil Admin
      </Link>
      <nav className="space-y-4">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-ink/35 mb-1">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  className={clsx(
                    "block px-3 py-2 rounded-lg text-sm font-medium",
                    pathname === href ? "bg-rose-50 text-rose-600" : "text-ink/60 hover:bg-black/5"
                  )}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}

export function AdminTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: (React.ReactNode[] & { key?: string })[];
}) {
  return (
    <div className="surface-card overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-black/5 text-left text-ink/50">
            {columns.map((c) => (
              <th key={c} className="px-4 py-3 font-medium whitespace-nowrap">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-black/5 last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 whitespace-nowrap">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
