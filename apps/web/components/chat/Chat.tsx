"use client";
import clsx from "clsx";
import { Avatar, Badge } from "../ui/primitives";

export interface ConversationSummary {
  id: string;
  otherUser: { id: string; displayName: string; photoUrl?: string | null; online?: boolean };
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
}: {
  conversations: ConversationSummary[];
  activeId?: string;
  onSelect: (id: string) => void;
}) {
  if (conversations.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-ink/50">Your conversations will appear here.</div>
    );
  }
  return (
    <ul className="divide-y divide-black/5">
      {conversations.map((c) => (
        <li key={c.id}>
          <button
            onClick={() => onSelect(c.id)}
            className={clsx(
              "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-black/[0.03] transition-colors",
              activeId === c.id && "bg-rose-50"
            )}
          >
            <div className="relative">
              <Avatar src={c.otherUser.photoUrl} alt={c.otherUser.displayName} size={48} />
              {c.otherUser.online && (
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-success border-2 border-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm truncate">{c.otherUser.displayName}</span>
                {c.lastMessageAt && (
                  <span className="text-xs text-ink/40 shrink-0">
                    {new Date(c.lastMessageAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-sm text-ink/50 truncate">{c.lastMessage ?? "Say hello 👋"}</p>
                {c.unreadCount > 0 && (
                  <span className="ml-2 shrink-0 h-5 min-w-[1.25rem] px-1 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center">
                    {c.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}

export interface ChatMessage {
  id: string;
  body: string;
  senderId: string;
  createdAt: string;
  status: "SENT" | "DELIVERED" | "READ" | "FAILED";
}

const statusIcon: Record<ChatMessage["status"], string> = {
  SENT: "✓",
  DELIVERED: "✓✓",
  READ: "✓✓",
  FAILED: "!",
};

export function ChatBubble({ message, isMine }: { message: ChatMessage; isMine: boolean }) {
  return (
    <div className={clsx("flex", isMine ? "justify-end" : "justify-start")}>
      <div
        className={clsx(
          "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
          isMine ? "bg-rose-500 text-white rounded-br-md" : "bg-black/5 text-ink rounded-bl-md"
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.body}</p>
        <div className={clsx("flex items-center gap-1 mt-1 text-[10px]", isMine ? "text-white/70 justify-end" : "text-ink/40")}>
          <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          {isMine && (
            <span className={clsx(message.status === "READ" && "text-sky-200")}>{statusIcon[message.status]}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center my-3">
      <Badge>{label}</Badge>
    </div>
  );
}
