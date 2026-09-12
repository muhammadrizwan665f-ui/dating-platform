import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [me, prefs] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.userPreference.findUnique({ where: { userId } }),
  ]);
  if (!me || !prefs) return NextResponse.json({ profiles: [] });

  const [likedIds, blockedByMe, blockedMe] = await Promise.all([
    prisma.like.findMany({ where: { fromUserId: userId }, select: { toUserId: true } }),
    prisma.block.findMany({ where: { blockerId: userId }, select: { blockedId: true } }),
    prisma.block.findMany({ where: { blockedId: userId }, select: { blockerId: true } }),
  ]);
  const excludeIds = new Set<string>([
    userId,
    ...likedIds.map((l) => l.toUserId),
    ...blockedByMe.map((b) => b.blockedId),
    ...blockedMe.map((b) => b.blockerId),
  ]);

  const now = new Date();
  const baseWhere = {
    status: "APPROVED" as const,
    hiddenFromDiscovery: false,
    gender: prefs.interestedIn,
    userId: { notIn: [...excludeIds] },
  };
  const includeShape = {
    photos: { where: { isPrimary: true }, take: 1 },
    user: {
      include: {
        subscriptions: {
          where: { status: "ACTIVE", endDate: { gt: now } },
          include: { plan: true },
        },
      },
    },
  };

  // Fallback hierarchy (spec §20): real users first; only fill remaining
  // slots with demo/community profiles if there aren't enough real ones.
  const realCandidates = await prisma.profile.findMany({
    where: { ...baseWhere, isDemo: false },
    include: includeShape,
    take: 200,
  });
  const candidates =
    realCandidates.length >= 20
      ? realCandidates
      : [
          ...realCandidates,
          ...(await prisma.profile.findMany({
            where: { ...baseWhere, isDemo: true },
            include: includeShape,
            take: 200 - realCandidates.length,
          })),
        ];

  function age(dob: Date) {
    const diff = now.getFullYear() - dob.getFullYear();
    const beforeBirthday = now.getMonth() < dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate());
    return beforeBirthday ? diff - 1 : diff;
  }

  // A deterministic pseudo-random value seeded by (5-minute time bucket +
  // profile id), NOT Math.random(). Same window -> same order for everyone;
  // the window itself changes every 5 minutes, rotating who gets seen
  // without ever touching the database (spec §19 — no delete/recreate).
  const ROTATION_WINDOW_MS = 5 * 60 * 1000;
  const rotationBucket = Math.floor(now.getTime() / ROTATION_WINDOW_MS);
  function seededJitter(id: string) {
    let h = rotationBucket;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    return (h % 1000) / 1000; // 0..1, stable within this rotation window
  }

  // Ranking: base = profile completeness + recency; premium tiers get a capped multiplier
  // so a single account cannot fully dominate discovery, per spec §28/§31.
  const ranked = candidates
    .map((p) => {
      const sub = p.user.subscriptions[0];
      const priority = sub ? Number((sub.plan.features as any)?.discoveryPriority ?? 1) : 0;
      // Capped so no single tier can fully dominate discovery over profile quality (spec §28).
      const tierBoost = 1 + Math.min(priority * 0.15, 0.6);
      const recencyBoost = (now.getTime() - p.updatedAt.getTime()) / (1000 * 60 * 60 * 24) < 7 ? 1.1 : 1;
      const score = (p.completeness / 100) * tierBoost * recencyBoost + seededJitter(p.userId) * 0.3;
      return { p, score, userAge: age(p.dob) };
    })
    .filter((x) => x.userAge >= prefs.ageMin && x.userAge <= prefs.ageMax)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  return NextResponse.json({
    profiles: ranked.map(({ p, userAge }) => ({
      id: p.userId,
      displayName: p.displayName,
      age: userAge,
      city: p.city,
      verified: p.verified,
      bio: p.bio,
      interests: p.interests,
      photoUrl: p.photos[0]?.url ?? null,
    })),
  });
}
