"use client";
import { useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";
import clsx from "clsx";
import { ConversationList, ConversationSummary, ChatBubble, ChatMessage } from "../../../components/chat/Chat";
import { Avatar, EmptyState } from "../../../components/ui/primitives";
import { Button } from "../../../components/ui/Button";

export default function MessagesPage() {
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
      .then((d) => setConversations(d.conversations ?? []));

    // Realtime connection to the sidecar server (see apps/realtime). The JWT
    // here is the same NextAuth session token, verified server-side on connect.
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((session) => {
        setMeId(session?.user?.id ?? "");
        const socket = io(process.env.NEXT_PUBLIC_REALTIME_URL ?? "http://localhost:4001", {
          auth: { token: session?.accessToken },
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

  return (
    <main className="h-screen flex bg-base">
      <div className={clsx("w-full sm:w-80 border-r border-black/5 bg-white flex-col", activeId ? "hidden sm:flex" : "flex")}>
        <div className="p-4 border-b border-black/5 font-display text-lg font-semibold">Messages</div>
        <div className="flex-1 overflow-y-auto">
          <ConversationList conversations={conversations} activeId={activeId ?? undefined} onSelect={setActiveId} />
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
    </main>
  );
}
