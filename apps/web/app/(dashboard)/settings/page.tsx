"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/primitives";
import { BottomNavigation } from "../../../components/layout/Navigation";
import { ThemePicker } from "../../../components/settings/ThemePicker";

export default function SettingsPage() {
  const router = useRouter();
  const [showOnline, setShowOnline] = useState(true);
  const [showLastSeen, setShowLastSeen] = useState(true);
  const [hideProfile, setHideProfile] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function savePrivacy() {
    await fetch("/api/settings/privacy", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ showOnline, showLastSeen, hideProfile }),
    });
  }

  async function deleteAccount() {
    setDeleting(true);
    await fetch("/api/account/delete", { method: "POST" });
    router.push("/");
  }

  return (
    <main className="min-h-screen bg-base pb-20 px-4 pt-8 max-w-md mx-auto space-y-6">
      <h1 className="font-display text-2xl font-semibold">Privacy & Safety</h1>

      <ThemePicker />

      <div className="surface-card p-5 space-y-4">
        <label className="flex items-center justify-between text-sm">
          Show online status
          <input type="checkbox" checked={showOnline} onChange={(e) => setShowOnline(e.target.checked)} />
        </label>
        <label className="flex items-center justify-between text-sm">
          Show last seen
          <input type="checkbox" checked={showLastSeen} onChange={(e) => setShowLastSeen(e.target.checked)} />
        </label>
        <label className="flex items-center justify-between text-sm">
          Hide my profile from Discover
          <input type="checkbox" checked={hideProfile} onChange={(e) => setHideProfile(e.target.checked)} />
        </label>
        <Button size="sm" onClick={savePrivacy}>Save</Button>
      </div>

      <div className="surface-card p-5">
        <p className="text-sm font-medium mb-2">Session</p>
        <Button variant="ghost" size="sm" onClick={() => fetch("/api/auth/logout-all", { method: "POST" })}>
          Log out of all devices
        </Button>
      </div>

      <div className="surface-card p-5 border-danger/20">
        <p className="text-sm font-medium text-danger">Danger zone</p>
        <p className="text-xs text-ink/50 mt-1 mb-3">
          Deleting your account deactivates your profile and stops discovery immediately.
        </p>
        <Button variant="danger" size="sm" onClick={() => setConfirmOpen(true)}>Delete my account</Button>
      </div>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <p className="font-medium">Delete your account?</p>
        <p className="text-sm text-ink/60 mt-2">This will hide your profile and stop all matching/chat. This action can't be easily undone.</p>
        <div className="flex gap-2 mt-4">
          <Button variant="danger" loading={deleting} onClick={deleteAccount}>Yes, delete</Button>
          <Button variant="ghost" onClick={() => setConfirmOpen(false)}>Cancel</Button>
        </div>
      </Modal>

      <BottomNavigation />
    </main>
  );
}
