import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/session";
import { ROLES } from "../../../../../../packages/shared/constants";

export async function GET(req: NextRequest) {
  const admin = await requireRole(req, [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MODERATOR]);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "SUBMITTED";

  const profiles = await prisma.profile.findMany({
    where: { status: status as any },
    orderBy: { createdAt: "asc" },
    take: 50,
    include: { photos: true, user: { select: { email: true, phone: true } } },
  });

  return NextResponse.json({ profiles });
}
