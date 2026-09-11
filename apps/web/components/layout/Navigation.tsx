"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const items = [
  { href: "/dashboard", label: "Home", icon: "🏠" },
  { href: "/discover", label: "Discover", icon: "🔍" },
  { href: "/matches", label: "Matches", icon: "❤" },
  { href: "/messages", label: "Messages", icon: "💬" },
  { href: "/notifications", label: "Alerts", icon: "🔔" },
  { href: "/profile/edit", label: "Profile", icon: "👤" },
];

export function BottomNavigation() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-black/5 flex sm:hidden">
      {items.map((item) => {
        const active = pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "flex-1 flex flex-col items-center justify-center py-2.5 text-xs gap-0.5",
              active ? "text-rose-500" : "text-ink/40"
            )}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const links = [
    ["/", "Home"],
    ["/how-it-works", "How It Works"],
    ["/safety", "Safety"],
    ["/pricing", "Pricing"],
    ["/themes", "Themes"],
    ["/contact", "Contact"],
  ] as const;

  return (
    <header className="sticky top-0 z-30 bg-base/80 backdrop-blur-md border-b border-black/5">
      <div className="flex items-center justify-between px-5 sm:px-8 py-4 max-w-6xl mx-auto">
        <Link href="/" className="flex items-center gap-1.5 font-display text-xl font-semibold text-rose-500">
          <span aria-hidden>💗</span> DilMil
        </Link>

        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-ink/60">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className="hover:text-rose-500 transition-colors">
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden sm:flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-ink/70 hover:text-rose-500 transition-colors">
            Login
          </Link>
          <Link
            href="/register"
            className="text-sm font-semibold bg-rose-500 text-white rounded-xl px-5 py-2.5 hover:bg-rose-600 transition-colors shadow-sm"
          >
            Create Account
          </Link>
        </div>

        <button
          aria-label="Toggle menu"
          onClick={() => setMobileOpen((v) => !v)}
          className="lg:hidden sm:hidden text-2xl text-ink/70 px-1"
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>

      {mobileOpen && (
        <div className="sm:hidden border-t border-black/5 bg-base px-5 py-4 space-y-3">
          {links.map(([href, label]) => (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-ink/70">
              {label}
            </Link>
          ))}
          <div className="flex gap-3 pt-2 border-t border-black/5">
            <Link href="/login" onClick={() => setMobileOpen(false)} className="flex-1 text-center text-sm font-medium border border-black/10 rounded-xl py-2.5">
              Login
            </Link>
            <Link href="/register" onClick={() => setMobileOpen(false)} className="flex-1 text-center text-sm font-semibold bg-rose-500 text-white rounded-xl py-2.5">
              Create Account
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
