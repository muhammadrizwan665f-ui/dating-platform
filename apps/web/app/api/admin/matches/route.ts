import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/session";
import { ROLES } from "@dating-platform/shared";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await requireRole(req, [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MODERATOR]);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const matches = await prisma.match.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user1: { select: { email: true } },
      user2: { select: { email: true } },
    },
  });
  const total = await prisma.match.count();
  return NextResponse.json({ total, matches });
}
