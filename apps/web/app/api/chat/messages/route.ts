import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserId } from "@/lib/auth/session";
import { emitToUser } from "@/lib/realtime/emit";
import { NOTIFICATION_TYPES } from "@dating-platform/shared";
import { notify } from "@/lib/notifications/notify";

const sendSchema = z.object({
  conversationId: z.string().cuid(),
  body: z.string().min(1).max(2000),
});

async function assertParticipant(conversationId: string, userId: string) {
  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation) return null;
  if (conversation.user1Id !== userId && conversation.user2Id !== userId) return null;
  return conversation;
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = sendSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { conversationId, body } = parsed.data;

  // A user must only ever write into a conversation they are a participant of.
  const conversation = await assertParticipant(conversationId, userId);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  const otherUserId = conversation.user1Id === userId ? conversation.user2Id : conversation.user1Id;

  const blocked = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: userId, blockedId: otherUserId },
        { blockerId: otherUserId, blockedId: userId },
      ],
    },
  });
  if (blocked) return NextResponse.json({ error: "Unable to send message." }, { status: 403 });

  const message = await prisma.message.create({
    data: { conversationId, senderId: userId, body },
  });
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date() },
  });

  // Push over the realtime channel; DB write above is the durable source of truth,
  // this just avoids the receiver needing to poll.
  emitToUser(otherUserId, "message:new", { conversationId, message });
  await notify(otherUserId, NOTIFICATION_TYPES.NEW_MESSAGE, { conversationId, from: userId });

  return NextResponse.json({ message }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get("conversationId");
  const cursor = searchParams.get("cursor") ?? undefined;
  if (!conversationId) return NextResponse.json({ error: "conversationId required" }, { status: 400 });

  const conversation = await assertParticipant(conversationId, userId);
  if (!conversation) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: 30,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  return NextResponse.json({ messages: messages.reverse() });
}
