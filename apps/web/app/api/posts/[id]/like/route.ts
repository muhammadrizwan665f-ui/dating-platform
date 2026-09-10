import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserId } from "@/lib/auth/session";
import { notify } from "@/lib/notifications/notify";
import { NOTIFICATION_TYPES } from "@dating-platform/shared";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const post = await prisma.post.findUnique({ where: { id: params.id } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await prisma.postLike.findUnique({
    where: { postId_userId: { postId: params.id, userId } },
  });

  if (existing) {
    await prisma.postLike.delete({ where: { id: existing.id } });
    return NextResponse.json({ liked: false });
  }

  await prisma.postLike.create({ data: { postId: params.id, userId } });
  if (post.authorId !== userId) {
    await notify(post.authorId, NOTIFICATION_TYPES.POST_LIKE, { postId: post.id, fromUserId: userId });
  }
  return NextResponse.json({ liked: true });
}
