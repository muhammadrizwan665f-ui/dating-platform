"use client";
import { useEffect, useState } from "react";

type Post = {
  id: string;
  caption: string | null;
  status: string;
  createdAt: string;
  author: { email: string | null };
  images: { url: string }[];
  _count: { likes: number; comments: number };
};

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");

  const load = () => {
    fetch("/api/admin/posts")
      .then((r) => r.json())
      .then((d) => setPosts(d.posts ?? []))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const setStatus = async (id: string, status: string) => {
    await fetch("/api/admin/posts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    load();
  };

  if (loading) return <p className="text-sm text-ink/50">Loading…</p>;

  const filtered = filter === "ALL" ? posts : posts.filter((p) => p.status === filter);

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-semibold mb-1">Posts & Comments</h1>
      <p className="text-sm text-ink/50 mb-4">Moderate the social feed — hide or remove content that breaks the rules.</p>

      <div className="flex gap-2 mb-4">
        {["ALL", "VISIBLE", "PENDING_REVIEW", "HIDDEN", "REMOVED"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full ${filter === s ? "bg-rose-500 text-white" : "bg-black/5 text-ink/60"}`}
          >
            {s.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((p) => (
          <div key={p.id} className="surface-card p-4 flex gap-4">
            {p.images[0] && <img src={p.images[0].url} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0 bg-rose-50" />}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-ink/40">{p.author.email} · {new Date(p.createdAt).toLocaleDateString()}</p>
              <p className="text-sm truncate">{p.caption || <em className="text-ink/30">No caption</em>}</p>
              <p className="text-xs text-ink/40 mt-1">{p._count.likes} likes · {p._count.comments} comments</p>
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              <span className="text-[10px] font-semibold uppercase text-ink/40 text-right">{p.status.replace("_", " ")}</span>
              <div className="flex gap-1">
                {p.status !== "VISIBLE" && <button onClick={() => setStatus(p.id, "VISIBLE")} className="text-xs text-success font-medium">Approve</button>}
                {p.status !== "HIDDEN" && <button onClick={() => setStatus(p.id, "HIDDEN")} className="text-xs text-ink/50 font-medium">Hide</button>}
                {p.status !== "REMOVED" && <button onClick={() => setStatus(p.id, "REMOVED")} className="text-xs text-danger font-medium">Remove</button>}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-xs text-ink/40 surface-card p-4">No posts here.</p>}
      </div>
    </div>
  );
}
