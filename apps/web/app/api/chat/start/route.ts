import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const schema = z.object({ targetUserId: z.string().cuid() });

/**
 * Finds or creates a conversation with any other user — messaging is not
 * gated behind a match or a "connection request" here: anyone can message
 * anyone, and the recipient's defense is Block (checked below), matching a
 * DM-request-style pattern rather than a pre-approval gate.
 */
export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { targetUserId } = parsed.data;

  if (targetUserId === userId) {
    return NextResponse.json({ error: "Can't message yourself" }, { status: 400 });
  }

  const blocked = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: userId, blockedId: targetUserId },
        { blockerId: targetUserId, blockedId: userId },
      ],
    },
  });
  if (blocked) return NextResponse.json({ error: "Unable to message this user." }, { status: 403 });

  const targetProfile = await prisma.profile.findUnique({ where: { userId: targetUserId }, select: { status: true } });
  if (!targetProfile || targetProfile.status !== "APPROVED") {
    return NextResponse.json({ error: "This profile isn't available right now." }, { status: 404 });
  }

  // user1Id/user2Id has no fixed "who initiated" meaning in the schema, but
  // we need a consistent order to satisfy the @@unique([user1Id, user2Id]).
  const [user1Id, user2Id] = [userId, targetUserId].sort();

  const conversation = await prisma.conversation.upsert({
    where: { user1Id_user2Id: { user1Id, user2Id } },
    update: {},
    create: { user1Id, user2Id },
  });

  return NextResponse.json({ conversationId: conversation.id });
}
