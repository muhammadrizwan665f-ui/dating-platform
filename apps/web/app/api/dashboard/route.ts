import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [profile, activeSub, likesCount, matchesCount, connectionsCount, unreadNotifs, unreadMessages, profileViews, recentLikes, recentMatches] =
    await Promise.all([
      prisma.profile.findUnique({
        where: { userId },
        select: {
          displayName: true, completeness: true, status: true, city: true, dob: true, verified: true,
          photos: { where: { isPrimary: true }, take: 1, select: { url: true } },
        },
      }),
      prisma.subscription.findFirst({ where: { userId, status: "ACTIVE", endDate: { gt: new Date() } }, include: { plan: true } }),
      prisma.like.count({ where: { toUserId: userId } }),
      prisma.match.count({ where: { OR: [{ user1Id: userId }, { user2Id: userId }] } }),
      prisma.connection.count({ where: { status: "ACCEPTED", OR: [{ requesterId: userId }, { addresseeId: userId }] } }),
      prisma.notification.count({ where: { userId, readAt: null } }),
      prisma.conversation.count({ where: { OR: [{ user1Id: userId }, { user2Id: userId }], lastMessageAt: { not: null } } }),
      prisma.profileView.count({ where: { viewedId: userId } }),
      prisma.like.findMany({ where: { toUserId: userId }, orderBy: { createdAt: "desc" }, take: 3, select: { fromUserId: true, createdAt: true } }),
      prisma.match.findMany({
        where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
        orderBy: { createdAt: "desc" },
        take: 2,
        select: { user1Id: true, user2Id: true, createdAt: true },
      }),
    ]);

  // A featured "you could like" suggestion: an approved profile you haven't liked/passed yet.
  const alreadyLikedIds = (await prisma.like.findMany({ where: { fromUserId: userId }, select: { toUserId: true } })).map((l) => l.toUserId);
  const featured = await prisma.profile.findFirst({
    where: { status: "APPROVED", userId: { notIn: [...alreadyLikedIds, userId] } },
    include: { photos: { where: { isPrimary: true }, take: 1 } },
    orderBy: { completeness: "desc" },
  });

  const activityIds = [...recentLikes.map((l) => l.fromUserId), ...recentMatches.flatMap((m) => [m.user1Id, m.user2Id])];
  const activityProfiles = activityIds.length
    ? await prisma.profile.findMany({ where: { userId: { in: activityIds } }, select: { userId: true, displayName: true } })
    : [];
  const nameByUserId = Object.fromEntries(activityProfiles.map((p) => [p.userId, p.displayName]));

  const recentActivity = [
    ...recentLikes.map((l) => ({ type: "LIKE", text: `${nameByUserId[l.fromUserId] || "Someone"} liked your profile`, at: l.createdAt })),
    ...recentMatches.map((m) => {
      const otherId = m.user1Id === userId ? m.user2Id : m.user1Id;
      return { type: "MATCH", text: `You matched with ${nameByUserId[otherId] || "someone"}`, at: m.createdAt };
    }),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 5);

  const age = profile?.dob
    ? (() => {
        const now = new Date();
        const diff = now.getFullYear() - profile.dob.getFullYear();
        const before = now.getMonth() < profile.dob.getMonth() || (now.getMonth() === profile.dob.getMonth() && now.getDate() < profile.dob.getDate());
        return before ? diff - 1 : diff;
      })()
    : null;

  return NextResponse.json({
    displayName: profile?.displayName ?? null,
    photoUrl: profile?.photos[0]?.url ?? null,
    city: profile?.city ?? null,
    age,
    verified: profile?.verified ?? false,
    profileCompleteness: profile?.completeness ?? 0,
    profileStatus: profile?.status ?? "DRAFT",
    membershipPlan: activeSub?.plan?.name ?? null,
    likesReceived: likesCount,
    matches: matchesCount,
    connections: connectionsCount,
    unreadNotifications: unreadNotifs,
    conversations: unreadMessages,
    profileViews,
    recentActivity,
    featuredProfile: featured
      ? {
          userId: featured.userId,
          displayName: featured.displayName,
          age: (() => {
            const now = new Date();
            const diff = now.getFullYear() - featured.dob.getFullYear();
            const before = now.getMonth() < featured.dob.getMonth() || (now.getMonth() === featured.dob.getMonth() && now.getDate() < featured.dob.getDate());
            return before ? diff - 1 : diff;
          })(),
          city: featured.city,
          bio: featured.bio,
          verified: featured.verified,
          photoUrl: featured.photos[0]?.url ?? null,
        }
      : null,
  });
}
