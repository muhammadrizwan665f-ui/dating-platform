import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/session";
import { ROLES } from "@dating-platform/shared";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await requireRole(req, [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MODERATOR]);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? undefined;
  const status = searchParams.get("status") ?? undefined;

  const users = await prisma.user.findMany({
    where: {
      ...(status ? { status: status as any } : {}),
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: "insensitive" } },
              { phone: { contains: q } },
              { profile: { displayName: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    // Never select passwordHash — admins must never see it, plaintext or hashed.
    select: {
      id: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      createdAt: true,
      profile: { select: { displayName: true, status: true, gender: true, city: true, verified: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ users });
}

const actionSchema = z.object({
  userId: z.string().cuid(),
  action: z.enum(["SUSPEND", "BAN", "UNBAN", "ACTIVATE"]),
  note: z.string().max(500).optional(),
});

export async function PATCH(req: NextRequest) {
  const admin = await requireRole(req, [ROLES.ADMIN, ROLES.SUPER_ADMIN]);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = actionSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const statusMap = { SUSPEND: "SUSPENDED", BAN: "BANNED", UNBAN: "ACTIVE", ACTIVATE: "ACTIVE" } as const;

  const [user] = await prisma.$transaction([
    prisma.user.update({ where: { id: parsed.data.userId }, data: { status: statusMap[parsed.data.action] } }),
    prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: `USER_${parsed.data.action}`,
        target: `user:${parsed.data.userId}`,
        meta: { note: parsed.data.note ?? null },
      },
    }),
  ]);

  return NextResponse.json({ user });
}
