import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/** Lists my accepted connections, requests I've sent, and requests waiting on me. */
export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [accepted, sentPending, receivedPending] = await Promise.all([
    prisma.connection.findMany({
      where: { status: "ACCEPTED", OR: [{ requesterId: userId }, { addresseeId: userId }] },
      orderBy: { createdAt: "desc" },
    }),
    prisma.connection.findMany({ where: { requesterId: userId, status: "PENDING" }, orderBy: { createdAt: "desc" } }),
    prisma.connection.findMany({ where: { addresseeId: userId, status: "PENDING" }, orderBy: { createdAt: "desc" } }),
  ]);

  const otherIds = [
    ...accepted.map((c) => (c.requesterId === userId ? c.addresseeId : c.requesterId)),
    ...sentPending.map((c) => c.addresseeId),
    ...receivedPending.map((c) => c.requesterId),
  ];
  const profiles = otherIds.length
    ? await prisma.profile.findMany({
        where: { userId: { in: otherIds } },
        select: { userId: true, displayName: true, city: true, photos: { where: { isPrimary: true }, take: 1 } },
      })
    : [];
  const profileByUserId = Object.fromEntries(profiles.map((p) => [p.userId, p]));

  return NextResponse.json({
    connections: accepted.map((c) => {
      const otherId = c.requesterId === userId ? c.addresseeId : c.requesterId;
      return { id: c.id, otherUserId: otherId, profile: profileByUserId[otherId] || null };
    }),
    sentRequests: sentPending.map((c) => ({ id: c.id, otherUserId: c.addresseeId, profile: profileByUserId[c.addresseeId] || null })),
    receivedRequests: receivedPending.map((c) => ({ id: c.id, otherUserId: c.requesterId, profile: profileByUserId[c.requesterId] || null })),
  });
}
