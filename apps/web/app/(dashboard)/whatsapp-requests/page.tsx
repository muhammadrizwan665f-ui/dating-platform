"use client";
import { useEffect, useState } from "react";
import { BottomNavigation } from "../../../components/layout/Navigation";
import { Button } from "../../../components/ui/Button";

type Incoming = { requesterId: string; requesterName: string; status: string; createdAt: string };
type Sent = { targetId: string; status: string; revealedNumber: string | null; createdAt: string };

export default function WhatsappRequestsPage() {
  const [incoming, setIncoming] = useState<Incoming[]>([]);
  const [sent, setSent] = useState<Sent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch("/api/whatsapp-requests")
      .then((r) => r.json())
      .then((d) => { setIncoming(d.incoming ?? []); setSent(d.sent ?? []); })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const respond = async (requesterId: string, action: "ACCEPT" | "DECLINE") => {
    await fetch("/api/whatsapp-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requesterId, action }),
    });
    load();
  };

  if (loading) return <p className="text-center py-20 text-sm text-ink/50">Loading…</p>;

  return (
    <main className="min-h-screen bg-base pb-24 px-4 pt-8 max-w-md mx-auto space-y-8">
      <h1 className="font-display text-2xl font-semibold">WhatsApp Requests</h1>

      <div>
        <p className="text-sm font-medium mb-3">Waiting on you</p>
        {incoming.length === 0 && <p className="text-xs text-ink/40 surface-card p-4">No pending requests.</p>}
        <div className="space-y-2">
          {incoming.map((r) => (
            <div key={r.requesterId} className="surface-card p-4 flex items-center gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium">{r.requesterName}</p>
                <p className="text-xs text-ink/40">wants your WhatsApp number</p>
              </div>
              <Button size="sm" onClick={() => respond(r.requesterId, "ACCEPT")}>Accept</Button>
              <Button size="sm" variant="ghost" onClick={() => respond(r.requesterId, "DECLINE")}>Decline</Button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium mb-3">Your requests</p>
        {sent.length === 0 && <p className="text-xs text-ink/40 surface-card p-4">You haven't requested anyone's number yet.</p>}
        <div className="space-y-2">
          {sent.map((r) => (
            <div key={r.targetId} className="surface-card p-4">
              {r.status === "ACCEPTED" && r.revealedNumber ? (
                <>
                  <p className="text-xs text-ink/40 mb-1">Shared their number:</p>
                  <a href={`https://wa.me/${r.revealedNumber.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="text-sm font-medium text-success">
                    {r.revealedNumber} — Open in WhatsApp
                  </a>
                </>
              ) : (
                <p className="text-sm text-ink/50">
                  Status: <span className="font-medium">{r.status}</span>
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <BottomNavigation />
    </main>
  );
}
