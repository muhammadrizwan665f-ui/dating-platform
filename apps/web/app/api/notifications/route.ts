import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const unreadCount = await prisma.notification.count({ where: { userId, readAt: null } });

  return NextResponse.json({ notifications, unreadCount });
}

const readSchema = z.object({ ids: z.array(z.string().cuid()).optional() });

export async function PATCH(req: NextRequest) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = readSchema.safeParse(await req.json().catch(() => ({})));
  const ids = parsed.success ? parsed.data.ids : undefined;

  // A user can only mark their own notifications read — scoped by userId regardless of ids passed.
  await prisma.notification.updateMany({
    where: { userId, readAt: null, ...(ids ? { id: { in: ids } } : {}) },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
