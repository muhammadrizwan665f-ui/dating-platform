"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PostCard, PostData } from "../../../components/feed/PostCard";
import { CommentsModal } from "../../../components/feed/CommentsModal";
import { EmptyState, LoadingSkeleton } from "../../../components/ui/primitives";
import { Button } from "../../../components/ui/Button";

interface Suggested {
  id: string;
  displayName: string;
  age: number;
  city: string;
  photoUrl: string | null;
}

const TRENDING = ["#Love", "#Pakistan", "#Travel", "#GoodVibes", "#Relationship", "#Life", "#Coffee", "#Music", "#Dreams"];

export default function FeedPage() {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [caption, setCaption] = useState("");
  const [posting, setPosting] = useState(false);
  const [suggested, setSuggested] = useState<Suggested[]>([]);
  const [postImage, setPostImage] = useState<File | null>(null);
  const [postImagePreview, setPostImagePreview] = useState<string | null>(null);
  const [postError, setPostError] = useState<string | null>(null);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/posts")
      .then((r) => r.json())
      .then((data) => setPosts(data.posts ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    fetch("/api/discover?limit=4")
      .then((r) => r.json())
      .then((d) => setSuggested((d.profiles ?? []).slice(0, 4)))
      .catch(() => {});
  }, []);

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPostImage(file);
    setPostImagePreview(URL.createObjectURL(file));
  }

  function removeImage() {
    setPostImage(null);
    setPostImagePreview(null);
  }

  async function createPost() {
    if (!caption.trim() && !postImage) return;
    setPosting(true);
    setPostError(null);
    try {
      let imageKeys: string[] = [];
      if (postImage) {
        const formData = new FormData();
        formData.append("file", postImage);
        const uploadRes = await fetch("/api/profile/photos/upload", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          setPostError(uploadData.error || "Image upload failed.");
          setPosting(false);
          return;
        }
        imageKeys = [uploadData.url];
      }
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption, imageKeys }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setPostError(data.error ? JSON.stringify(data.error) : "Couldn't publish your post.");
        setPosting(false);
        return;
      }
      setCaption("");
      removeImage();
      load();
    } catch {
      setPostError("Something went wrong. Please try again.");
    } finally {
      setPosting(false);
    }
  }

  async function toggleLike(id: string) {
    await fetch(`/api/posts/${id}/like`, { method: "POST" });
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-6xl mx-auto grid lg:grid-cols-[220px_1fr_260px] gap-6">
      {/* Left: feed nav */}
      <aside className="hidden lg:block">
        <div className="surface-card p-2 space-y-1 sticky top-20">
          {[
            ["Home", "/feed", "🏠"],
            ["My Posts", "/feed", "📷"],
            ["Connections", "/connections", "🤝"],
          ].map(([label, href, icon]) => (
            <Link key={label} href={href} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm hover:bg-black/5 transition-colors">
              <span>{icon}</span> {label}
            </Link>
          ))}
        </div>
      </aside>

      {/* Center: feed */}
      <div className="space-y-4">
        <div className="surface-card p-4">
          <textarea
            className="w-full text-sm outline-none resize-none"
            placeholder="What's on your mind?"
            rows={2}
            maxLength={2000}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
          {postImagePreview && (
            <div className="relative mt-2 inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={postImagePreview} alt="" className="max-h-48 rounded-xl object-cover" />
              <button
                onClick={removeImage}
                className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>
          )}
          {postError && <p className="text-xs text-danger mt-2">{postError}</p>}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/5">
            <label className="text-xs text-ink/40 cursor-pointer hover:text-rose-500 transition-colors">
              📷 Add Photo
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageSelect} className="hidden" />
            </label>
            <Button size="sm" onClick={createPost} loading={posting} disabled={!caption.trim() && !postImage}>
              Post
            </Button>
          </div>
        </div>

        {loading && (
          <div className="space-y-3">
            <LoadingSkeleton className="h-48" />
            <LoadingSkeleton className="h-48" />
          </div>
        )}

        {!loading && posts.length === 0 && (
          <EmptyState title="Nothing here yet" description="Be the first to share something with the community." />
        )}

        {posts.map((post) => (
          <PostCard key={post.id} post={post} onToggleLike={toggleLike} onOpenComments={setActiveCommentPostId} />
        ))}
      </div>

      {/* Right: suggestions + trending */}
      <aside className="space-y-6">
        <div>
          <p className="text-sm font-medium mb-3">People You May Like</p>
          <div className="space-y-2">
            {suggested.map((p) => (
              <Link key={p.id} href={`/profile/${p.id}`} className="surface-card p-2.5 flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-full bg-rose-50 overflow-hidden shrink-0">
                  {p.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.photoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-rose-300 text-xs font-semibold">{p.displayName.charAt(0)}</div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{p.displayName}, {p.age}</p>
                  <p className="text-[10px] text-ink/40">{p.city}</p>
                </div>
              </Link>
            ))}
            {suggested.length === 0 && <p className="text-xs text-ink/40 surface-card p-3">No suggestions yet.</p>}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-3">Trending Interests</p>
          <div className="flex flex-wrap gap-1.5">
            {TRENDING.map((t) => (
              <span key={t} className="text-[10px] bg-rose-50 text-rose-600 px-2.5 py-1 rounded-full">{t}</span>
            ))}
          </div>
        </div>
      </aside>

      {activeCommentPostId && (
        <CommentsModal
          postId={activeCommentPostId}
          onClose={() => setActiveCommentPostId(null)}
          onCommentAdded={load}
        />
      )}
    </div>
  );
}
