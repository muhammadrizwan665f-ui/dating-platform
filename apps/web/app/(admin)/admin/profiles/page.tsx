"use client";
import { useEffect, useState } from "react";
import { Button } from "../../../../components/ui/Button";
import { Avatar } from "../../../../components/ui/primitives";

interface PendingProfile {
  id: string;
  displayName: string;
  city: string;
  bio?: string | null;
  dob: string;
  photos: { url: string; isPrimary: boolean }[];
  user: { email?: string; phone?: string };
}

export default function AdminProfilesPage() {
  const [profiles, setProfiles] = useState<PendingProfile[]>([]);

  function load() {
    fetch("/api/admin/profiles").then((r) => r.json()).then((d) => setProfiles(d.profiles ?? []));
  }
  useEffect(load, []);

  async function act(id: string, action: "APPROVE" | "REJECT") {
    await fetch(`/api/admin/profiles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    load();
  }

  return (
    <>
        <h1 className="font-display text-2xl font-semibold mb-6">Profiles — Pending Review</h1>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((p) => (
            <div key={p.id} className="surface-card p-4">
              <div className="flex items-center gap-3">
                <Avatar src={p.photos.find((ph) => ph.isPrimary)?.url} alt={p.displayName} size={48} />
                <div>
                  <p className="font-medium text-sm">{p.displayName}</p>
                  <p className="text-xs text-ink/50">{p.city}</p>
                </div>
              </div>
              {p.bio && <p className="text-sm text-ink/70 mt-3 line-clamp-3">{p.bio}</p>}
              <p className="text-xs text-ink/40 mt-2">DOB: {new Date(p.dob).toLocaleDateString()}</p>
              <p className="text-xs text-ink/40">{p.user.email ?? p.user.phone}</p>
              <div className="flex gap-2 mt-4">
                <Button size="sm" onClick={() => act(p.id, "APPROVE")}>Approve</Button>
                <Button size="sm" variant="danger" onClick={() => act(p.id, "REJECT")}>Reject</Button>
              </div>
            </div>
          ))}
          {profiles.length === 0 && <p className="text-sm text-ink/50">No profiles pending review.</p>}
        </div>
    </>
  );
}
