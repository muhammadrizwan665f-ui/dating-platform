import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/session";
import { ROLES } from "../../../../../../packages/shared/constants";

export async function GET(req: NextRequest) {
  const admin = await requireRole(req, [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MODERATOR]);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "PENDING_REVIEW";

  const payments = await prisma.payment.findMany({
    where: { status: status as any },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: { select: { id: true, email: true, phone: true, profile: { select: { displayName: true } } } },
      plan: true,
      method: true,
    },
  });

  return NextResponse.json({ payments });
}
