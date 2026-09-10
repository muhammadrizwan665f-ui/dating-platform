import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserId } from "@/lib/auth/session";
import { notify } from "@/lib/notifications/notify";
import { NOTIFICATION_TYPES } from "@dating-platform/shared";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ toUserId: z.string().cuid() });

export async function POST(req: NextRequest) {
  const fromUserId = await getCurrentUserId(req);
  if (!fromUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { toUserId } = parsed.data;

  if (toUserId === fromUserId) {
    return NextResponse.json({ error: "Cannot like your own profile." }, { status: 400 });
  }

  const blocked = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: fromUserId, blockedId: toUserId },
        { blockerId: toUserId, blockedId: fromUserId },
      ],
    },
  });
  if (blocked) {
    return NextResponse.json({ error: "Unable to like this profile." }, { status: 403 });
  }

  // Idempotent: a duplicate like from the same user is a no-op, not an error.
  await prisma.like.upsert({
    where: { fromUserId_toUserId: { fromUserId, toUserId } },
    update: {},
    create: { fromUserId, toUserId },
  });

  const reciprocal = await prisma.like.findUnique({
    where: { fromUserId_toUserId: { fromUserId: toUserId, toUserId: fromUserId } },
  });

  let matched = false;
  if (reciprocal) {
    const [user1Id, user2Id] = [fromUserId, toUserId].sort();
    const match = await prisma.match.upsert({
      where: { user1Id_user2Id: { user1Id, user2Id } },
      update: {},
      create: { user1Id, user2Id },
    });
    matched = true;
    await Promise.all([
      notify(fromUserId, NOTIFICATION_TYPES.NEW_MATCH, { matchId: match.id, otherUserId: toUserId }),
      notify(toUserId, NOTIFICATION_TYPES.NEW_MATCH, { matchId: match.id, otherUserId: fromUserId }),
    ]);
  } else {
    await notify(toUserId, NOTIFICATION_TYPES.NEW_LIKE, { fromUserId });
  }

  return NextResponse.json({ matched });
}
