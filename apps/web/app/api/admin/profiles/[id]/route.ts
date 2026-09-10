import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/session";
import { notify } from "@/lib/notifications/notify";
import { NOTIFICATION_TYPES, PROFILE_STATUS, ROLES } from "@dating-platform/shared";

const schema = z.object({ action: z.enum(["APPROVE", "REJECT"]), reason: z.string().max(500).optional() });

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireRole(req, [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MODERATOR]);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const profile = await prisma.profile.findUnique({ where: { id: params.id } });
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const newStatus = parsed.data.action === "APPROVE" ? PROFILE_STATUS.APPROVED : PROFILE_STATUS.REJECTED;

  const [updated] = await prisma.$transaction([
    prisma.profile.update({ where: { id: params.id }, data: { status: newStatus } }),
    prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: `PROFILE_${parsed.data.action}`,
        target: `profile:${params.id}`,
        meta: { reason: parsed.data.reason ?? null },
      },
    }),
  ]);

  await notify(
    profile.userId,
    parsed.data.action === "APPROVE" ? NOTIFICATION_TYPES.PROFILE_APPROVED : NOTIFICATION_TYPES.PROFILE_REJECTED,
    { reason: parsed.data.reason }
  );

  return NextResponse.json({ profile: updated });
}
