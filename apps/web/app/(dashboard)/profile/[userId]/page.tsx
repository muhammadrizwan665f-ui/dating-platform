"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "../../../../components/ui/primitives";
import { Button } from "../../../../components/ui/Button";
import { BottomNavigation } from "../../../../components/layout/Navigation";

type ProfileDetail = {
  userId: string;
  displayName: string;
  age: number;
  city: string;
  bio: string | null;
  interests: string[];
  intention: string;
  education: string | null;
  profession: string | null;
  languages: string[];
  verified: boolean;
  photos: string[];
  isSelf: boolean;
  alreadyLiked: boolean;
  whatsappStatus: string | null;
};

export default function ProfileDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);
  const [liking, setLiking] = useState(false);
  const [requestingWA, setRequestingWA] = useState(false);

  useEffect(() => {
    fetch(`/api/profile/${userId}`)
      .then((r) => {
        if (!r.ok) { setNotFound(true); throw new Error(); }
        return r.json();
      })
      .then(setProfile)
      .catch(() => {});
  }, [userId]);

  const like = async () => {
    setLiking(true);
    try {
      await fetch("/api/discover/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId: userId }),
      });
      setProfile((p) => (p ? { ...p, alreadyLiked: true } : p));
    } finally {
      setLiking(false);
    }
  };

  const requestWhatsapp = async () => {
    setRequestingWA(true);
    try {
      await fetch("/api/whatsapp-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId: userId }),
      });
      setProfile((p) => (p ? { ...p, whatsappStatus: "PENDING" } : p));
    } finally {
      setRequestingWA(false);
    }
  };

  const report = async () => {
    const reason = prompt(
      "Reason? Type one of: FAKE_PROFILE, SPAM, HARASSMENT, SCAM, IMPERSONATION, INAPPROPRIATE_CONTENT, THREATENING_BEHAVIOUR, OTHER"
    );
    const validReasons = ["FAKE_PROFILE", "SPAM", "HARASSMENT", "SCAM", "IMPERSONATION", "INAPPROPRIATE_CONTENT", "THREATENING_BEHAVIOUR", "OTHER"];
    if (!reason || !validReasons.includes(reason.toUpperCase())) return;
    await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType: "PROFILE", targetId: userId, reason: reason.toUpperCase() }),
    });
    alert("Report submitted — thank you for helping keep DilMil safe.");
  };

  const block = async () => {
    if (!confirm("Block this user? They won't be able to contact you.")) return;
    await fetch("/api/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blockedId: userId }),
    });
    router.back();
  };

  if (notFound) return <p className="text-center py-20 text-sm text-ink/50">Profile not available.</p>;
  if (!profile) return <p className="text-center py-20 text-sm text-ink/50">Loading…</p>;

  return (
    <main className="min-h-screen bg-base pb-24 max-w-md mx-auto">
      <div className="relative aspect-[4/5] bg-rose-50">
        {profile.photos.length > 0 ? (
          <img src={profile.photos[activePhoto]} alt={profile.displayName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-rose-300 text-6xl font-display">
            {profile.displayName.charAt(0)}
          </div>
        )}
        {profile.photos.length > 1 && (
          <div className="absolute top-3 inset-x-3 flex gap-1">
            {profile.photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setActivePhoto(i)}
                className={`h-1 flex-1 rounded-full ${i === activePhoto ? "bg-white" : "bg-white/40"}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="p-5 space-y-4">
        <div>
          <div className="flex items-baseline gap-2">
            <h1 className="font-display text-2xl font-semibold">{profile.displayName}</h1>
            <span className="text-ink/50">{profile.age}</span>
            {profile.verified && <Badge tone="success">Verified ✓</Badge>}
          </div>
          <p className="text-sm text-ink/50">{profile.city}</p>
        </div>

        {profile.bio && <p className="text-sm text-ink/70">{profile.bio}</p>}

        <div className="flex flex-wrap gap-2 text-xs text-ink/50">
          {profile.profession && <Badge>{profile.profession}</Badge>}
          {profile.education && <Badge>{profile.education}</Badge>}
          <Badge>{profile.intention.replace("_", " ")}</Badge>
        </div>

        {profile.interests.length > 0 && (
          <div>
            <p className="text-xs font-medium text-ink/50 mb-1.5">Interests</p>
            <div className="flex flex-wrap gap-1.5">
              {profile.interests.map((i) => <Badge key={i}>{i}</Badge>)}
            </div>
          </div>
        )}

        {!profile.isSelf && (
          <div className="space-y-2 pt-2">
            <Button className="w-full" loading={liking} disabled={profile.alreadyLiked} onClick={like}>
              {profile.alreadyLiked ? "Liked ❤" : "Like ❤"}
            </Button>

            {profile.whatsappStatus === "ACCEPTED" ? (
              <p className="text-xs text-success text-center">They've shared their WhatsApp — check your requests.</p>
            ) : profile.whatsappStatus === "PENDING" ? (
              <Button variant="ghost" className="w-full" disabled>Whatsapp request pending…</Button>
            ) : (
              <Button variant="ghost" className="w-full" loading={requestingWA} onClick={requestWhatsapp}>
                Request WhatsApp Number
              </Button>
            )}

            <div className="flex justify-center gap-4 pt-2">
              <button onClick={report} className="text-xs text-ink/40">Report</button>
              <button onClick={block} className="text-xs text-danger">Block</button>
            </div>
          </div>
        )}
      </div>

      <BottomNavigation />
    </main>
  );
}
