"use client";
import { useEffect, useState } from "react";
import { CommentCard } from "./PostCard";
import { Button } from "../ui/Button";

interface Comment {
  id: string;
  body: string;
  createdAt: string;
  author: string;
  photoUrl?: string | null;
}

export function CommentsModal({ postId, onClose, onCommentAdded }: { postId: string; onClose: () => void; onCommentAdded?: () => void }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  function load() {
    fetch(`/api/posts/${postId}/comments`)
      .then((r) => r.json())
      .then((d) => setComments(d.comments ?? []))
      .finally(() => setLoading(false));
  }
  useEffect(load, [postId]);

  async function send() {
    if (!draft.trim()) return;
    setSending(true);
    try {
      await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: draft.trim() }),
      });
      setDraft("");
      load();
      onCommentAdded?.();
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-black/5">
          <p className="font-semibold text-sm">Comments</p>
          <button onClick={onClose} className="text-ink/40 text-lg">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-4">
          {loading && <p className="text-xs text-ink/40 py-6 text-center">Loading…</p>}
          {!loading && comments.length === 0 && (
            <p className="text-xs text-ink/40 py-6 text-center">No comments yet — be the first to say something.</p>
          )}
          {comments.map((c) => (
            <CommentCard key={c.id} author={c.author} photoUrl={c.photoUrl} body={c.body} createdAt={c.createdAt} />
          ))}
        </div>
        <div className="flex items-center gap-2 p-3 border-t border-black/5">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Write a comment…"
            className="flex-1 rounded-full bg-black/5 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-200"
          />
          <Button size="sm" onClick={send} loading={sending} disabled={!draft.trim()}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
