"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "../../../components/ui/Button";
import { BottomNavigation } from "../../../components/layout/Navigation";

type Row = {
  id: string;
  otherUserId: string;
  profile: { displayName: string; city: string; photos: { url: string }[] } | null;
};

export default function ConnectionsPage() {
  const [tab, setTab] = useState<"connections" | "received" | "sent">("connections");
  const [connections, setConnections] = useState<Row[]>([]);
  const [received, setReceived] = useState<Row[]>([]);
  const [sent, setSent] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch("/api/connections")
      .then((r) => r.json())
      .then((d) => {
        setConnections(d.connections ?? []);
        setReceived(d.receivedRequests ?? []);
        setSent(d.sentRequests ?? []);
      })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const respond = async (connectionId: string, action: "ACCEPT" | "DECLINE") => {
    await fetch("/api/connections/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ connectionId, action }),
    });
    load();
  };

  const rows = tab === "connections" ? connections : tab === "received" ? received : sent;

  if (loading) return <p className="text-center py-20 text-sm text-ink/50">Loading…</p>;

  return (
    <main className="min-h-screen bg-base pb-24 px-4 pt-8 max-w-md mx-auto">
      <h1 className="font-display text-2xl font-semibold mb-4">Connections</h1>

      <div className="flex gap-2 mb-6">
        {[
          ["connections", `Connections (${connections.length})`],
          ["received", `Requests (${received.length})`],
          ["sent", `Sent (${sent.length})`],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key as any)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full ${tab === key ? "bg-rose-500 text-white" : "bg-black/5 text-ink/60"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {rows.length === 0 && (
          <p className="text-center text-sm text-ink/40 surface-card p-8">
            {tab === "connections" && "No connections yet — start discovering people!"}
            {tab === "received" && "No pending requests."}
            {tab === "sent" && "You haven't sent any requests."}
          </p>
        )}
        {rows.map((r) => (
          <div key={r.id} className="surface-card p-3 flex items-center gap-3">
            <Link href={`/profile/${r.otherUserId}`} className="flex items-center gap-3 flex-1 min-w-0">
              {r.profile?.photos[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.profile.photos[0].url} alt="" className="h-12 w-12 rounded-full object-cover bg-rose-50" />
              ) : (
                <div className="h-12 w-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-300 font-display">
                  {r.profile?.displayName?.charAt(0) || "?"}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{r.profile?.displayName || "Unknown"}</p>
                <p className="text-xs text-ink/40">{r.profile?.city}</p>
              </div>
            </Link>
            {tab === "received" && (
              <div className="flex gap-1.5 shrink-0">
                <Button size="sm" onClick={() => respond(r.id, "ACCEPT")}>Accept</Button>
                <Button size="sm" variant="ghost" onClick={() => respond(r.id, "DECLINE")}>Decline</Button>
              </div>
            )}
          </div>
        ))}
      </div>

      <BottomNavigation />
    </main>
  );
}
