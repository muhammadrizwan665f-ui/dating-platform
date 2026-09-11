"use client";
import { useEffect, useState } from "react";

type Conv = { id: string; participants: (string | null)[]; messageCount: number; lastMessageAt: string | null };

export default function AdminMessagesPage() {
  const [total, setTotal] = useState(0);
  const [today, setToday] = useState(0);
  const [conversations, setConversations] = useState<Conv[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/messages")
      .then((r) => r.json())
      .then((d) => {
        setTotal(d.totalMessages ?? 0);
        setToday(d.todayMessages ?? 0);
        setConversations(d.conversations ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-ink/50">Loading…</p>;

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-semibold mb-1">Messages</h1>
      <p className="text-sm text-ink/50 mb-6">
        Private chat content stays private — this is activity oversight only, not a message reader.
      </p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="surface-card p-4">
          <p className="text-xs text-ink/50">Total Messages</p>
          <p className="text-2xl font-semibold mt-1">{total}</p>
        </div>
        <div className="surface-card p-4">
          <p className="text-xs text-ink/50">Today</p>
          <p className="text-2xl font-semibold mt-1">{today}</p>
        </div>
      </div>

      <p className="text-sm font-medium mb-2">Recent conversations</p>
      <div className="surface-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/5 text-left text-ink/50">
              <th className="px-4 py-3 font-medium">Participants</th>
              <th className="px-4 py-3 font-medium">Messages</th>
              <th className="px-4 py-3 font-medium">Last activity</th>
            </tr>
          </thead>
          <tbody>
            {conversations.map((c) => (
              <tr key={c.id} className="border-b border-black/5 last:border-0">
                <td className="px-4 py-3 whitespace-nowrap">{c.participants.filter(Boolean).join(" & ")}</td>
                <td className="px-4 py-3">{c.messageCount}</td>
                <td className="px-4 py-3 whitespace-nowrap text-xs text-ink/40">
                  {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
