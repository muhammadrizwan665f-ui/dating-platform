import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserId } from "@/lib/auth/session";
import { notify } from "@/lib/notifications/notify";
import { NOTIFICATION_TYPES } from "@dating-platform/shared";

const schema = z.object({ connectionId: z.string().cuid(), action: z.enum(["ACCEPT", "DECLINE"]) });

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const connection = await prisma.connection.findUnique({ where: { id: parsed.data.connectionId } });
  // Only the invited party can accept/decline — the requester cannot approve their own request.
  if (!connection || connection.addresseeId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.connection.update({
    where: { id: connection.id },
    data: { status: parsed.data.action === "ACCEPT" ? "ACCEPTED" : "DECLINED" },
  });

  if (parsed.data.action === "ACCEPT") {
    await notify(connection.requesterId, NOTIFICATION_TYPES.CONNECTION_ACCEPTED, { byUserId: userId });
  }

  return NextResponse.json({ connection: updated });
}
