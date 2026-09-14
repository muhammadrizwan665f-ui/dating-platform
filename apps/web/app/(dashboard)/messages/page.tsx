"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import io, { Socket } from "socket.io-client";
import clsx from "clsx";
import { ConversationList, ConversationSummary, ChatBubble, ChatMessage } from "../../../components/chat/Chat";
import { Avatar, EmptyState } from "../../../components/ui/primitives";
import { Button } from "../../../components/ui/Button";

export default function MessagesPage() {
  return (
    <Suspense fallback={null}>
      <MessagesPageInner />
    </Suspense>
  );
}

function MessagesPageInner() {
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [meId, setMeId] = useState<string>("");
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/chat/conversations")
      .then((r) => r.json())
      .then((d) => {
        setConversations(d.conversations ?? []);
        // Deep link from a profile page's "Send Message" button: find or
        // create the conversation, then auto-select it.
        const withUserId = searchParams.get("with");
        if (withUserId) {
          fetch("/api/chat/start", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ targetUserId: withUserId }),
          })
            .then((r) => r.json())
            .then((startRes) => {
              if (startRes.conversationId) {
                setActiveId(startRes.conversationId);
                // Refresh the list so the new/found conversation appears with its real metadata.
                fetch("/api/chat/conversations")
                  .then((r) => r.json())
                  .then((d2) => setConversations(d2.conversations ?? []));
              }
            });
        }
      });

    // Realtime connection to the sidecar server (see apps/realtime). We mint
    // a small dedicated token (see /api/realtime-token) rather than trying
    // to hand over NextAuth's own encrypted session cookie, which the
    // realtime server can't verify directly.
    Promise.all([
      fetch("/api/auth/session").then((r) => r.json()),
      fetch("/api/realtime-token").then((r) => r.json()),
    ]).then(([session, tokenRes]) => {
        setMeId(session?.user?.id ?? "");
        const socket = io(process.env.NEXT_PUBLIC_REALTIME_URL ?? "http://localhost:4001", {
          auth: { token: tokenRes?.token },
        });
        socket.on("message:new", ({ conversationId, message }) => {
          if (conversationId === activeId) setMessages((prev) => [...prev, message]);
          setConversations((prev) => prev.map((c) => (c.id === conversationId ? { ...c, lastMessage: message.body, unreadCount: c.unreadCount + 1 } : c)));
        });
        socketRef.current = socket;
      });

    return () => {
      socketRef.current?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeId) return;
    fetch(`/api/chat/messages?conversationId=${activeId}`)
      .then((r) => r.json())
      .then((d) => setMessages(d.messages ?? []));
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!draft.trim() || !activeId) return;
    const optimistic: ChatMessage = {
      id: `tmp-${Date.now()}`,
      body: draft,
      senderId: meId,
      createdAt: new Date().toISOString(),
      status: "SENT",
    };
    setMessages((prev) => [...prev, optimistic]);
    setDraft("");
    const res = await fetch("/api/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: activeId, body: optimistic.body }),
    });
    if (!res.ok) {
      setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? { ...m, status: "FAILED" } : m)));
    }
  }

  const activeConversation = conversations.find((c) => c.id === activeId);
  const [search, setSearch] = useState("");
  const filteredConversations = conversations.filter((c) =>
    c.otherUser.displayName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-65px)] bg-base -mx-4 sm:-mx-6 -mt-6">
      <div className={clsx("w-full sm:w-80 border-r border-black/5 bg-white flex-col", activeId ? "hidden sm:flex" : "flex")}>
        <div className="p-4 border-b border-black/5">
          <p className="font-display text-lg font-semibold mb-3">Messages</p>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search here…"
            className="w-full rounded-xl bg-black/5 px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-200"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-3xl mb-2">💬</p>
              <p className="text-sm font-medium">Your conversations will appear here ❤️</p>
              <p className="text-xs text-ink/50 mt-1">Match with someone and start a conversation.</p>
            </div>
          ) : (
            <ConversationList conversations={filteredConversations} activeId={activeId ?? undefined} onSelect={setActiveId} />
          )}
        </div>
      </div>

      <div className={clsx("flex-1 flex-col", activeId ? "flex" : "hidden sm:flex")}>
        {!activeId ? (
          <EmptyState title="Select a conversation" description="Choose someone from the list to start chatting." />
        ) : (
          <>
            <header className="flex items-center gap-3 px-4 py-3 border-b border-black/5 bg-white sticky top-0">
              <button className="sm:hidden text-ink/50" onClick={() => setActiveId(null)}>←</button>
              <Avatar src={activeConversation?.otherUser.photoUrl} alt={activeConversation?.otherUser.displayName ?? ""} />
              <span className="font-medium text-sm">{activeConversation?.otherUser.displayName}</span>
            </header>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
              {messages.map((m) => (
                <ChatBubble key={m.id} message={m} isMine={m.senderId === meId} />
              ))}
              <div ref={bottomRef} />
            </div>

            <div className="p-3 border-t border-black/5 bg-white flex items-center gap-2 sticky bottom-0">
              <input
                className="flex-1 rounded-full border border-black/10 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-400/40"
                placeholder="Type a message"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
              />
              <Button size="sm" onClick={send} disabled={!draft.trim()}>
                Send
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
