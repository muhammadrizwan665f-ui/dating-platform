"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Notif = { id: string; type: string; payload: any; readAt: string | null; createdAt: string };

const LABELS: Record<string, (n: Notif) => { text: string; href: string }> = {
  NEW_LIKE: () => ({ text: "Someone liked your profile ❤️", href: "/matches" }),
  NEW_MATCH: () => ({ text: "You have a new match! 🎉", href: "/matches" }),
  NEW_MESSAGE: () => ({ text: "You have a new message 💬", href: "/messages" }),
  CONNECTION_REQUEST: () => ({ text: "New connection request", href: "/connections" }),
  CONNECTION_ACCEPTED: () => ({ text: "Your connection request was accepted", href: "/connections" }),
  POST_LIKE: () => ({ text: "Someone liked your post", href: "/feed" }),
  COMMENT: () => ({ text: "Someone commented on your post", href: "/feed" }),
  PROFILE_APPROVED: () => ({ text: "Your profile was approved ✅", href: "/discover" }),
  PROFILE_REJECTED: () => ({ text: "Your profile needs changes", href: "/profile/edit" }),
  PAYMENT_APPROVED: () => ({ text: "Your payment was approved", href: "/membership" }),
  PAYMENT_REJECTED: () => ({ text: "Your payment was rejected — please resubmit", href: "/membership" }),
  MEMBERSHIP_ACTIVATED: () => ({ text: "Your membership is now active 🌟", href: "/membership" }),
  WHATSAPP_REQUEST: () => ({ text: "Someone requested your WhatsApp number", href: "/whatsapp-requests" }),
  WHATSAPP_ACCEPTED: () => ({ text: "Your WhatsApp request was accepted!", href: "/whatsapp-requests" }),
  ADMIN_ANNOUNCEMENT: () => ({ text: "Announcement from DilMil", href: "/notifications" }),
};

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => setNotifs(d.notifications ?? []))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: "{}" });
    load();
  };

  if (loading) return <p className="text-center py-20 text-sm text-ink/50">Loading…</p>;

  return (
    <div className="px-4 sm:px-6 py-6 max-w-md mx-auto ">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold">Notifications</h1>
        {notifs.some((n) => !n.readAt) && (
          <button onClick={markAllRead} className="text-xs font-medium text-rose-500">Mark all read</button>
        )}
      </div>

      {notifs.length === 0 && (
        <p className="text-center text-sm text-ink/40 surface-card p-8">
          No notifications yet ❤️<br />Activity on your profile will show up here.
        </p>
      )}

      <div className="space-y-2">
        {notifs.map((n) => {
          const meta = LABELS[n.type]?.(n) ?? { text: n.type, href: "#" };
          return (
            <Link
              key={n.id}
              href={meta.href}
              className={`block surface-card p-4 ${!n.readAt ? "border-l-4 border-rose-400" : "opacity-70"}`}
            >
              <p className="text-sm">{meta.text}</p>
              <p className="text-xs text-ink/40 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
