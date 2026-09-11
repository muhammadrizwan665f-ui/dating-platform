import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/session";
import { ROLES } from "@dating-platform/shared";

export const dynamic = "force-dynamic";

/**
 * Message OVERSIGHT, not a content browser — private chat stays private.
 * Admins get aggregate numbers plus a list of conversations (participants,
 * message count, last activity) with no message bodies exposed, unless a
 * specific report/investigation route is built separately later.
 */
export async function GET(req: NextRequest) {
  const admin = await requireRole(req, [ROLES.ADMIN, ROLES.SUPER_ADMIN]);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [totalMessages, todayMessages, conversations] = await Promise.all([
    prisma.message.count(),
    prisma.message.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
    prisma.conversation.findMany({
      take: 50,
      orderBy: { lastMessageAt: "desc" },
      include: { _count: { select: { messages: true } } },
    }),
  ]);

  const userIds = [...new Set(conversations.flatMap((c) => [c.user1Id, c.user2Id]))];
  const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, email: true } });
  const emailById = Object.fromEntries(users.map((u) => [u.id, u.email]));

  return NextResponse.json({
    totalMessages,
    todayMessages,
    conversations: conversations.map((c) => ({
      id: c.id,
      participants: [emailById[c.user1Id], emailById[c.user2Id]],
      messageCount: c._count.messages,
      lastMessageAt: c.lastMessageAt,
    })),
  });
}
