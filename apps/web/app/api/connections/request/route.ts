import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserId } from "@/lib/auth/session";
import { notify } from "@/lib/notifications/notify";
import { NOTIFICATION_TYPES } from "@dating-platform/shared";

const requestSchema = z.object({ addresseeId: z.string().cuid() });

export async function POST(req: NextRequest) {
  const requesterId = await getCurrentUserId(req);
  if (!requesterId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = requestSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { addresseeId } = parsed.data;
  if (addresseeId === requesterId) {
    return NextResponse.json({ error: "Cannot connect with yourself." }, { status: 400 });
  }

  const blocked = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: requesterId, blockedId: addresseeId },
        { blockerId: addresseeId, blockedId: requesterId },
      ],
    },
  });
  if (blocked) return NextResponse.json({ error: "Unable to connect." }, { status: 403 });

  const connection = await prisma.connection.upsert({
    where: { requesterId_addresseeId: { requesterId, addresseeId } },
    update: {},
    create: { requesterId, addresseeId, status: "PENDING" },
  });

  await notify(addresseeId, NOTIFICATION_TYPES.CONNECTION_REQUEST, { fromUserId: requesterId });
  return NextResponse.json({ connection }, { status: 201 });
}
