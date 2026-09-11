import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/session";
import { ROLES } from "@dating-platform/shared";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await requireRole(req, [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MODERATOR]);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      author: { select: { email: true } },
      images: { take: 1 },
      _count: { select: { likes: true, comments: true } },
    },
  });
  return NextResponse.json({ posts });
}

export async function PATCH(req: NextRequest) {
  const admin = await requireRole(req, [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MODERATOR]);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, status } = await req.json();
  if (!id || !["VISIBLE", "HIDDEN", "REMOVED"].includes(status)) {
    return NextResponse.json({ error: "Invalid id or status" }, { status: 400 });
  }

  const post = await prisma.post.update({ where: { id }, data: { status } });
  await prisma.auditLog.create({ data: { adminId: admin.id, action: `POST_${status}`, target: id } });
  return NextResponse.json({ success: true, post });
}
