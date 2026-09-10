import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserId } from "@/lib/auth/session";
import { PostStatus as PostStatusT } from "@prisma/client";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  caption: z.string().max(2000).optional(),
  imageKeys: z.array(z.string()).max(10).default([]),
});

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const post = await prisma.post.create({
    data: {
      authorId: userId,
      caption: parsed.data.caption,
      images: { create: parsed.data.imageKeys.map((url, position) => ({ url, position })) },
    },
    include: { images: true },
  });

  return NextResponse.json({ post }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor") ?? undefined;

  const blockedIds = await prisma.block.findMany({
    where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
    select: { blockerId: true, blockedId: true },
  });
  const excludeAuthorIds = new Set<string>();
  for (const b of blockedIds) {
    excludeAuthorIds.add(b.blockerId === userId ? b.blockedId : b.blockerId);
  }

  const posts = await prisma.post.findMany({
    where: { status: "VISIBLE" as PostStatusT, authorId: { notIn: [...excludeAuthorIds] } },
    orderBy: { createdAt: "desc" },
    take: 15,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      images: true,
      author: { include: { profile: { include: { photos: true } } } },
      _count: { select: { likes: true, comments: true } },
      likes: { where: { userId }, select: { id: true } },
    },
  });

  const shaped = posts.map((p) => ({
    id: p.id,
    caption: p.caption,
    createdAt: p.createdAt,
    images: p.images.map((i) => i.url),
    likeCount: p._count.likes,
    commentCount: p._count.comments,
    likedByMe: p.likes.length > 0,
    author: {
      id: p.authorId,
      displayName: p.author.profile?.displayName ?? "Member",
      city: p.author.profile?.city ?? "",
      verified: p.author.profile?.verified ?? false,
      photoUrl: p.author.profile?.photos.find((ph) => ph.isPrimary)?.url ?? p.author.profile?.photos[0]?.url,
    },
  }));

  return NextResponse.json({ posts: shaped, nextCursor: posts.at(-1)?.id ?? null });
}
