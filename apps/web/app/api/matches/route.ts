import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const matches = await prisma.match.findMany({
    where: { OR: [{ user1Id: userId }, { user2Id: userId }], status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });

  const otherIds = matches.map((m) => (m.user1Id === userId ? m.user2Id : m.user1Id));
  const profiles = await prisma.profile.findMany({
    where: { userId: { in: otherIds } },
    include: { photos: { where: { isPrimary: true }, take: 1 } },
  });
  const byUserId = new Map(profiles.map((p) => [p.userId, p]));

  return NextResponse.json({
    matches: matches.map((m) => {
      const otherId = m.user1Id === userId ? m.user2Id : m.user1Id;
      const p = byUserId.get(otherId);
      return {
        matchId: m.id,
        userId: otherId,
        displayName: p?.displayName ?? "Member",
        city: p?.city,
        photoUrl: p?.photos[0]?.url ?? null,
        matchedAt: m.createdAt,
      };
    }),
  });
}
