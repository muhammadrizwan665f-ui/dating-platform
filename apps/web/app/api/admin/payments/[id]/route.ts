import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/session";
import { notify } from "@/lib/notifications/notify";
import {
  NOTIFICATION_TYPES,
  PAYMENT_STATUS,
  SUBSCRIPTION_STATUS,
  ROLES,
} from "../../../../../../packages/shared/constants";

const actionSchema = z.object({
  action: z.enum(["APPROVE", "REJECT", "NEEDS_INFO"]),
  note: z.string().max(500).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireRole(req, [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MODERATOR]);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = actionSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const payment = await prisma.payment.findUnique({ where: { id: params.id } });
  if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const statusMap = {
    APPROVE: PAYMENT_STATUS.APPROVED,
    REJECT: PAYMENT_STATUS.REJECTED,
    NEEDS_INFO: PAYMENT_STATUS.NEEDS_INFO,
  } as const;

  const updated = await prisma.$transaction(async (tx) => {
    const p = await tx.payment.update({
      where: { id: params.id },
      data: { status: statusMap[parsed.data.action], reviewedBy: admin.id },
    });

    if (parsed.data.action === "APPROVE") {
      const plan = await tx.membershipPlan.findUniqueOrThrow({ where: { id: p.planId } });
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + plan.durationDays * 86400000);
      await tx.subscription.create({
        data: {
          userId: p.userId,
          planId: p.planId,
          status: SUBSCRIPTION_STATUS.ACTIVE,
          startDate,
          endDate,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        adminId: admin.id,
        action: `PAYMENT_${parsed.data.action}`,
        target: `payment:${p.id}`,
        meta: { note: parsed.data.note ?? null },
      },
    });

    return p;
  });

  const notifType =
    parsed.data.action === "APPROVE"
      ? NOTIFICATION_TYPES.PAYMENT_APPROVED
      : NOTIFICATION_TYPES.PAYMENT_REJECTED;
  await notify(updated.userId, notifType, { paymentId: updated.id, note: parsed.data.note });

  return NextResponse.json({ payment: updated });
}
