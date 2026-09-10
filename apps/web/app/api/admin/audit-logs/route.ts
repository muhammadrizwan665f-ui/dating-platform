import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/session";
import { ROLES } from "@dating-platform/shared";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Only real ADMIN/SUPER_ADMIN — audit trail visibility is not for moderators.
  const admin = await requireRole(req, [ROLES.ADMIN, ROLES.SUPER_ADMIN]);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const adminIds = [...new Set(logs.map((l) => l.adminId))];
  const admins = await prisma.user.findMany({ where: { id: { in: adminIds } }, select: { id: true, email: true } });
  const emailById = Object.fromEntries(admins.map((a) => [a.id, a.email]));

  return NextResponse.json({
    logs: logs.map((l) => ({ ...l, adminEmail: emailById[l.adminId] || l.adminId })),
  });
}
