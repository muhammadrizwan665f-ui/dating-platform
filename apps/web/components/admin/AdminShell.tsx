"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const items = [
  ["/admin", "Dashboard"],
  ["/admin/users", "Users"],
  ["/admin/profiles", "Profiles"],
  ["/admin/payments", "Payments"],
  ["/admin/reports", "Reports"],
] as const;

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-56 shrink-0 border-r border-black/5 bg-white min-h-screen p-4 hidden md:block">
      <p className="font-display text-lg font-semibold text-rose-500 mb-6 px-2">Admin</p>
      <nav className="space-y-1">
        {items.map(([href, label]) => (
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
