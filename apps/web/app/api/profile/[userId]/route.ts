import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/** Public-ish profile detail — viewer must be logged in, target must be
 *  approved/visible, and neither side may have blocked the other. */
export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  const viewerId = await getCurrentUserId(req);
  if (!viewerId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { userId } = params;

  const blocked = await prisma.block.findFirst({
    where: { OR: [{ blockerId: viewerId, blockedId: userId }, { blockerId: userId, blockedId: viewerId }] },
  });
  if (blocked) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: { photos: { orderBy: { position: "asc" } } },
  });
  if (!profile || (profile.status !== "APPROVED" && userId !== viewerId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (userId !== viewerId) {
    await prisma.profileView.create({ data: { viewerId, viewedId: userId, action: "VIEW" } }).catch(() => {});
  }

  const now = new Date();
  const age = (() => {
    const diff = now.getFullYear() - profile.dob.getFullYear();
    const before = now.getMonth() < profile.dob.getMonth() || (now.getMonth() === profile.dob.getMonth() && now.getDate() < profile.dob.getDate());
    return before ? diff - 1 : diff;
  })();

  const [alreadyLiked, whatsappStatus, posts] = await Promise.all([
    prisma.like.findUnique({ where: { fromUserId_toUserId: { fromUserId: viewerId, toUserId: userId } } }).catch(() => null),
    prisma.whatsappRequest.findUnique({ where: { requesterId_targetId: { requesterId: viewerId, targetId: userId } } }),
    prisma.post.findMany({
      where: { authorId: userId, status: "VISIBLE" },
      include: { images: { take: 1 }, _count: { select: { likes: true, comments: true } } },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  return NextResponse.json({
    userId,
    displayName: profile.displayName,
    age,
    city: profile.city,
    bio: profile.bio,
    interests: profile.interests,
    intention: profile.intention,
    education: profile.education,
    profession: profile.profession,
    languages: profile.languages,
    verified: profile.verified,
    photos: profile.photos.map((p) => p.url),
    isSelf: userId === viewerId,
    alreadyLiked: !!alreadyLiked,
    whatsappStatus: whatsappStatus?.status ?? null,
    posts: posts.map((post) => ({
      id: post.id,
      caption: post.caption,
      imageUrl: post.images[0]?.url ?? null,
      likeCount: post._count.likes,
      commentCount: post._count.comments,
      createdAt: post.createdAt,
    })),
  });
}
