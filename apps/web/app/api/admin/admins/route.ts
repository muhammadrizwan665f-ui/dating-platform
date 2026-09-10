import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole, getCurrentUserId } from "@/lib/auth/session";
import { ROLES } from "@dating-platform/shared";

export const dynamic = "force-dynamic";

/** Lists everyone with elevated (MODERATOR/ADMIN/SUPER_ADMIN) access. */
export async function GET(req: NextRequest) {
  // Only SUPER_ADMIN manages who has admin access — this is the most
  // security-sensitive screen in the whole panel.
  const admin = await requireRole(req, [ROLES.SUPER_ADMIN]);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admins = await prisma.user.findMany({
    where: { role: { in: ["MODERATOR", "ADMIN", "SUPER_ADMIN"] } },
    select: { id: true, email: true, role: true, status: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ admins });
}

/** Change an existing user's role (promote/demote). Never lets you demote yourself. */
export async function PATCH(req: NextRequest) {
  const admin = await requireRole(req, [ROLES.SUPER_ADMIN]);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const currentUserId = await getCurrentUserId(req);
  const { userId, role } = await req.json();

  if (!userId || !["USER", "MODERATOR", "ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Invalid userId or role" }, { status: 400 });
  }
  if (userId === currentUserId) {
    return NextResponse.json({ error: "You can't change your own role" }, { status: 400 });
  }

  const target = await prisma.user.update({ where: { id: userId }, data: { role, sessionVersion: { increment: 1 } } });

  await prisma.auditLog.create({
    data: { adminId: admin.id, action: "ROLE_CHANGE", target: target.email || target.id, meta: { newRole: role } },
  });

  return NextResponse.json({ success: true });
}

/** Promote an existing regular user to admin/moderator by email. */
export async function POST(req: NextRequest) {
  const admin = await requireRole(req, [ROLES.SUPER_ADMIN]);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { email, role } = await req.json();
  if (!email || !["MODERATOR", "ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Valid email and role are required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: "No account found with that email. They must sign up first." }, { status: 404 });

  await prisma.user.update({ where: { id: user.id }, data: { role, sessionVersion: { increment: 1 } } });
  await prisma.auditLog.create({
    data: { adminId: admin.id, action: "GRANT_ADMIN", target: email, meta: { role } },
  });

  return NextResponse.json({ success: true });
}
