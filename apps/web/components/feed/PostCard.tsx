"use client";
import { useState } from "react";
import { Avatar, Badge } from "../ui/primitives";

export interface PostData {
  id: string;
  author: { id: string; displayName: string; city: string; verified: boolean; photoUrl?: string | null };
  caption?: string | null;
  images: string[];
  createdAt: string;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export function PostCard({
  post,
  onToggleLike,
  onOpenComments,
}: {
  post: PostData;
  onToggleLike: (id: string) => void;
  onOpenComments: (id: string) => void;
}) {
  const [optimisticLiked, setOptimisticLiked] = useState(post.likedByMe);
  const [optimisticCount, setOptimisticCount] = useState(post.likeCount);

  function handleLike() {
    setOptimisticLiked((v) => !v);
    setOptimisticCount((c) => (optimisticLiked ? c - 1 : c + 1));
    onToggleLike(post.id);
  }

  return (
    <article className="surface-card p-4">
      <header className="flex items-center gap-3">
        <Avatar src={post.author.photoUrl} alt={post.author.displayName} />
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-sm">{post.author.displayName}</span>
            {post.author.verified && <Badge tone="success">✓</Badge>}
          </div>
          <p className="text-xs text-ink/50">
            {post.author.city} · {timeAgo(post.createdAt)}
          </p>
        </div>
      </header>

      {post.caption && <p className="text-sm text-ink/90 mt-3">{post.caption}</p>}

      {post.images.length > 0 && (
        <div className={`mt-3 grid gap-1.5 rounded-xl overflow-hidden ${post.images.length > 1 ? "grid-cols-2" : ""}`}>
          {post.images.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt="" loading="lazy" className="w-full h-full object-cover aspect-square" />
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 mt-3 text-sm text-ink/50">
        <span>{optimisticCount} Likes</span>
        <button onClick={() => onOpenComments(post.id)}>{post.commentCount} Comments</button>
      </div>

      <div className="flex items-center border-t border-black/5 mt-3 pt-2 text-sm font-medium">
        <button
          onClick={handleLike}
          className={`flex-1 py-1.5 rounded-lg transition-colors ${optimisticLiked ? "text-rose-500" : "text-ink/60 hover:bg-black/5"}`}
        >
          {optimisticLiked ? "♥ Liked" : "♡ Like"}
        </button>
        <button
          onClick={() => onOpenComments(post.id)}
          className="flex-1 py-1.5 rounded-lg text-ink/60 hover:bg-black/5"
        >
          💬 Comment
        </button>
      </div>
    </article>
  );
}

export function CommentCard({
  author,
  photoUrl,
  body,
  createdAt,
}: {
  author: string;
  photoUrl?: string | null;
  body: string;
  createdAt: string;
}) {
  return (
    <div className="flex gap-2.5 py-2">
      <Avatar src={photoUrl} alt={author} size={32} />
      <div className="bg-black/[0.03] rounded-2xl px-3 py-2 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium">{author}</span>
          <span className="text-xs text-ink/40">{timeAgo(createdAt)}</span>
        </div>
        <p className="text-sm text-ink/80">{body}</p>
      </div>
    </div>
  );
}
