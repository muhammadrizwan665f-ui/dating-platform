import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/** GET — people who liked me (not yet mutual), and people I've liked. */
export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [likedMe, myLikes, myMatches] = await Promise.all([
    prisma.like.findMany({ where: { toUserId: userId }, orderBy: { createdAt: "desc" } }),
    prisma.like.findMany({ where: { fromUserId: userId }, orderBy: { createdAt: "desc" } }),
    prisma.match.findMany({ where: { OR: [{ user1Id: userId }, { user2Id: userId }] } }),
  ]);

  const matchedIds = new Set(myMatches.map((m) => (m.user1Id === userId ? m.user2Id : m.user1Id)));
  // "Who liked me" should exclude people already matched — they belong in Matches instead.
  const pendingLikers = likedMe.filter((l) => !matchedIds.has(l.fromUserId));

  const otherIds = [...new Set([...pendingLikers.map((l) => l.fromUserId), ...myLikes.map((l) => l.toUserId)])];
  const profiles = otherIds.length
    ? await prisma.profile.findMany({
        where: { userId: { in: otherIds } },
        select: { userId: true, displayName: true, city: true, photos: { where: { isPrimary: true }, take: 1 } },
      })
    : [];
  const profileByUserId = Object.fromEntries(profiles.map((p) => [p.userId, p]));

  return NextResponse.json({
    likedMe: pendingLikers.map((l) => ({ userId: l.fromUserId, profile: profileByUserId[l.fromUserId] || null })),
    myLikes: myLikes.map((l) => ({ userId: l.toUserId, profile: profileByUserId[l.toUserId] || null })),
  });
}
