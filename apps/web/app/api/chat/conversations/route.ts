import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
    orderBy: { lastMessageAt: "desc" },
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const otherUserIds = conversations.map((c) => (c.user1Id === userId ? c.user2Id : c.user1Id));
  const profiles = await prisma.profile.findMany({
    where: { userId: { in: otherUserIds } },
    include: { photos: true },
  });
  const profileByUserId = new Map(profiles.map((p) => [p.userId, p]));

  const shaped = await Promise.all(
    conversations.map(async (c) => {
      const otherId = c.user1Id === userId ? c.user2Id : c.user1Id;
      const otherProfile = profileByUserId.get(otherId);
      const unreadCount = await prisma.message.count({
        where: { conversationId: c.id, senderId: { not: userId }, status: { not: "READ" } },
      });
      return {
        id: c.id,
        otherUser: {
          id: otherId,
          displayName: otherProfile?.displayName ?? "Member",
          photoUrl: otherProfile?.photos.find((p) => p.isPrimary)?.url,
        },
        lastMessage: c.messages[0]?.body,
        lastMessageAt: c.messages[0]?.createdAt ?? c.createdAt,
        unreadCount,
      };
    })
  );

  return NextResponse.json({ conversations: shaped });
}
