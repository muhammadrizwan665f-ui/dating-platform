"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const items = [
  { href: "/dashboard", label: "Home", icon: "🏠" },
  { href: "/discover", label: "Discover", icon: "🔍" },
  { href: "/matches", label: "Matches", icon: "❤" },
  { href: "/messages", label: "Messages", icon: "💬" },
  { href: "/profile", label: "Profile", icon: "👤" },
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
  return (
    <header className="hidden sm:flex items-center justify-between px-8 py-4 border-b border-black/5 bg-white/80 backdrop-blur sticky top-0 z-30">
      <Link href="/" className="font-display text-xl font-semibold text-rose-500">
        Humraah
      </Link>
      <nav className="flex items-center gap-6 text-sm font-medium text-ink/70">
        <Link href="/discover">Discover</Link>
        <Link href="/how-it-works">How It Works</Link>
        <Link href="/safety">Safety</Link>
        <Link href="/pricing">Pricing</Link>
      </nav>
      <div className="flex items-center gap-3">
        <Link href="/login" className="text-sm font-medium text-ink/70">
          Login
        </Link>
        <Link
          href="/register"
          className="text-sm font-medium bg-rose-500 text-white rounded-xl px-4 py-2 hover:bg-rose-600"
        >
          Create Account
        </Link>
      </div>
    </header>
  );
}
