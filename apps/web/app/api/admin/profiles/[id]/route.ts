import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/session";
import { notify } from "@/lib/notifications/notify";
import { NOTIFICATION_TYPES, PROFILE_STATUS, ROLES } from "@dating-platform/shared";

export const dynamic = "force-dynamic";

const schema = z.object({
  action: z.enum(["APPROVE", "REJECT", "REQUEST_CHANGES", "SUSPEND", "BAN"]),
  reason: z.string().max(500).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireRole(req, [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MODERATOR]);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const profile = await prisma.profile.findUnique({ where: { id: params.id } });
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { action, reason } = parsed.data;

  const profileStatusMap: Record<string, string> = {
    APPROVE: PROFILE_STATUS.APPROVED,
    REJECT: PROFILE_STATUS.REJECTED,
    REQUEST_CHANGES: PROFILE_STATUS.DRAFT,
    SUSPEND: PROFILE_STATUS.SUSPENDED,
  };

  const updated = await prisma.$transaction(async (tx) => {
    let p = profile;
    if (profileStatusMap[action]) {
      p = await tx.profile.update({ where: { id: params.id }, data: { status: profileStatusMap[action] as any } });
    }
    if (action === "BAN") {
      await tx.user.update({ where: { id: profile.userId }, data: { status: "BANNED", sessionVersion: { increment: 1 } } });
      p = await tx.profile.update({ where: { id: params.id }, data: { status: PROFILE_STATUS.SUSPENDED as any, hiddenFromDiscovery: true } });
    }
    await tx.auditLog.create({
      data: { adminId: admin.id, action: `PROFILE_${action}`, target: `profile:${params.id}`, meta: { reason: reason ?? null } },
    });
    return p;
  });

  const notifType =
    action === "APPROVE" ? NOTIFICATION_TYPES.PROFILE_APPROVED :
    action === "REJECT" || action === "REQUEST_CHANGES" ? NOTIFICATION_TYPES.PROFILE_REJECTED :
    null;
  if (notifType) await notify(profile.userId, notifType, { reason, action });

  return NextResponse.json({ profile: updated });
}
