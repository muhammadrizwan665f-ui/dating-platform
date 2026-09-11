import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [profile, activeSub, likesCount, matchesCount, connectionsCount, unreadNotifs, unreadMessages] = await Promise.all([
    prisma.profile.findUnique({ where: { userId }, select: { displayName: true, completeness: true, status: true } }),
    prisma.subscription.findFirst({ where: { userId, status: "ACTIVE", endDate: { gt: new Date() } }, include: { plan: true } }),
    prisma.like.count({ where: { toUserId: userId } }),
    prisma.match.count({ where: { OR: [{ user1Id: userId }, { user2Id: userId }] } }),
    prisma.connection.count({ where: { status: "ACCEPTED", OR: [{ requesterId: userId }, { addresseeId: userId }] } }),
    prisma.notification.count({ where: { userId, readAt: null } }),
    prisma.conversation.count({ where: { OR: [{ user1Id: userId }, { user2Id: userId }], lastMessageAt: { not: null } } }),
  ]);

  return NextResponse.json({
    displayName: profile?.displayName ?? null,
    profileCompleteness: profile?.completeness ?? 0,
    profileStatus: profile?.status ?? "DRAFT",
    membershipPlan: activeSub?.plan?.name ?? null,
    likesReceived: likesCount,
    matches: matchesCount,
    connections: connectionsCount,
    unreadNotifications: unreadNotifs,
    conversations: unreadMessages,
  });
}
