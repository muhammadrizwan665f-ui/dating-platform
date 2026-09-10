import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserId } from "@/lib/auth/session";
import { notify } from "@/lib/notifications/notify";
import { NOTIFICATION_TYPES } from "@dating-platform/shared";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ body: z.string().min(1).max(500) });

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const comments = await prisma.comment.findMany({
    where: { postId: params.id, status: "VISIBLE" },
    orderBy: { createdAt: "asc" },
    include: { author: { include: { profile: { include: { photos: true } } } } },
    take: 100,
  });
  return NextResponse.json({
    comments: comments.map((c) => ({
      id: c.id,
      body: c.body,
      createdAt: c.createdAt,
      author: c.author.profile?.displayName ?? "Member",
      photoUrl: c.author.profile?.photos.find((p) => p.isPrimary)?.url,
      isOwn: false,
    })),
  });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const post = await prisma.post.findUnique({ where: { id: params.id } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const comment = await prisma.comment.create({
    data: { postId: params.id, authorId: userId, body: parsed.data.body },
  });

  if (post.authorId !== userId) {
    await notify(post.authorId, NOTIFICATION_TYPES.COMMENT, { postId: post.id, fromUserId: userId });
  }

  return NextResponse.json({ comment }, { status: 201 });
}
