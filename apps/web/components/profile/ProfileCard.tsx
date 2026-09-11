"use client";
import Link from "next/link";
import { Badge, Avatar } from "../ui/primitives";
import { Button } from "../ui/Button";

export interface ProfileCardData {
  id: string;
  displayName: string;
  age: number;
  city: string;
  photoUrl?: string | null;
  verified: boolean;
  bio?: string | null;
  interests: string[];
}

export function ProfileCard({
  profile,
  onLike,
  onPass,
}: {
  profile: ProfileCardData;
  onLike: (id: string) => void;
  onPass: (id: string) => void;
}) {
  return (
    <div className="surface-card overflow-hidden w-full max-w-sm mx-auto transition-shadow hover:shadow-cardHover">
      <Link href={`/profile/${profile.id}`} className="block">
        <div className="relative aspect-[4/5] bg-rose-50">
          {profile.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.photoUrl} alt={profile.displayName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-rose-300 text-5xl font-display">
              {profile.displayName.charAt(0)}
            </div>
          )}
          {profile.verified && (
            <div className="absolute top-3 left-3">
              <Badge tone="success">Verified ✓</Badge>
            </div>
          )}
        </div>
        <div className="px-4 pt-4">
          <div className="flex items-baseline gap-2">
            <h3 className="font-semibold text-lg">{profile.displayName}</h3>
            <span className="text-ink/50">{profile.age}</span>
          </div>
          <p className="text-sm text-ink/50">{profile.city}</p>
          {profile.bio && <p className="text-sm text-ink/70 mt-2 line-clamp-2">{profile.bio}</p>}
          {profile.interests.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {profile.interests.slice(0, 4).map((i) => (
                <Badge key={i}>{i}</Badge>
              ))}
            </div>
          )}
        </div>
      </Link>
      <div className="p-4 pt-0">
        <div className="flex items-center justify-between mt-4">
          <button
            aria-label="Pass"
            onClick={() => onPass(profile.id)}
            className="h-12 w-12 rounded-full border border-black/10 flex items-center justify-center text-xl text-ink/40 hover:border-danger hover:text-danger transition-colors"
          >
            ✕
          </button>
          <button
            aria-label="Like"
            onClick={() => onLike(profile.id)}
            className="h-14 w-14 rounded-full bg-rose-500 text-white flex items-center justify-center text-2xl shadow-card hover:bg-rose-600 transition-colors"
          >
            ❤
          </button>
        </div>
      </div>
    </div>
  );
}
