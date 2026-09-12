"use client";
import { useEffect, useState } from "react";
import { PostCard, PostData } from "../../../components/feed/PostCard";
import { EmptyState, LoadingSkeleton } from "../../../components/ui/primitives";
import { Button } from "../../../components/ui/Button";
import { BottomNavigation, Navbar } from "../../../components/layout/Navigation";

export default function FeedPage() {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [caption, setCaption] = useState("");
  const [posting, setPosting] = useState(false);

  function load() {
    setLoading(true);
    fetch("/api/posts")
      .then((r) => r.json())
      .then((data) => setPosts(data.posts ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function createPost() {
    if (!caption.trim()) return;
    setPosting(true);
    await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caption }),
    });
    setCaption("");
    setPosting(false);
    load();
  }

  async function toggleLike(id: string) {
    await fetch(`/api/posts/${id}/like`, { method: "POST" });
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-base pb-20 px-4 pt-6 max-w-xl mx-auto space-y-4">
        <div className="surface-card p-4">
          <textarea
            className="w-full text-sm outline-none resize-none"
            placeholder="What's on your mind?"
            rows={2}
            maxLength={2000}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
          <div className="flex justify-end mt-2">
            <Button size="sm" onClick={createPost} loading={posting} disabled={!caption.trim()}>
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
          <PostCard key={post.id} post={post} onToggleLike={toggleLike} onOpenComments={() => {}} />
        ))}
      </main>
    </>
  );
}
