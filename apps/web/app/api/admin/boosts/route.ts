import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/session";
import { ROLES } from "@dating-platform/shared";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await requireRole(req, [ROLES.ADMIN, ROLES.SUPER_ADMIN]);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const boosts = await prisma.boost.findMany({ orderBy: { startsAt: "desc" }, take: 100 });
  const userIds = [...new Set(boosts.map((b) => b.userId))];
  const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, email: true } });
  const emailById = Object.fromEntries(users.map((u) => [u.id, u.email]));

  const now = new Date();
  return NextResponse.json({
    boosts: boosts.map((b) => ({
      ...b,
      userEmail: emailById[b.userId] || b.userId,
      isActive: b.startsAt <= now && b.endsAt >= now,
    })),
  });
}
