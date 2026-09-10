import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserId } from "@/lib/auth/session";
import { notify } from "@/lib/notifications/notify";
import { NOTIFICATION_TYPES } from "@dating-platform/shared";

export const dynamic = "force-dynamic";

const schema = z.object({ followingId: z.string().cuid() });

export async function POST(req: NextRequest) {
  const followerId = await getCurrentUserId(req);
  if (!followerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  if (parsed.data.followingId === followerId) {
    return NextResponse.json({ error: "Cannot follow yourself." }, { status: 400 });
  }

  await prisma.follower.upsert({
    where: { followerId_followingId: { followerId, followingId: parsed.data.followingId } },
    update: {},
    create: { followerId, followingId: parsed.data.followingId },
  });
  await notify(parsed.data.followingId, NOTIFICATION_TYPES.NEW_FOLLOWER, { fromUserId: followerId });
  return NextResponse.json({ following: true });
}

export async function DELETE(req: NextRequest) {
  const followerId = await getCurrentUserId(req);
  if (!followerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await prisma.follower.deleteMany({
    where: { followerId, followingId: parsed.data.followingId },
  });
  return NextResponse.json({ following: false });
}
