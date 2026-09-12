"use client";
import { useState } from "react";

export default function AdminBulkPostsPage() {
  const [text, setText] = useState("");
  const [delimiter, setDelimiter] = useState("NEWLINE");
  const [customDelimiter, setCustomDelimiter] = useState("");
  const [authorMode, setAuthorMode] = useState<"RANDOM_DEMO" | "SPECIFIC">("RANDOM_DEMO");
  const [preview, setPreview] = useState<string[] | null>(null);
  const [previewCount, setPreviewCount] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const effectiveDelimiter = delimiter === "CUSTOM" ? customDelimiter : delimiter;

  const generatePreview = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/bulk-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, delimiter: effectiveDelimiter, authorMode, dryRun: true }),
      });
      const data = await res.json();
      if (data.success) {
        setPreview(data.preview);
        setPreviewCount(data.count);
      } else {
        alert(data.error);
      }
    } finally {
      setGenerating(false);
    }
  };

  const publishAll = async () => {
    if (!confirm(`Publish ${previewCount} posts?`)) return;
    setPublishing(true);
    try {
      const res = await fetch("/api/admin/bulk-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, delimiter: effectiveDelimiter, authorMode }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`${data.created} posts published successfully.`);
        setPreview(null);
        setText("");
      } else {
        alert(data.error);
      }
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-semibold mb-1">Bulk Post Generator</h1>
      <p className="text-sm text-ink/50 mb-6">
        Paste many posts at once, separated by your chosen delimiter — never split on commas, since captions can
        contain them naturally.
      </p>

      <div className="surface-card p-5 mb-6 space-y-4">
        <div>
          <label className="block text-xs text-ink/50 mb-1">Delimiter</label>
          <div className="flex flex-wrap gap-2">
            {[
              ["NEWLINE", "New Line"],
              ["---", "---"],
              ["###", "###"],
              ["CUSTOM", "Custom"],
            ].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setDelimiter(val)}
                className={`text-xs px-3 py-1.5 rounded-full ${delimiter === val ? "bg-rose-500 text-white" : "bg-black/5 text-ink/60"}`}
              >
                {label}
              </button>
            ))}
          </div>
          {delimiter === "CUSTOM" && (
            <input
              value={customDelimiter}
              onChange={(e) => setCustomDelimiter(e.target.value)}
              placeholder="Type your custom delimiter"
              className="mt-2 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
            />
          )}
        </div>

        <div>
          <label className="block text-xs text-ink/50 mb-1">Author</label>
          <select value={authorMode} onChange={(e) => setAuthorMode(e.target.value as any)} className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm">
            <option value="RANDOM_DEMO">Random demo profile per post</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-ink/50 mb-1">Paste posts</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder={"Post one text here\n\nPost two text here\n\nPost three text here"}
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm font-mono"
          />
        </div>

        <button
          onClick={generatePreview}
          disabled={generating || !text.trim()}
          className="rounded-xl bg-rose-500 hover:bg-rose-600 transition-colors text-white px-5 py-2.5 text-sm font-medium disabled:opacity-50"
        >
          {generating ? "Generating…" : "Generate Preview"}
        </button>
      </div>

      {preview && (
        <div className="surface-card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium">Preview — {previewCount} post(s) found</p>
            <button
              onClick={publishAll}
              disabled={publishing}
              className="rounded-lg bg-success text-white px-4 py-2 text-xs font-medium disabled:opacity-50"
            >
              {publishing ? "Publishing…" : "Publish All"}
            </button>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {preview.map((p, i) => (
              <div key={i} className="rounded-lg bg-black/[0.03] p-3 text-xs">
                <span className="text-ink/40 font-semibold mr-2">#{i + 1}</span>
                {p}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
