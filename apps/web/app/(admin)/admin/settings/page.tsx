"use client";
import { useEffect, useState } from "react";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => setSettings(d.settings ?? {}))
      .finally(() => setLoading(false));
  }, []);

  const set = (key: string, value: string) => setSettings((s) => ({ ...s, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-ink/50">Loading…</p>;

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-2xl font-semibold mb-6">Settings</h1>

      <div className="surface-card p-5 space-y-4">
        <div>
          <label className="block text-xs text-ink/50 mb-1">Site Name</label>
          <input value={settings.site_name} onChange={(e) => set("site_name", e.target.value)} className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-ink/50 mb-1">Support Email</label>
          <input value={settings.support_email} onChange={(e) => set("support_email", e.target.value)} className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-ink/50 mb-1">Support WhatsApp Number</label>
          <input value={settings.support_whatsapp} onChange={(e) => set("support_whatsapp", e.target.value)} className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm" placeholder="+92..." />
        </div>

        <label className="flex items-center justify-between text-sm pt-2 border-t border-black/5">
          Require profile review before going live
          <input type="checkbox" checked={settings.profile_review_required === "true"} onChange={(e) => set("profile_review_required", String(e.target.checked))} />
        </label>
        <label className="flex items-center justify-between text-sm">
          Auto-approve profile photos (skip manual moderation)
          <input type="checkbox" checked={settings.auto_approve_photos === "true"} onChange={(e) => set("auto_approve_photos", String(e.target.checked))} />
        </label>

        <div className="pt-3 border-t border-black/5">
          <p className="text-sm font-medium mb-2">Homepage Community Stats</p>
          <p className="text-xs text-ink/50 mb-3">Shown on the public homepage — set real numbers as your community grows.</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-ink/50 mb-1">Active Users</label>
              <input value={settings.stat_active_users} onChange={(e) => set("stat_active_users", e.target.value)} placeholder="e.g. 500+" className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-ink/50 mb-1">Daily Matches</label>
              <input value={settings.stat_daily_matches} onChange={(e) => set("stat_daily_matches", e.target.value)} placeholder="e.g. 50+" className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-ink/50 mb-1">Messages Sent</label>
              <input value={settings.stat_messages_sent} onChange={(e) => set("stat_messages_sent", e.target.value)} placeholder="e.g. 2K+" className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-ink/50 mb-1">User Satisfaction</label>
              <input value={settings.stat_satisfaction} onChange={(e) => set("stat_satisfaction", e.target.value)} placeholder="e.g. 4.8/5" className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
            </div>
          </div>
        </div>

        <button onClick={save} disabled={saving} className="rounded-lg bg-rose-500 text-white px-5 py-2 text-sm font-medium disabled:opacity-50">
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
