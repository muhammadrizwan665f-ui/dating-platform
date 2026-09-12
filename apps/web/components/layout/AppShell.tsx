"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import clsx from "clsx";

const NAV = [
  ["/dashboard", "Dashboard", "🏠"],
  ["/discover", "Discover", "🔍"],
  ["/matches", "Matches", "💞"],
  ["/messages", "Messages", "💬"],
  ["/connections", "Connections", "🤝"],
  ["/feed", "Feed", "📸"],
  ["/profile/edit", "Profile", "👤"],
  ["/membership", "Membership", "💎"],
  ["/settings", "Settings", "⚙️"],
] as const;

const BOTTOM_NAV = [
  ["/dashboard", "Home", "🏠"],
  ["/discover", "Discover", "🔍"],
  ["/matches", "Matches", "💞"],
  ["/messages", "Messages", "💬"],
  ["/profile/edit", "Profile", "👤"],
] as const;

interface Viewer {
  displayName: string | null;
  photoUrl: string | null;
  membershipBadge: string | null;
  unreadNotifications: number;
}

export function AppShell({ viewer, children }: { viewer: Viewer; children: React.ReactNode }) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="min-h-screen bg-base flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-[#14111A] text-white/80 min-h-screen sticky top-0">
        <Link href="/dashboard" className="flex items-center gap-1.5 font-display text-lg font-semibold text-white px-6 py-6">
          💗 DilMil
        </Link>
        <nav className="flex-1 px-3 space-y-1">
          {NAV.map(([href, label, icon]) => {
            const active = pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  active ? "bg-rose-500 text-white" : "hover:bg-white/5"
                )}
              >
                <span className="text-base">{icon}</span> {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4">
          <Link
            href="/membership"
            className="block text-center rounded-xl bg-gradient-to-r from-rose-500 to-plum-500 text-white text-sm font-semibold py-3 hover:opacity-90 transition-opacity"
          >
            💎 Upgrade to Pro
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full text-center text-xs text-white/40 mt-4 hover:text-white/70 transition-colors"
          >
            Log out
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-base/90 backdrop-blur-md border-b border-black/5 flex items-center gap-3 px-4 sm:px-6 py-3">
          <Link href="/dashboard" className="lg:hidden font-display text-lg font-semibold text-rose-500 flex items-center gap-1">
            💗 DilMil
          </Link>
          <div className="hidden sm:flex flex-1 max-w-md items-center gap-2 bg-black/5 rounded-full px-4 py-2 text-sm text-ink/40">
            🔍 <span>Search people, interests, or cities…</span>
          </div>
          <div className="flex-1 sm:hidden" />
          <Link href="/notifications" className="relative p-2 rounded-full hover:bg-black/5 transition-colors">
            🔔
            {viewer.unreadNotifications > 0 && (
              <span className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center">
                {viewer.unreadNotifications > 9 ? "9+" : viewer.unreadNotifications}
              </span>
            )}
          </Link>
          <Link href="/profile/edit" className="h-9 w-9 rounded-full bg-rose-100 flex items-center justify-center overflow-hidden shrink-0">
            {viewer.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={viewer.photoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-rose-400 text-sm font-semibold">{viewer.displayName?.charAt(0) ?? "?"}</span>
            )}
          </Link>
        </header>

        <main className="flex-1 pb-24 lg:pb-10">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-black/5 flex">
        {BOTTOM_NAV.map(([href, label, icon]) => {
          const active = pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx("flex-1 flex flex-col items-center justify-center py-2.5 text-xs gap-0.5", active ? "text-rose-500" : "text-ink/40")}
            >
              <span className="text-lg">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
