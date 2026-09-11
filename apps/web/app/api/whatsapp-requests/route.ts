import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/** GET — requests waiting on ME to respond, plus ones I've sent and their status. */
export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const [incoming, sent] = await Promise.all([
    prisma.whatsappRequest.findMany({
      where: { targetId: userId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.whatsappRequest.findMany({
      where: { requesterId: userId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Only attach the actual phone number once accepted — never before.
  const acceptedTargetIds = sent.filter((r) => r.status === "ACCEPTED").map((r) => r.targetId);
  const numbers = acceptedTargetIds.length
    ? await prisma.user.findMany({ where: { id: { in: acceptedTargetIds } }, select: { id: true, phone: true } })
    : [];
  const phoneById = Object.fromEntries(numbers.map((n) => [n.id, n.phone]));

  const requesterIds = incoming.map((r) => r.requesterId);
  const requesters = requesterIds.length
    ? await prisma.profile.findMany({ where: { userId: { in: requesterIds } }, select: { userId: true, displayName: true } })
    : [];
  const nameByUserId = Object.fromEntries(requesters.map((p) => [p.userId, p.displayName]));

  return NextResponse.json({
    incoming: incoming.map((r) => ({ ...r, requesterName: nameByUserId[r.requesterId] || "Someone" })),
    sent: sent.map((r) => ({ ...r, revealedNumber: r.status === "ACCEPTED" ? phoneById[r.targetId] : null })),
  });
}

/** POST — request someone's WhatsApp number. */
export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { targetId } = await req.json();
  if (!targetId || targetId === userId) {
    return NextResponse.json({ error: "Invalid target" }, { status: 400 });
  }

  const blocked = await prisma.block.findFirst({
    where: { OR: [{ blockerId: userId, blockedId: targetId }, { blockerId: targetId, blockedId: userId }] },
  });
  if (blocked) return NextResponse.json({ error: "Not available" }, { status: 403 });

  const request = await prisma.whatsappRequest.upsert({
    where: { requesterId_targetId: { requesterId: userId, targetId } },
    update: { status: "PENDING", respondedAt: null },
    create: { requesterId: userId, targetId, status: "PENDING" },
  });

  await prisma.notification.create({
    data: { userId: targetId, type: "WHATSAPP_REQUEST", payload: { requesterId: userId } },
  }).catch(() => {});

  return NextResponse.json({ success: true, request });
}

/** PATCH — the target accepts, declines, or later revokes a previously-accepted request. */
export async function PATCH(req: NextRequest) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { requesterId, action } = await req.json();
  if (!["ACCEPT", "DECLINE", "REVOKE"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const existing = await prisma.whatsappRequest.findUnique({
    where: { requesterId_targetId: { requesterId, targetId: userId } },
  });
  if (!existing) return NextResponse.json({ error: "Request not found" }, { status: 404 });

  const status = action === "ACCEPT" ? "ACCEPTED" : action === "DECLINE" ? "DECLINED" : "REVOKED";
  await prisma.whatsappRequest.update({
    where: { requesterId_targetId: { requesterId, targetId: userId } },
    data: { status, respondedAt: new Date() },
  });

  if (status === "ACCEPTED") {
    await prisma.notification.create({
      data: { userId: requesterId, type: "WHATSAPP_ACCEPTED", payload: { targetId: userId } },
    }).catch(() => {});
  }

  return NextResponse.json({ success: true });
}
