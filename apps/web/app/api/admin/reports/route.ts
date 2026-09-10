import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/session";
import { ROLES, REPORT_STATUS } from "@dating-platform/shared";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await requireRole(req, [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MODERATOR]);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? REPORT_STATUS.OPEN;

  const reports = await prisma.report.findMany({
    where: { status: status as any },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { reporter: { select: { id: true, email: true, phone: true } } },
  });

  return NextResponse.json({ reports });
}

const actionSchema = z.object({
  reportId: z.string().cuid(),
  status: z.enum(["UNDER_REVIEW", "RESOLVED", "DISMISSED"]),
  note: z.string().max(1000).optional(),
});

export async function PATCH(req: NextRequest) {
  const admin = await requireRole(req, [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MODERATOR]);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = actionSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const [report] = await prisma.$transaction([
    prisma.report.update({ where: { id: parsed.data.reportId }, data: { status: parsed.data.status } }),
    prisma.adminNote.create({
      data: {
        targetType: "REPORT",
        targetId: parsed.data.reportId,
        adminId: admin.id,
        note: parsed.data.note ?? `Status changed to ${parsed.data.status}`,
      },
    }),
    prisma.auditLog.create({
      data: { adminId: admin.id, action: "REPORT_STATUS_CHANGE", target: `report:${parsed.data.reportId}`, meta: parsed.data },
    }),
  ]);

  return NextResponse.json({ report });
}
