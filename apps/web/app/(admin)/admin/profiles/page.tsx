"use client";
import { useEffect, useState } from "react";
import { Button } from "../../../../components/ui/Button";
import { Avatar, Badge } from "../../../../components/ui/primitives";

interface PendingProfile {
  id: string;
  displayName: string;
  city: string;
  bio?: string | null;
  dob: string;
  interests: string[];
  status: string;
  verified: boolean;
  completeness: number;
  photos: { url: string; isPrimary: boolean }[];
  user: { email?: string; phone?: string };
}

const STATUSES = ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "DRAFT", "SUSPENDED"];

export default function AdminProfilesPage() {
  const [profiles, setProfiles] = useState<PendingProfile[]>([]);
  const [status, setStatus] = useState("SUBMITTED");
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetch(`/api/admin/profiles?status=${status}`)
      .then((r) => r.json())
      .then((d) => setProfiles(d.profiles ?? []))
      .finally(() => setLoading(false));
  }
  useEffect(load, [status]);

  async function act(id: string, action: string) {
    if (["SUSPEND", "BAN"].includes(action) && !confirm(`Are you sure you want to ${action.toLowerCase()} this profile?`)) return;
    await fetch(`/api/admin/profiles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    load();
  }

  return (
    <>
      <h1 className="font-display text-2xl font-semibold mb-4">Profile Reviews</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full ${status === s ? "bg-rose-500 text-white" : "bg-black/5 text-ink/60"}`}
          >
            {s.replace("_", " ")}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-ink/50">Loading…</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((p) => (
            <div key={p.id} className="surface-card p-4">
              <div className="flex items-center gap-3">
                <Avatar src={p.photos.find((ph) => ph.isPrimary)?.url} alt={p.displayName} size={48} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {p.displayName} {p.verified && <Badge tone="success">Verified</Badge>}
                  </p>
                  <p className="text-xs text-ink/50">{p.city} · {p.completeness}% complete</p>
                </div>
              </div>

              {p.photos.length > 1 && (
                <div className="flex gap-1.5 mt-3 overflow-x-auto">
                  {p.photos.map((ph) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={ph.url} src={ph.url} alt="" className="h-14 w-14 rounded-lg object-cover shrink-0" />
                  ))}
                </div>
              )}

              {p.bio && <p className="text-sm text-ink/70 mt-3 line-clamp-3">{p.bio}</p>}
              {p.interests?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {p.interests.slice(0, 5).map((i) => <Badge key={i}>{i}</Badge>)}
                </div>
              )}
              <p className="text-xs text-ink/40 mt-2">DOB: {new Date(p.dob).toLocaleDateString()}</p>
              <p className="text-xs text-ink/40">{p.user.email ?? p.user.phone}</p>

              <div className="flex flex-wrap gap-1.5 mt-4">
                <Button size="sm" onClick={() => act(p.id, "APPROVE")}>Approve</Button>
                <Button size="sm" variant="danger" onClick={() => act(p.id, "REJECT")}>Reject</Button>
                <Button size="sm" variant="ghost" onClick={() => act(p.id, "REQUEST_CHANGES")}>Request Changes</Button>
                <Button size="sm" variant="ghost" onClick={() => act(p.id, "SUSPEND")}>Suspend</Button>
                <Button size="sm" variant="danger" onClick={() => act(p.id, "BAN")}>Ban</Button>
              </div>
            </div>
          ))}
          {profiles.length === 0 && <p className="text-sm text-ink/50">No profiles with this status.</p>}
        </div>
      )}
    </>
  );
}
